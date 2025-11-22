import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Warehouse from "./pages/Warehouse";
import Location from "./pages/Location";
import MoveHistory from "./pages/MoveHistory";
import Operations from "./pages/Operations";
import AdminDashboard from "./pages/admin/AdminDashboard";

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

            {/* All routes under Layout require authentication */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard - available to any authenticated user */}
              <Route index element={<Dashboard />} />

              {/* Admin-only */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="operations"
                element={
                  <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                    <Operations />
                  </ProtectedRoute>
                }
              />

              {/* Products - admin & manager */}
              <Route
                path="products"
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager", "i_manager"]}>
                    <Products />
                  </ProtectedRoute>
                }
              />

              {/* Receipts - admin & manager */}
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

              {/* Delivery - admin, manager, warehouse staff */}
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

              {/* Warehouse / Location / Moves - warehouse staff & admin */}
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
