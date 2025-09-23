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
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WebSocketProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route
                path="pos"
                element={
                  <ProtectedRoute allowedRoles={["admin", "cashier"]}>
                    <POSSystem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="waiter-order"
                element={
                  <ProtectedRoute allowedRoles={["admin", "waiter"]}>
                    <WaiterOrderManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tables"
                element={
                  <ProtectedRoute allowedRoles={["admin", "waiter"]}>
                    <TableManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="kitchen"
                element={
                  <ProtectedRoute allowedRoles={["admin", "chef"]}>
                    <KitchenDisplay />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventory"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="menu"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Menu />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
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

            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
