import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { InstallPrompt } from "@/components/InstallPrompt";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Browse from "./pages/Browse";
import ProviderDetail from "./pages/ProviderDetail";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import Messages from "./pages/Messages";
import Inbox from "./pages/Inbox";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";
import PostRequest from "./pages/PostRequest";
import BecomePro from "./pages/BecomePro";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardOverview, DashboardProfile } from "./pages/dashboard/UserDashboard";
import { AdminOverview, AdminProviders, AdminUsers, AdminReviews, AdminRequests, AdminAds, AdminModeration } from "./pages/admin/AdminPages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/provider/:id" element={<ProviderDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Messages />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/post-request" element={<PostRequest />} />
            <Route path="/become-pro" element={<BecomePro />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/dashboard/profile" element={<DashboardProfile />} />
            </Route>
            <Route element={<DashboardLayout adminOnly />}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/providers" element={<AdminProviders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
              <Route path="/admin/ads" element={<AdminAds />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <InstallPrompt />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
