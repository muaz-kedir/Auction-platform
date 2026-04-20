import { RouterProvider, createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SimpleLayout } from './layouts/SimpleLayout';
import { Dashboard } from './pages/Dashboard';
import { AuctionListing } from './pages/AuctionListing';
import { AuctionDetail } from './pages/AuctionDetail';
import { MyBids } from './pages/MyBids';
import { Wallet } from './pages/Wallet';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { SellerDashboard } from './pages/SellerDashboard';
import { MyAuctions } from './pages/MyAuctions';
import { CreateAuction } from './pages/CreateAuction';
import { AdminPanel } from './pages/AdminPanel';
import { UserRoleManagement } from './pages/UserRoleManagement';
import { AnnouncementsManagement } from './pages/AnnouncementsManagement';
import { AuctionApprovalManagement } from './pages/AuctionApprovalManagement';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function AppContent() {
  const router = createBrowserRouter([
    { path: "/", Component: LandingPage },
    { path: "/login", Component: LoginPage },
    { path: "/register", Component: RegisterPage },
    {
      path: "/auctions",
      element: <SimpleLayout />,
      children: [{ index: true, Component: AuctionListing }],
    },
    {
      path: "/auction/:id",
      element: (
        <ProtectedRoute>
          <SimpleLayout />
        </ProtectedRoute>
      ),
      children: [{ index: true, Component: AuctionDetail }],
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, Component: Dashboard },
        { path: "auctions", Component: AuctionListing },
        { path: "auctions/:id", Component: AuctionDetail },
        { path: "my-bids", Component: MyBids },
        { path: "wallet", Component: Wallet },
        { path: "notifications", Component: Notifications },
        { path: "settings", Component: Settings },
        { path: "seller", Component: SellerDashboard },
        { path: "seller/auctions", Component: MyAuctions },
        { path: "seller/create", Component: CreateAuction },
        {
          path: "admin",
          element: (
            <ProtectedRoute requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          ),
        },
        {
          path: "admin/users",
          element: (
            <ProtectedRoute requireAdmin={true}>
              <UserRoleManagement />
            </ProtectedRoute>
          ),
        },
        {
          path: "admin/announcements",
          element: (
            <ProtectedRoute requireAdmin={true}>
              <AnnouncementsManagement />
            </ProtectedRoute>
          ),
        },
        {
          path: "admin/auctions",
          element: (
            <ProtectedRoute requireAdmin={true}>
              <AuctionApprovalManagement />
            </ProtectedRoute>
          ),
        },
      ],
    },
    { path: "*", Component: NotFound },
  ]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
