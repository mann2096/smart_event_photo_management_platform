import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { notificationsApi } from "../services/notificationsApi";
import type { Notification } from "../types/notification";

export function useNotificationsSocket() {
  const dispatch = useAppDispatch();

  const accessToken = useAppSelector(
    (state) => state.auth.accessToken
  );
  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );
  const user = useAppSelector(
    (state) => state.auth.user
  );

  const socketRef = useRef<WebSocket | null>(null);
  const connectedRef = useRef(false);
  const retryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !accessToken ||
      !user || 
      typeof accessToken !== "string" ||
      accessToken.length < 20
    ) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        connectedRef.current = false;
      }
      return;
    }
    if (connectedRef.current) return;

    const API_BASE =
      import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

    const protocol = API_BASE.startsWith("https") ? "wss" : "ws";
    const host = API_BASE.replace(/^https?:\/\//, "");

    const socket = new WebSocket(
      `${protocol}://${host}/ws/notifications/?token=${accessToken}`
    );

    socketRef.current = socket;
    connectedRef.current = true;

    socket.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);

        dispatch(
          notificationsApi.util.updateQueryData(
            "getNotifications",
            undefined,
            (draft) => {
              if (!draft.some((n) => n.id === notification.id)) {
                draft.unshift({
                  ...notification,
                  is_read: false,
                });
              }
            }
          )
        );
      } catch (err) {
        console.error("WebSocket parse error", err);
      }
    };

    socket.onclose = () => {
      socketRef.current = null;
      connectedRef.current = false;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = window.setTimeout(() => {
        connectedRef.current = false;
      }, 2000);
    };

    socket.onerror = () => {
      socket.close();
    };
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      socket.close();
      socketRef.current = null;
      connectedRef.current = false;
    };
  }, [isAuthenticated, accessToken, user, dispatch]);
}
