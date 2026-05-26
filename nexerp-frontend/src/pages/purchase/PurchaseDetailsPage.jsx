import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  cancelPurchase,
  confirmPurchase,
  getPurchase,
} from "../../api/purchaseApi";
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

function PurchaseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = getRole() === "admin";

  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPurchase() {
      try {
        const response = await getPurchase(id);

        if (isMounted) {
          setPurchase(response.data?.data?.purchase || null);
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

    loadPurchase();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleConfirm() {
    const confirmed = window.confirm(
      `Confirm purchase #${purchase.id}? Inventory stock will increase.`,
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await confirmPurchase(purchase.id);
      setPurchase(response.data?.data?.purchase || purchase);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(`Cancel draft purchase #${purchase.id}?`);

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await cancelPurchase(purchase.id);
      setPurchase(response.data?.data?.purchase || purchase);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <Loader text="Loading purchase details..." />;
  }

  if (!purchase) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Purchase not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Purchase Details
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              Purchase #{purchase.id}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Supplier purchase details and item breakdown.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/purchases")}>
              Back to Purchases
            </Button>

            {isAdmin && purchase.status === "draft" && (
              <>
                <Button onClick={handleConfirm} disabled={actionLoading}>
                  Confirm Purchase
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
          <p className="text-sm font-medium text-gray-500">Supplier</p>
          <p className="mt-2 text-lg font-semibold text-gray-950">
            {purchase.supplier?.name || "-"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {purchase.supplier?.phone || "-"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {purchase.supplier?.email || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Purchase Date</p>
          <p className="mt-2 text-lg font-semibold text-gray-950">
            {purchase.purchase_date || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Status</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
              purchase.status,
            )}`}
          >
            {purchase.status}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Amount</p>
          <p className="mt-2 text-lg font-semibold text-gray-950">
            ৳{formatMoney(purchase.total_amount)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">Note</h2>
        <p className="mt-2 text-sm text-gray-600">{purchase.note || "-"}</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-950">
            Purchase Items
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Products included in this purchase.
          </p>
        </div>

        {!purchase.items || purchase.items.length === 0 ? (
          <div className="px-5 py-8">
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
              <p className="text-sm font-medium text-gray-700">
                No purchase items found.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Purchase item details will appear here.
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
                  <th className="px-5 py-3 text-right">Purchase Price</th>
                  <th className="px-5 py-3 text-right">Line Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {purchase.items.map((item) => (
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
                      ৳{formatMoney(item.purchase_price)}
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

export default PurchaseDetailsPage;
