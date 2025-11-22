// src/App.jsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Receipts from "./pages/Receipts";
import CreateReceipt from "./pages/CreateReceipt";
import Delivery from "./pages/Delivery";
import CreateDelivery from "./pages/CreateDelivery";
import NotFound from "./pages/NotFound";
import MoveHistory from "./pages/MoveHistory";
import Operations from "./pages/Operations";

// role-specific dashboards
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import WarehouseDashboard from "./pages/warehouse/WarehouseDashboard";

import Warehouse from "./pages/Warehouse";
import Location from "./pages/Location";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Generic dashboard reachable by any authenticated user (optional) */}
              <Route index element={<Dashboard />} />

              {/* Role-specific dashboards */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="manager/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["manager", "i_manager", "inventory_manager"]}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="warehouse/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["w_staff", "warehouse", "warehouse_staff"]}>
                    <WarehouseDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Other routes with role checks */}
              <Route
                path="operations"
                element={
                  <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                    <Operations />
                  </ProtectedRoute>
                }
              />

              <Route
                path="products"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "i_manager"]}>
                    <Products />
                  </ProtectedRoute>
                }
              />

              <Route
                path="receipts"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "i_manager"]}>
                    <Receipts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="receipts/create"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "i_manager"]}>
                    <CreateReceipt />
                  </ProtectedRoute>
                }
              />

              <Route
                path="delivery"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "i_manager", "w_staff", "warehouse_staff"]}>
                    <Delivery />
                  </ProtectedRoute>
                }
              />
              <Route
                path="delivery/create"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "i_manager", "w_staff", "warehouse_staff"]}>
                    <CreateDelivery />
                  </ProtectedRoute>
                }
              />

              <Route
                path="warehouse"
                element={
                  <ProtectedRoute allowedRoles={["admin", "w_staff", "warehouse_staff"]}>
                    <Warehouse />
                  </ProtectedRoute>
                }
              />
              <Route
                path="location"
                element={
                  <ProtectedRoute allowedRoles={["admin", "w_staff", "warehouse_staff"]}>
                    <Location />
                  </ProtectedRoute>
                }
              />
              <Route
                path="moves"
                element={
                  <ProtectedRoute allowedRoles={["admin", "w_staff", "warehouse_staff"]}>
                    <MoveHistory />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
