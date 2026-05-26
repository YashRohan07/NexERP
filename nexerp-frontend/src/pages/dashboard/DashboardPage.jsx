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
    <div className="w-full min-w-0 space-y-6">
      <section className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Business Overview
            </p>

            <h1 className="mt-3 text-3xl font-bold text-gray-950">Dashboard</h1>

            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Quick overview of products, inventory value, stock alerts,
              purchases, and sales activity.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="w-full shrink-0 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:w-auto"
          >
            Refresh Dashboard
          </button>
        </div>
      </section>

      {error && (
        <div className="w-full min-w-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="w-full min-w-0">
        <SummaryCards summary={dashboard.summary} />
      </section>

      <section className="w-full min-w-0">
        <LowStockTable products={dashboard.low_stock_products} />
      </section>

      <section className="grid w-full min-w-0 gap-6">
        <RecentPurchases purchases={dashboard.recent_purchases} />
        <RecentSales sales={dashboard.recent_sales} />
      </section>
    </div>
  );
}

export default DashboardPage;
