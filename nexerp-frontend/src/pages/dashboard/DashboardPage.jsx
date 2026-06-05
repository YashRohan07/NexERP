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
    <div className="w-full min-w-0 space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Business Overview
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Monitor inventory, purchases, sales, stock alerts, and recent
              business activity in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm shadow-blue-50 transition hover:border-blue-500 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
          >
            Refresh Dashboard
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <SummaryCards summary={dashboard.summary} />

      <LowStockTable products={dashboard.low_stock_products} />

      <div className="grid min-w-0 gap-5">
        <RecentPurchases purchases={dashboard.recent_purchases} />
        <RecentSales sales={dashboard.recent_sales} />
      </div>
    </div>
  );
}

export default DashboardPage;
