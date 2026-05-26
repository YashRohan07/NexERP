import { useEffect, useState } from "react";
import { getDashboardSummary } from "../../api/dashboardApi";
import Loader from "../../components/common/Loader";
import LowStockTable from "../../components/dashboard/LowStockTable";
import RecentPurchases from "../../components/dashboard/RecentPurchases";
import RecentSales from "../../components/dashboard/RecentSales";
import SummaryCards from "../../components/dashboard/SummaryCards";

function DashboardPage() {
  const [dashboard, setDashboard] = useState({
    summary: {},
    low_stock_products: [],
    recent_purchases: [],
    recent_sales: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  function normalizeDashboardResponse(responseData) {
    return responseData?.data || responseData || {};
  }

  async function fetchDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await getDashboardSummary();
      const data = normalizeDashboardResponse(response.data);

      setDashboard({
        summary: data.summary || {},
        low_stock_products: data.low_stock_products || [],
        recent_purchases: data.recent_purchases || [],
        recent_sales: data.recent_sales || [],
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Something went wrong while loading dashboard data.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Business Overview
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Quick overview of products, inventory value, stock alerts,
              purchases, and sales activity.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:w-auto"
          >
            Refresh Dashboard
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <SummaryCards summary={dashboard.summary} />

      <LowStockTable products={dashboard.low_stock_products} />

      <div className="space-y-6">
        <RecentPurchases purchases={dashboard.recent_purchases} />
        <RecentSales sales={dashboard.recent_sales} />
      </div>
    </div>
  );
}

export default DashboardPage;
