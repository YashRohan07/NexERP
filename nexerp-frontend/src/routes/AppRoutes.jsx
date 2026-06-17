import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import LoginPage from "../pages/auth/LoginPage";
import CategoryPage from "../pages/category/CategoryPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import InventoryPage from "../pages/inventory/InventoryPage";
import PosPage from "../pages/pos/PosPage";
import ProductPage from "../pages/product/ProductPage";
import PurchaseDetailsPage from "../pages/purchase/PurchaseDetailsPage";
import PurchasePage from "../pages/purchase/PurchasePage";
import SupplierPage from "../pages/purchase/SupplierPage";
import ReportPage from "../pages/reports/ReportPage";
import CustomerPage from "../pages/sales/CustomerPage";
import SaleDetailsPage from "../pages/sales/SaleDetailsPage";
import SalePage from "../pages/sales/SalePage";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/categories" element={<CategoryPage />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/suppliers" element={<SupplierPage />} />
        <Route path="/purchases" element={<PurchasePage />} />
        <Route path="/purchases/:id" element={<PurchaseDetailsPage />} />
        <Route path="/customers" element={<CustomerPage />} />
        <Route path="/sales" element={<SalePage />} />
        <Route path="/sales/:id" element={<SaleDetailsPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/reports" element={<ReportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
