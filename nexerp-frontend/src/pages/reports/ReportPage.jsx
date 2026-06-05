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

const initialFilters = {
  date_from: "",
  date_to: "",
  sale_channel: "all",
};

const emptyReport = {
  summary: {},
  items: [],
};

const initialLoadingState = {
  summary: true,
  sales: true,
  purchases: true,
  inventory: true,
  lowStock: true,
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
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized.includes("cancelled") || normalized.includes("canceled")) {
    return "bg-red-50 text-red-700";
  }

  if (normalized.includes("draft")) {
    return "bg-amber-50 text-amber-700";
  }

  if (normalized.includes("low")) {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-slate-100 text-slate-700";
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

function SectionLoading() {
  return (
    <div className="px-5 py-7">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Loading report data...
        </p>

        <p className="mt-1 text-xs text-slate-500">
          This section will appear automatically.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  accent = "border-l-blue-500",
  tag,
  tagClass = "bg-blue-50 text-blue-700",
  loading = false,
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 border-l-4 ${accent} bg-white p-5 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>

        {tag && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${tagClass}`}
          >
            {tag}
          </span>
        )}
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
        {loading ? "..." : value}
      </p>

      {helper && (
        <p className="mt-4 text-xs font-medium text-slate-400">
          {loading ? "Loading..." : helper}
        </p>
      )}
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
  loading,
}) {
  const isExportDisabled = loading || downloading || count === 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {loading ? "..." : count} item{count === 1 ? "" : "s"}
          </span>

          <button
            type="button"
            onClick={onDownload}
            disabled={isExportDisabled}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? "Downloading..." : "Export PDF"}
          </button>
        </div>
      </div>

      {loading ? <SectionLoading /> : children}
    </section>
  );
}

function EmptyState({ message = "No report data found." }) {
  return (
    <div className="px-5 py-7">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
        <p className="text-sm font-semibold text-slate-700">{message}</p>

        <p className="mt-1 text-xs text-slate-500">
          Try changing the filters and refresh the report.
        </p>
      </div>
    </div>
  );
}

function ReportPage() {
  const [filters, setFilters] = useState(initialFilters);

  const [summaryReport, setSummaryReport] = useState({});
  const [salesReport, setSalesReport] = useState(emptyReport);
  const [purchaseReport, setPurchaseReport] = useState(emptyReport);
  const [inventoryReport, setInventoryReport] = useState(emptyReport);
  const [lowStockReport, setLowStockReport] = useState(emptyReport);

  const [loading, setLoading] = useState(initialLoadingState);
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

  async function fetchReports(event, nextFilters = filters) {
    if (event) {
      event.preventDefault();
    }

    setError("");
    setLoading({
      summary: true,
      sales: true,
      purchases: true,
      inventory: true,
      lowStock: true,
    });

    try {
      const salesParams = buildParams(nextFilters, "sales");
      const commonParams = buildParams(nextFilters);

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
        const data = normalizeData(summaryResponse.value);

        setSummaryReport(data?.summary || data || {});
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

      const failedRequests = [
        summaryResponse,
        salesResponse,
        purchasesResponse,
        inventoryResponse,
        lowStockResponse,
      ].filter((result) => result.status === "rejected");

      if (failedRequests.length > 0) {
        setError(
          "Some report data could not be loaded. Please refresh the reports.",
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading({
        summary: false,
        sales: false,
        purchases: false,
        inventory: false,
        lowStock: false,
      });
    }
  }

  function resetFilters() {
    setFilters(initialFilters);
    fetchReports(null, initialFilters);
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

  const isSummaryLoading =
    loading.summary ||
    loading.sales ||
    loading.purchases ||
    loading.inventory ||
    loading.lowStock;

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              Business Reports
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Reports
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Analyze sales, purchases, inventory value, and low-stock products.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReports}
            className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm shadow-blue-50 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
          >
            Refresh Reports
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

      <form
        onSubmit={fetchReports}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70"
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Filters</h2>

          <p className="mt-1 text-sm text-slate-500">
            Filter report data by date range and sales channel.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Date From
            </label>

            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Date To
            </label>

            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Sales Channel
            </label>

            <select
              name="sale_channel"
              value={filters.sale_channel}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All</option>
              <option value="sales">Sales</option>
              <option value="pos">POS</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-[46px] min-w-24 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-700"
            >
              Filter
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="h-[46px] min-w-24 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Sales"
          value={formatCurrency(totals.salesAmount)}
          helper={`${formatNumber(totals.totalSales)} confirmed sales`}
          accent="border-l-emerald-500"
          tag="Sales"
          tagClass="bg-emerald-50 text-emerald-700"
          loading={isSummaryLoading}
        />

        <SummaryCard
          label="Total Purchases"
          value={formatCurrency(totals.purchaseAmount)}
          helper={`${formatNumber(totals.totalPurchases)} confirmed purchases`}
          accent="border-l-amber-500"
          tag="Purchase"
          tagClass="bg-amber-50 text-amber-700"
          loading={isSummaryLoading}
        />

        <SummaryCard
          label="Inventory Value"
          value={formatCurrency(totals.inventoryValue)}
          helper={`${formatNumber(totals.totalQuantity)} stock units`}
          accent="border-l-blue-500"
          tag="Value"
          tagClass="bg-blue-50 text-blue-700"
          loading={isSummaryLoading}
        />

        <SummaryCard
          label="Low Stock Items"
          value={formatNumber(totals.lowStockCount)}
          helper={`${formatNumber(totals.totalProducts)} total products`}
          accent="border-l-red-500"
          tag="Alert"
          tagClass="bg-red-50 text-red-700"
          loading={isSummaryLoading}
        />
      </section>

      <ReportSection
        title="Sales Report"
        subtitle="Confirmed sales and POS transactions."
        count={salesReport.items?.length || 0}
        onDownload={() => handlePdfDownload("sales")}
        downloading={downloading === "sales"}
        loading={loading.sales}
      >
        {salesReport.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Sale ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Items</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {salesReport.items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-950">
                      #{item.id}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.customer || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.sale_date || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                        {item.sale_channel || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                          item.status,
                        )}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 capitalize text-slate-700">
                      {item.payment_method || "-"}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatNumber(item.items_count)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-950">
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
        loading={loading.purchases}
      >
        {purchaseReport.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Purchase ID</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Items</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {purchaseReport.items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-950">
                      #{item.id}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.supplier || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.purchase_date || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                          item.status,
                        )}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatNumber(item.items_count)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-950">
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
        loading={loading.inventory}
      >
        {inventoryReport.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Unit Cost</th>
                  <th className="px-5 py-3 text-right">Total Value</th>
                  <th className="px-5 py-3 text-right">Threshold</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Purchase Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {inventoryReport.items.map((item, index) => (
                  <tr
                    key={`${item.sku || "inventory"}-${index}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-bold text-slate-950">
                      {item.sku || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.product || "-"}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatNumber(item.quantity)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatCurrency(item.unit_cost)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-950">
                      {formatCurrency(item.total_value)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatNumber(item.threshold)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                          item.status,
                        )}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.purchase_date || "-"}
                    </td>
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
        loading={loading.lowStock}
      >
        {lowStockReport.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Threshold</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Purchase Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {lowStockReport.items.map((item, index) => (
                  <tr
                    key={`${item.sku || "low-stock"}-${index}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-bold text-slate-950">
                      {item.sku || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.product || "-"}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatNumber(item.quantity)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatNumber(item.threshold)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                          item.status || "Low Stock",
                        )}`}
                      >
                        {item.status || "Low Stock"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.purchase_date || "-"}
                    </td>
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
