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
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="operations" element={<Operations />} />
              <Route path="products" element={<Products />} />
              <Route path="receipts" element={<Receipts />} />
              <Route path="receipts/create" element={<CreateReceipt />} />
              <Route path="delivery" element={<Delivery />} />
              <Route path="delivery/create" element={<CreateDelivery />} />

              {/* Top-level settings-related pages (no Settings home) */}
              <Route path="warehouse" element={<Warehouse />} />
              <Route path="location" element={<Location />} />

              {/* Move History (top-level path) */}
              <Route path="moves" element={<MoveHistory />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
