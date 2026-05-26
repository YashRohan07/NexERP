import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../../api/productApi";
import {
  cancelPurchase,
  confirmPurchase,
  createPurchase,
  getPurchases,
} from "../../api/purchaseApi";
import { getSuppliers } from "../../api/supplierApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import Select from "../../components/common/Select";
import { getRole } from "../../utils/auth";

const emptyForm = {
  supplier_id: "",
  purchase_date: "",
  note: "",
  items: [
    {
      product_id: "",
      quantity: "",
      purchase_price: "",
    },
  ],
};

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

function PurchasePage() {
  const navigate = useNavigate();
  const isAdmin = getRole() === "admin";

  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    date_from: "",
    date_to: "",
    per_page: 10,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showFormModal, setShowFormModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchPurchases(1);
    fetchFormOptions();
  }, []);

  function buildParams(page = 1) {
    const params = {
      page,
      per_page: filters.per_page,
    };

    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    return params;
  }

  async function fetchPurchases(page = 1) {
    setLoading(true);
    setError("");

    try {
      const response = await getPurchases(buildParams(page));
      const data = response.data?.data || {};

      setPurchases(data.purchases || []);
      setPagination(
        data.pagination || {
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
        },
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchFormOptions() {
    try {
      const [supplierResponse, productResponse] = await Promise.all([
        getSuppliers({ per_page: 100 }),
        getProducts({ per_page: 100 }),
      ]);

      setSuppliers(supplierResponse.data?.data?.suppliers || []);
      setProducts(productResponse.data?.data?.products || []);
    } catch {
      setError("Unable to load suppliers or products for purchase form.");
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    fetchPurchases(1);
  }

  function resetFilters() {
    setFilters({
      search: "",
      status: "",
      date_from: "",
      date_to: "",
      per_page: 10,
    });

    setTimeout(() => {
      fetchPurchases(1);
    }, 0);
  }

  function openCreateModal() {
    setForm(emptyForm);
    setFormError("");
    setShowFormModal(true);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleItemChange(index, event) {
    const { name, value } = event.target;

    setForm((current) => {
      const nextItems = [...current.items];

      nextItems[index] = {
        ...nextItems[index],
        [name]: value,
      };

      return {
        ...current,
        items: nextItems,
      };
    });
  }

  function addItemRow() {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          product_id: "",
          quantity: "",
          purchase_price: "",
        },
      ],
    }));
  }

  function removeItemRow(index) {
    setForm((current) => {
      if (current.items.length === 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  function getLineTotal(item) {
    return Number(item.quantity || 0) * Number(item.purchase_price || 0);
  }

  function getFormTotal() {
    return form.items.reduce((total, item) => total + getLineTotal(item), 0);
  }

  async function handleCreatePurchase(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    const payload = {
      supplier_id: Number(form.supplier_id),
      purchase_date: form.purchase_date,
      note: form.note || null,
      items: form.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        purchase_price: Number(item.purchase_price),
      })),
    };

    try {
      const response = await createPurchase(payload);
      const purchase = response.data?.data?.purchase;

      setShowFormModal(false);
      setForm(emptyForm);
      fetchPurchases(1);

      if (purchase?.id) {
        navigate(`/purchases/${purchase.id}`);
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(purchase) {
    const confirmed = window.confirm(
      `Confirm purchase #${purchase.id}? Inventory stock will increase.`,
    );

    if (!confirmed) return;

    setActionLoadingId(purchase.id);
    setError("");

    try {
      await confirmPurchase(purchase.id);
      fetchPurchases(pagination.current_page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCancel(purchase) {
    const confirmed = window.confirm(`Cancel draft purchase #${purchase.id}?`);

    if (!confirmed) return;

    setActionLoadingId(purchase.id);
    setError("");

    try {
      await cancelPurchase(purchase.id);
      fetchPurchases(pagination.current_page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Purchase Management
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              Purchases
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create purchase drafts, view supplier purchases, confirm stock-in,
              and cancel drafts.
            </p>
          </div>

          {isAdmin && (
            <Button onClick={openCreateModal}>Create Purchase</Button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-4 md:grid-cols-3 xl:grid-cols-6"
        >
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Supplier or note"
          />

          <Select
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Input
            label="Date From"
            type="date"
            name="date_from"
            value={filters.date_from}
            onChange={handleFilterChange}
          />

          <Input
            label="Date To"
            type="date"
            name="date_to"
            value={filters.date_to}
            onChange={handleFilterChange}
          />

          <Input
            label="Per Page"
            type="number"
            min="1"
            name="per_page"
            value={filters.per_page}
            onChange={handleFilterChange}
          />

          <div className="flex items-end gap-2">
            <Button type="submit" className="w-full">
              Filter
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Loader text="Loading purchases..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Purchase List
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {pagination.total} purchase
                  {pagination.total === 1 ? "" : "s"} found.
                </p>
              </div>
            </div>

            {purchases.length === 0 ? (
              <div className="px-5 py-8">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No purchases found.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Try changing filters or create a purchase draft.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Purchase ID</th>
                      <th className="px-5 py-3">Supplier</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Total Amount</th>
                      <th className="px-5 py-3">Note</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-semibold text-gray-950">
                          #{purchase.id}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {purchase.supplier?.name || "-"}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {purchase.purchase_date || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                              purchase.status,
                            )}`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-gray-800">
                          ৳{formatMoney(purchase.total_amount)}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {purchase.note || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                navigate(`/purchases/${purchase.id}`)
                              }
                            >
                              View
                            </Button>

                            {isAdmin && purchase.status === "draft" && (
                              <>
                                <Button
                                  onClick={() => handleConfirm(purchase)}
                                  disabled={actionLoadingId === purchase.id}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() => handleCancel(purchase)}
                                  disabled={actionLoadingId === purchase.id}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <Pagination pagination={pagination} onPageChange={fetchPurchases} />
        </>
      )}

      {showFormModal && (
        <Modal
          title="Create Purchase Draft"
          onClose={() => setShowFormModal(false)}
          width="max-w-5xl"
        >
          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreatePurchase} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                label="Supplier"
                name="supplier_id"
                value={form.supplier_id}
                onChange={handleFormChange}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Purchase Date"
                type="date"
                name="purchase_date"
                value={form.purchase_date}
                onChange={handleFormChange}
                required
              />

              <Input
                label="Note"
                name="note"
                value={form.note}
                onChange={handleFormChange}
                placeholder="Optional"
              />
            </div>

            <div className="rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 className="font-semibold text-gray-950">Purchase Items</h3>
                <Button type="button" variant="outline" onClick={addItemRow}>
                  Add Item
                </Button>
              </div>

              <div className="space-y-4 p-4">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-5"
                  >
                    <Select
                      label="Product"
                      name="product_id"
                      value={item.product_id}
                      onChange={(event) => handleItemChange(index, event)}
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </Select>

                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      name="quantity"
                      value={item.quantity}
                      onChange={(event) => handleItemChange(index, event)}
                      required
                    />

                    <Input
                      label="Purchase Price"
                      type="number"
                      min="0"
                      step="0.01"
                      name="purchase_price"
                      value={item.purchase_price}
                      onChange={(event) => handleItemChange(index, event)}
                      required
                    />

                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-700">
                        Line Total
                      </p>
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800">
                        ৳{formatMoney(getLineTotal(item))}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="danger"
                        className="w-full"
                        disabled={form.items.length === 1}
                        onClick={() => removeItemRow(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Purchase Total
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-950">
                  ৳{formatMoney(getFormTotal())}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Draft"}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PurchasePage;
