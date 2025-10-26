import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { AppLayout } from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POSSystem from "./pages/POSSystem";
import WaiterOrderManagement from "./pages/WaiterOrderManagement";
import TableManagement from "./pages/TableManagement";
import KitchenDisplay from "./pages/KitchenDisplay";
import Inventory from "./pages/Inventory";
import Menu from "./pages/Menu";
import Users from "./pages/Users";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Cashier from "./pages/Cashier";
import { RefreshProvider } from "@/contexts/RefreshContext";

// Super Admin imports
import { SuperAdminLogin } from "./pages/SuperAdminLogin";
import { SuperAdminAuthProvider } from "@/contexts/SuperAdminAuthContext";
import { SuperAdminProtectedRoute } from "@/components/auth/SuperAdminProtectedRoute";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { SuperAdminDashboard } from "./pages/super-admin/Dashboard";
import { ManageRestaurants } from "./pages/super-admin/ManageRestaurants";
import { ManagePlans } from "./pages/super-admin/ManagePlans";
import { ManageSubscriptions } from "./pages/super-admin/ManageSubscriptions";
import { ManageAnnouncements } from "./pages/super-admin/ManageAnnouncements";
import { ManageSettings } from "./pages/super-admin/ManageSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RefreshProvider>
          <WebSocketProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  {/* ADD NEW CASHIER ROUTE */}
                  <Route
                    path="cashier"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "cashier", "manager"]}
                      >
                        <Cashier />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="pos"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "cashier", "manager"]}
                      >
                        <Cashier />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="waiter-order"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "waiter", "manager"]}
                      >
                        <WaiterOrderManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="supplier"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <Suppliers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="purchase-order"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <PurchaseOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="tables"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "waiter", "manager"]}
                      >
                        <TableManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="kitchen"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "chef", "manager"]}
                      >
                        <KitchenDisplay />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="inventory"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <Inventory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="menu"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <Menu />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* --- SUPER ADMIN ROUTES --- */}
                <Route
                  path="/super-admin/*"
                  element={
                    <SuperAdminAuthProvider>
                      <Routes>
                        <Route path="login" element={<SuperAdminLogin />} />
                        <Route
                          path="/*"
                          element={
                            <SuperAdminProtectedRoute>
                              <SuperAdminLayout />
                            </SuperAdminProtectedRoute>
                          }
                        >
                          <Route index element={<SuperAdminDashboard />} />
                          <Route path="restaurants" element={<ManageRestaurants />} />
                          <Route path="plans" element={<ManagePlans />} />
                          <Route path="subscriptions" element={<ManageSubscriptions />} />
                          <Route path="announcements" element={<ManageAnnouncements />} />
                          <Route path="settings" element={<ManageSettings />} />
                        </Route>
                      </Routes>
                    </SuperAdminAuthProvider>
                  }
                />
                {/* --- END SUPER ADMIN ROUTES --- */}

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WebSocketProvider>
        </RefreshProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
