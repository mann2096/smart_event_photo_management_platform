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
import ManageEventRolesPage from "../pages/ManageEventRolesPage";
import NotificationsPage from "../pages/NotificationsPage";
import FavouritesPage from "../pages/FavouritesPage";
import TaggedIn from "../pages/TaggedIn";
import Public from "../pages/Public";
import UploadPhotos from "../pages/UploadPhotos";
import PhotographerDashboardPage from "../pages/PhotographerDashboardPage";
import { useNotificationsSocket } from "../hooks/useNotificationsSocket";

export default function App() {
  useNotificationsSocket();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/auth/omniport/callback" element={<OmniportCallback />}/>
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/photos" element={<PhotosByEventPage />} />
          <Route path="/photos/upload" element={<UploadPhotos />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="/events/:eventId" element={<EventGalleryPage />} />
          <Route path="/events/:eventId/manage-roles" element={<ManageEventRolesPage />}/>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/favourites" element={<FavouritesPage />} />
          <Route path="/tagged" element={<TaggedIn />} />
          <Route path="/public" element={<Public />} />

          <Route path="/dashboard" element={<PhotographerDashboardPage />}/>
        </Route>
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
