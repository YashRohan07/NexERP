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
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Business Overview
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Dashboard
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Quick overview of products, inventory value, stock alerts,
              purchases, and sales activity.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm shadow-blue-50 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
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

      <section className="min-w-0">
        <SummaryCards summary={dashboard.summary} />
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <LowStockTable products={dashboard.low_stock_products} />
      </section>

      <section className="grid min-w-0 gap-6">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <RecentPurchases purchases={dashboard.recent_purchases} />
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <RecentSales sales={dashboard.recent_sales} />
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
