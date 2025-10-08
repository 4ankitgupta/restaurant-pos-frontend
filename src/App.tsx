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
                    <ProtectedRoute
                      allowedRoles={["admin", "cashier", "manager"]}
                    >
                      <POSSystem />
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
                    <ProtectedRoute allowedRoles={["admin", "chef", "manager"]}>
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

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
