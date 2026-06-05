import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomers } from "../../api/customerApi";
import { getProducts } from "../../api/productApi";
import {
  cancelSale,
  confirmSale,
  createSale,
  getSales,
} from "../../api/saleApi";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import Select from "../../components/common/Select";
import { getRole } from "../../utils/auth";

const emptyForm = {
  customer_id: "",
  sale_date: "",
  note: "",
  items: [
    {
      product_id: "",
      quantity: "",
      selling_price: "",
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

  return "bg-slate-100 text-slate-700";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function SalePage() {
  const navigate = useNavigate();
  const isAdmin = getRole() === "admin";

  const [sales, setSales] = useState([]);
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

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showFormModal, setShowFormModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchSales(1);
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

  async function fetchSales(page = 1) {
    setLoading(true);
    setError("");

    try {
      const response = await getSales(buildParams(page));
      const data = response.data?.data || {};

      setSales(data.sales || []);
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
      const [customersResponse, productsResponse] = await Promise.all([
        getCustomers({ per_page: 100 }),
        getProducts({ per_page: 100 }),
      ]);

      setCustomers(customersResponse.data?.data?.customers || []);
      setProducts(productsResponse.data?.data?.products || []);
    } catch {
      setError("Unable to load customers or products for sale form.");
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
    fetchSales(1);
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
      fetchSales(1);
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
          selling_price: "",
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
    return Number(item.quantity || 0) * Number(item.selling_price || 0);
  }

  function getFormTotal() {
    return form.items.reduce((total, item) => total + getLineTotal(item), 0);
  }

  async function handleCreateSale(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    const payload = {
      customer_id: Number(form.customer_id),
      sale_date: form.sale_date,
      note: form.note || null,
      items: form.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        selling_price: Number(item.selling_price),
      })),
    };

    try {
      const response = await createSale(payload);
      const sale = response.data?.data?.sale;

      setShowFormModal(false);
      setForm(emptyForm);
      fetchSales(1);

      if (sale?.id) {
        navigate(`/sales/${sale.id}`);
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openConfirmDialog(sale) {
    setError("");
    setConfirmTarget(sale);
  }

  function openCancelDialog(sale) {
    setError("");
    setCancelTarget(sale);
  }

  async function handleConfirmSale() {
    if (!confirmTarget) return;

    setActionLoadingId(confirmTarget.id);
    setError("");

    try {
      await confirmSale(confirmTarget.id);
      setConfirmTarget(null);
      fetchSales(pagination.current_page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCancelSale() {
    if (!cancelTarget) return;

    setActionLoadingId(cancelTarget.id);
    setError("");

    try {
      await cancelSale(cancelTarget.id);
      setCancelTarget(null);
      fetchSales(pagination.current_page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              Sales Management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Sales
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Create sale drafts, confirm stock-out, and track customer sales
              activity.
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={openCreateModal}
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold shadow-md shadow-blue-100 sm:w-auto"
            >
              + Create Sale
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Filters</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search sales records by customer, status, date, or note.
          </p>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_auto]"
        >
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by customer or note"
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
            <Button
              type="submit"
              className="h-[42px] min-w-24 rounded-xl font-bold"
            >
              Filter
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-[42px] min-w-24 rounded-xl font-bold"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Loader text="Loading sales..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Sale List</h2>

                <p className="mt-1 text-sm text-slate-500">
                  {pagination.total} sale{pagination.total === 1 ? "" : "s"}{" "}
                  found.
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {pagination.total} record{pagination.total === 1 ? "" : "s"}
              </span>
            </div>

            {sales.length === 0 ? (
              <div className="px-5 py-7">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No sales available
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Create a sale draft or adjust the current filters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Sale ID</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Total Amount</th>
                      <th className="px-5 py-3">Note</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          #{sale.id}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {sale.customer?.name || "-"}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {sale.sale_date || "-"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                              sale.status,
                            )}`}
                          >
                            {sale.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-slate-800">
                          ৳{formatMoney(sale.total_amount)}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {sale.note || "-"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              className="rounded-xl font-bold"
                              onClick={() => navigate(`/sales/${sale.id}`)}
                            >
                              View
                            </Button>

                            {isAdmin && sale.status === "draft" && (
                              <>
                                <Button
                                  className="rounded-xl font-bold"
                                  onClick={() => openConfirmDialog(sale)}
                                  disabled={actionLoadingId === sale.id}
                                >
                                  Confirm
                                </Button>

                                <Button
                                  variant="danger"
                                  className="rounded-xl font-bold"
                                  onClick={() => openCancelDialog(sale)}
                                  disabled={actionLoadingId === sale.id}
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

          {pagination.total > 0 && (
            <Pagination pagination={pagination} onPageChange={fetchSales} />
          )}
        </>
      )}

      {showFormModal && (
        <Modal
          title="Create Sale Draft"
          onClose={() => setShowFormModal(false)}
          width="max-w-5xl"
        >
          {formError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateSale} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                label="Customer"
                name="customer_id"
                value={form.customer_id}
                onChange={handleFormChange}
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Sale Date"
                type="date"
                name="sale_date"
                value={form.sale_date}
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

            <div className="rounded-3xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="font-bold text-slate-950">Sale Items</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Add products, quantity, and selling price.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl font-bold"
                  onClick={addItemRow}
                >
                  + Add Item
                </Button>
              </div>

              <div className="space-y-4 p-4">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1.2fr_0.8fr_0.9fr_0.8fr_auto]"
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
                          {product.sku} - {product.name} - Stock:{" "}
                          {product.stock ?? product.inventory?.quantity ?? 0}
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
                      label="Selling Price"
                      type="number"
                      min="0"
                      step="0.01"
                      name="selling_price"
                      value={item.selling_price}
                      onChange={(event) => handleItemChange(index, event)}
                      required
                    />

                    <div>
                      <p className="mb-1 text-sm font-medium text-slate-700">
                        Line Total
                      </p>

                      <div className="flex h-[42px] items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-950">
                        ৳{formatMoney(getLineTotal(item))}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-[42px] rounded-xl border-red-200 px-4 font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
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

            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Sale Total
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-950">
                  ৳{formatMoney(getFormTotal())}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl font-bold"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl font-bold"
                >
                  {saving ? "Creating..." : "Create Draft"}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Confirm Sale"
        message={`Confirm sale #${
          confirmTarget?.id || ""
        }? Inventory stock will decrease after this action.`}
        confirmText="Confirm Sale"
        cancelText="Review Again"
        variant="primary"
        loading={actionLoadingId === confirmTarget?.id}
        onConfirm={handleConfirmSale}
        onCancel={() => {
          if (!actionLoadingId) setConfirmTarget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Sale Draft"
        message={`Are you sure you want to cancel sale #${
          cancelTarget?.id || ""
        }? This action cannot be undone.`}
        confirmText="Cancel Draft"
        cancelText="Keep Draft"
        variant="danger"
        loading={actionLoadingId === cancelTarget?.id}
        onConfirm={handleCancelSale}
        onCancel={() => {
          if (!actionLoadingId) setCancelTarget(null);
        }}
      />
    </div>
  );
}

export default SalePage;
