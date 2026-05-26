import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import InventoryPage from "../pages/inventory/InventoryPage";
import ProductPage from "../pages/product/ProductPage";
import PurchaseDetailsPage from "../pages/purchase/PurchaseDetailsPage";
import PurchasePage from "../pages/purchase/PurchasePage";
import SupplierPage from "../pages/purchase/SupplierPage";
import ProtectedRoute from "./ProtectedRoute";

function PlaceholderPage({ title }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">
        This page will be implemented in the next frontend steps.
      </p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/suppliers" element={<SupplierPage />} />
          <Route path="/purchases" element={<PurchasePage />} />
          <Route path="/purchases/:id" element={<PurchaseDetailsPage />} />
          <Route
            path="/customers"
            element={<PlaceholderPage title="Customers" />}
          />
          <Route path="/sales" element={<PlaceholderPage title="Sales" />} />
          <Route path="/pos" element={<PlaceholderPage title="POS" />} />
          <Route
            path="/reports"
            element={<PlaceholderPage title="Reports" />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
