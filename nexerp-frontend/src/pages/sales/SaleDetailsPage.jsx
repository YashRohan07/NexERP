import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cancelSale, confirmSale, getSale } from "../../api/saleApi";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loader from "../../components/common/Loader";
import { getRole } from "../../utils/auth";

function getErrorMessage(error) {
  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error.response?.data?.errors) {
    return Object.values(error.response.data.errors).flat().join(" ");
  }

  return (
    error.response?.data?.message || "Something went wrong. Please try again."
  );
}

function getStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "confirmed") {
    return "bg-green-50 text-green-700";
  }

  if (normalizedStatus === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (normalizedStatus === "draft") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function SaleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = getRole() === "admin";

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSale() {
      try {
        const response = await getSale(id);

        if (isMounted) {
          setSale(response.data?.data?.sale || null);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSale();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleConfirmSale() {
    if (!sale) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await confirmSale(sale.id);
      setSale(response.data?.data?.sale || sale);
      setConfirmDialogOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelSale() {
    if (!sale) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await cancelSale(sale.id);
      setSale(response.data?.data?.sale || sale);
      setCancelDialogOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <Loader text="Loading sale details..." />;
  }

  if (!sale) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Sale not found.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              Sale Details
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Sale #{sale.id}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review customer information, sale status, total amount, and item
              breakdown.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              onClick={() => navigate("/sales")}
            >
              Back to Sales
            </Button>

            {isAdmin && sale.status === "draft" && (
              <>
                <Button
                  className="rounded-xl font-bold"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={actionLoading}
                >
                  Confirm Sale
                </Button>

                <Button
                  variant="danger"
                  className="rounded-xl font-bold"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={actionLoading}
                >
                  Cancel Draft
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <p className="text-sm font-semibold text-slate-500">Customer</p>

          <p className="mt-2 text-lg font-bold text-slate-950">
            {sale.customer?.name || "-"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {sale.customer?.phone || "-"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {sale.customer?.email || "-"}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <p className="text-sm font-semibold text-slate-500">Sale Date</p>

          <p className="mt-2 text-lg font-bold text-slate-950">
            {sale.sale_date || "-"}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <p className="text-sm font-semibold text-slate-500">Status</p>

          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
              sale.status,
            )}`}
          >
            {sale.status}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <p className="text-sm font-semibold text-slate-500">Total Amount</p>

          <p className="mt-2 text-lg font-bold text-slate-950">
            ৳{formatMoney(sale.total_amount)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <h2 className="text-lg font-bold text-slate-950">Note</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {sale.note || "No note added for this sale."}
        </p>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">Sale Items</h2>

          <p className="mt-1 text-sm text-slate-500">
            Products included in this sale.
          </p>
        </div>

        {!sale.items || sale.items.length === 0 ? (
          <div className="px-5 py-7">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No sale items available
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Sale item details will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Color</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                  <th className="px-5 py-3 text-right">Selling Price</th>
                  <th className="px-5 py-3 text-right">Line Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      {item.product?.sku || "-"}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {item.product?.name || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.product?.size || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.product?.color || "-"}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-800">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-700">
                      ৳{formatMoney(item.selling_price)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-950">
                      ৳{formatMoney(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmDialogOpen}
        title="Confirm Sale"
        message={`Confirm sale #${sale.id}? Inventory stock will decrease after this action.`}
        confirmText="Confirm Sale"
        cancelText="Review Again"
        variant="primary"
        loading={actionLoading}
        onConfirm={handleConfirmSale}
        onCancel={() => {
          if (!actionLoading) setConfirmDialogOpen(false);
        }}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancel Sale Draft"
        message={`Are you sure you want to cancel sale #${sale.id}? This action cannot be undone.`}
        confirmText="Cancel Draft"
        cancelText="Keep Draft"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleCancelSale}
        onCancel={() => {
          if (!actionLoading) setCancelDialogOpen(false);
        }}
      />
    </div>
  );
}

export default SaleDetailsPage;
