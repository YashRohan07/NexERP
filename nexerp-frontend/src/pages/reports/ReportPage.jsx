import { useEffect, useMemo, useState } from "react";
import {
  downloadInventoryReportPdf,
  downloadLowStockReportPdf,
  downloadPurchasesReportPdf,
  downloadSalesReportPdf,
  getInventoryReport,
  getLowStockReport,
  getPurchasesReport,
  getReportSummary,
  getSalesReport,
} from "../../api/reportApi";
import Loader from "../../components/common/Loader";

const initialFilters = {
  date_from: "",
  date_to: "",
  sale_channel: "all",
};

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-BD");
}

function normalizeData(response) {
  return response?.data?.data || response?.data || {};
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("confirmed") || normalized.includes("in stock")) {
    return "bg-green-50 text-green-700";
  }

  if (normalized.includes("cancelled") || normalized.includes("canceled")) {
    return "bg-red-50 text-red-700";
  }

  if (normalized.includes("draft")) {
    return "bg-yellow-50 text-yellow-700";
  }

  if (normalized.includes("low")) {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-gray-100 text-gray-700";
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function buildParams(filters, type) {
  const params = {};

  if (filters.date_from) {
    params.date_from = filters.date_from;
  }

  if (filters.date_to) {
    params.date_to = filters.date_to;
  }

  if (type === "sales" && filters.sale_channel !== "all") {
    params.sale_channel = filters.sale_channel;
  }

  return params;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, helper, accent = "border-blue-500" }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 border-l-4 ${accent} bg-white p-6 shadow-sm`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
      {helper && <p className="mt-3 text-sm text-gray-500">{helper}</p>}
    </div>
  );
}

function ReportSection({
  title,
  subtitle,
  count,
  children,
  onDownload,
  downloading,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            {count} items
          </span>

          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? "Downloading..." : "Export PDF"}
          </button>
        </div>
      </div>

      {children}
    </section>
  );
}

function EmptyState({ message = "No report data found." }) {
  return (
    <div className="px-6 py-8">
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
        <p className="font-medium text-gray-700">{message}</p>
        <p className="mt-1 text-sm text-gray-500">
          Try changing the filters and refresh the report.
        </p>
      </div>
    </div>
  );
}

function ReportPage() {
  const [filters, setFilters] = useState(initialFilters);

  const [summaryReport, setSummaryReport] = useState({});
  const [salesReport, setSalesReport] = useState({ summary: {}, items: [] });
  const [purchaseReport, setPurchaseReport] = useState({
    summary: {},
    items: [],
  });
  const [inventoryReport, setInventoryReport] = useState({
    summary: {},
    items: [],
  });
  const [lowStockReport, setLowStockReport] = useState({
    summary: {},
    items: [],
  });

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const salesSummary = salesReport.summary || {};
    const purchaseSummary = purchaseReport.summary || {};
    const inventorySummary = inventoryReport.summary || {};
    const lowStockSummary = lowStockReport.summary || {};

    return {
      salesAmount:
        salesSummary.total_sales_amount ||
        summaryReport.total_sales_amount ||
        summaryReport.sales_amount ||
        0,
      purchaseAmount:
        purchaseSummary.total_purchase_amount ||
        summaryReport.total_purchase_amount ||
        summaryReport.purchase_amount ||
        0,
      inventoryValue:
        inventorySummary.total_inventory_value ||
        summaryReport.total_inventory_value ||
        summaryReport.inventory_value ||
        0,
      totalProducts:
        inventorySummary.total_products || summaryReport.total_products || 0,
      totalQuantity:
        inventorySummary.total_quantity || summaryReport.total_quantity || 0,
      lowStockCount:
        inventorySummary.low_stock_count ||
        lowStockSummary.low_stock_count ||
        summaryReport.low_stock_count ||
        0,
      totalSales: salesSummary.total_sales || summaryReport.total_sales || 0,
      totalPurchases:
        purchaseSummary.total_purchases || summaryReport.total_purchases || 0,
    };
  }, [
    summaryReport,
    salesReport,
    purchaseReport,
    inventoryReport,
    lowStockReport,
  ]);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function fetchReports(event) {
    if (event) {
      event.preventDefault();
    }

    setLoading(true);
    setError("");

    try {
      const salesParams = buildParams(filters, "sales");
      const commonParams = buildParams(filters);

      const [
        summaryResponse,
        salesResponse,
        purchasesResponse,
        inventoryResponse,
        lowStockResponse,
      ] = await Promise.allSettled([
        getReportSummary(commonParams),
        getSalesReport(salesParams),
        getPurchasesReport(commonParams),
        getInventoryReport(commonParams),
        getLowStockReport(commonParams),
      ]);

      if (summaryResponse.status === "fulfilled") {
        setSummaryReport(
          normalizeData(summaryResponse.value)?.summary ||
            normalizeData(summaryResponse.value) ||
            {},
        );
      }

      if (salesResponse.status === "fulfilled") {
        const data = normalizeData(salesResponse.value);

        setSalesReport({
          summary: data.summary || {},
          filters: data.filters || {},
          items: data.items || [],
        });
      }

      if (purchasesResponse.status === "fulfilled") {
        const data = normalizeData(purchasesResponse.value);

        setPurchaseReport({
          summary: data.summary || {},
          filters: data.filters || {},
          items: data.items || [],
        });
      }

      if (inventoryResponse.status === "fulfilled") {
        const data = normalizeData(inventoryResponse.value);

        setInventoryReport({
          summary: data.summary || {},
          filters: data.filters || {},
          items: data.items || [],
        });
      }

      if (lowStockResponse.status === "fulfilled") {
        const data = normalizeData(lowStockResponse.value);

        setLowStockReport({
          summary: data.summary || {},
          filters: data.filters || {},
          items: data.items || [],
        });
      }

      const failedRequest = [
        summaryResponse,
        salesResponse,
        purchasesResponse,
        inventoryResponse,
        lowStockResponse,
      ].find((result) => result.status === "rejected");

      if (failedRequest) {
        setError(
          "Some report sections could not be loaded. Available sections are shown below.",
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  async function handlePdfDownload(type) {
    setDownloading(type);
    setError("");

    try {
      const commonParams = buildParams(filters);
      const salesParams = buildParams(filters, "sales");

      let response;
      let filename;

      if (type === "sales") {
        response = await downloadSalesReportPdf(salesParams);
        filename = "sales-report.pdf";
      }

      if (type === "purchases") {
        response = await downloadPurchasesReportPdf(commonParams);
        filename = "purchase-report.pdf";
      }

      if (type === "inventory") {
        response = await downloadInventoryReportPdf(commonParams);
        filename = "inventory-report.pdf";
      }

      if (type === "low-stock") {
        response = await downloadLowStockReportPdf(commonParams);
        filename = "low-stock-report.pdf";
      }

      if (response?.data) {
        downloadBlob(response.data, filename);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading("");
    }
  }

  if (loading) {
    return <Loader text="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Business Reports
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Reports</h1>
            <p className="mt-2 text-sm text-gray-600">
              Analyze sales, purchases, inventory value, and low stock products.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReports}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Refresh Reports
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-800">
          {error}
        </div>
      )}

      <form
        onSubmit={fetchReports}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date From
            </label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date To
            </label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Sales Channel
            </label>
            <select
              name="sale_channel"
              value={filters.sale_channel}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All</option>
              <option value="sales">Sales</option>
              <option value="pos">POS</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Filter
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Sales"
          value={formatCurrency(totals.salesAmount)}
          helper={`${formatNumber(totals.totalSales)} confirmed sales`}
          accent="border-green-500"
        />
        <SummaryCard
          label="Total Purchases"
          value={formatCurrency(totals.purchaseAmount)}
          helper={`${formatNumber(totals.totalPurchases)} confirmed purchases`}
          accent="border-orange-500"
        />
        <SummaryCard
          label="Inventory Value"
          value={formatCurrency(totals.inventoryValue)}
          helper={`${formatNumber(totals.totalQuantity)} stock units`}
          accent="border-blue-500"
        />
        <SummaryCard
          label="Low Stock Items"
          value={formatNumber(totals.lowStockCount)}
          helper={`${formatNumber(totals.totalProducts)} total products`}
          accent="border-red-500"
        />
      </div>

      <ReportSection
        title="Sales Report"
        subtitle="Confirmed sales and POS transactions."
        count={salesReport.items?.length || 0}
        onDownload={() => handlePdfDownload("sales")}
        downloading={downloading === "sales"}
      >
        {salesReport.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Sale ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Items</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {salesReport.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-950">
                      #{item.id}
                    </td>
                    <td className="px-6 py-4">{item.customer || "-"}</td>
                    <td className="px-6 py-4">{item.sale_date || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                        {item.sale_channel || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                          item.status,
                        )}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {item.payment_method || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatNumber(item.items_count)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-950">
                      {formatCurrency(item.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No sales report data found." />
        )}
      </ReportSection>

      <ReportSection
        title="Purchase Report"
        subtitle="Confirmed supplier purchases."
        count={purchaseReport.items?.length || 0}
        onDownload={() => handlePdfDownload("purchases")}
        downloading={downloading === "purchases"}
      >
        {purchaseReport.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Purchase ID</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Items</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {purchaseReport.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-950">
                      #{item.id}
                    </td>
                    <td className="px-6 py-4">{item.supplier || "-"}</td>
                    <td className="px-6 py-4">{item.purchase_date || "-"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                          item.status,
                        )}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatNumber(item.items_count)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-950">
                      {formatCurrency(item.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No purchase report data found." />
        )}
      </ReportSection>

      <ReportSection
        title="Inventory Report"
        subtitle="Current inventory quantity, value, threshold, and status."
        count={inventoryReport.items?.length || 0}
        onDownload={() => handlePdfDownload("inventory")}
        downloading={downloading === "inventory"}
      >
        {inventoryReport.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-right">Qty</th>
                  <th className="px-6 py-4 text-right">Unit Cost</th>
                  <th className="px-6 py-4 text-right">Total Value</th>
                  <th className="px-6 py-4 text-right">Threshold</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {inventoryReport.items.map((item, index) => (
                  <tr
                    key={`${item.sku || "inventory"}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-bold text-gray-950">
                      {item.sku || "-"}
                    </td>
                    <td className="px-6 py-4">{item.product || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-950">
                      {formatCurrency(item.total_value)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatNumber(item.threshold)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                          item.status,
                        )}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.purchase_date || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No inventory report data found." />
        )}
      </ReportSection>

      <ReportSection
        title="Low Stock Report"
        subtitle="Products currently at or below their stock threshold."
        count={lowStockReport.items?.length || 0}
        onDownload={() => handlePdfDownload("low-stock")}
        downloading={downloading === "low-stock"}
      >
        {lowStockReport.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-right">Qty</th>
                  <th className="px-6 py-4 text-right">Threshold</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {lowStockReport.items.map((item, index) => (
                  <tr
                    key={`${item.sku || "low-stock"}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-bold text-gray-950">
                      {item.sku || "-"}
                    </td>
                    <td className="px-6 py-4">{item.product || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatNumber(item.threshold)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                          item.status || "Low Stock",
                        )}`}
                      >
                        {item.status || "Low Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.purchase_date || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No low stock products found." />
        )}
      </ReportSection>
    </div>
  );
}

export default ReportPage;
