import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { AuctionListing } from "./pages/AuctionListing";
import { AuctionDetail } from "./pages/AuctionDetail";
import { MyBids } from "./pages/MyBids";
import { Wallet } from "./pages/Wallet";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { SellerPanel } from "./pages/SellerPanel";
import { CreateAuction } from "./pages/CreateAuction";
import { AdminPanel } from "./pages/AdminPanel";
import { NotFound } from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requireAdmin={true}>
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
      { path: "seller", Component: SellerPanel },
      { path: "seller/create", Component: CreateAuction },
      { path: "admin", Component: AdminPanel },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
