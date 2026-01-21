import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOTP from "../pages/VerifyOTP";
import OmniportCallback from "../pages/OmniportCallback";
import PhotosByEventPage from "../pages/PhotosByEventPage";
import EventGalleryPage from "../pages/EventGalleryPage";
import EventsPage from "../pages/EventsPage";
import CreateEvent from "../pages/CreateEvent";
import NotificationsPage from "../pages/NotificationsPage";
import FavouritesPage from "../pages/FavouritesPage";
import TaggedIn from "../pages/TaggedIn";
import Public from "../pages/Public";
import PhotographerDashboardPage from "../pages/PhotographerDashboardPage";
import ProfilePage from "../pages/ProfilePages";
import ManageEventPage from "../pages/ManageEventPage";
import { useNotificationsSocket } from "../hooks/useNotificationsSocket";
import RouterBootstrap from "../RouterBootstrap";
import JoinEvent from "../pages/JoinEvent";

export default function App() {
  useNotificationsSocket();

  return (
    <BrowserRouter>
      <RouterBootstrap />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/auth/omniport/callback" element={<OmniportCallback />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/photos" element={<PhotosByEventPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="/events/:eventId" element={<EventGalleryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/favourites" element={<FavouritesPage />} />
          <Route path="/tagged" element={<TaggedIn />} />
          <Route path="/public" element={<Public />} />
          <Route path="/dashboard" element={<PhotographerDashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/events/:eventId/manage" element={<ManageEventPage />} />
          <Route path="/join-event/:inviteId" element={<JoinEvent />} />
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
