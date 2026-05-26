import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cancelSale, confirmSale, getSale } from "../../api/saleApi";
import Button from "../../components/common/Button";
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

  return "bg-gray-100 text-gray-700";
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

  async function handleConfirm() {
    const confirmed = window.confirm(
      `Confirm sale #${sale.id}? Inventory stock will decrease.`,
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await confirmSale(sale.id);
      setSale(response.data?.data?.sale || sale);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(`Cancel draft sale #${sale.id}?`);

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await cancelSale(sale.id);
      setSale(response.data?.data?.sale || sale);
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
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Sale not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Sale Details
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              Sale #{sale.id}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Customer sale details and item breakdown.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/sales")}>
              Back to Sales
            </Button>

            {isAdmin && sale.status === "draft" && (
              <>
                <Button onClick={handleConfirm} disabled={actionLoading}>
                  Confirm Sale
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancel}
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Customer</p>
          <p className="mt-2 text-lg font-semibold text-gray-950">
            {sale.customer?.name || "-"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {sale.customer?.phone || "-"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {sale.customer?.email || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Sale Date</p>
          <p className="mt-2 text-lg font-semibold text-gray-950">
            {sale.sale_date || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Status</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
              sale.status,
            )}`}
          >
            {sale.status}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Amount</p>
          <p className="mt-2 text-lg font-semibold text-gray-950">
            ৳{formatMoney(sale.total_amount)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">Note</h2>
        <p className="mt-2 text-sm text-gray-600">{sale.note || "-"}</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-950">Sale Items</h2>
          <p className="mt-1 text-sm text-gray-500">
            Products included in this sale.
          </p>
        </div>

        {!sale.items || sale.items.length === 0 ? (
          <div className="px-5 py-8">
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
              <p className="text-sm font-medium text-gray-700">
                No sale items found.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Sale item details will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
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

              <tbody className="divide-y divide-gray-100">
                {sale.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-semibold text-gray-950">
                      {item.product?.sku || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.product?.name || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.product?.size || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.product?.color || "-"}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-gray-800">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-700">
                      ৳{formatMoney(item.selling_price)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-950">
                      ৳{formatMoney(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SaleDetailsPage;
