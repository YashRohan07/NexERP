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

  return "bg-gray-100 text-gray-700";
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
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      try {
        const [salesResponse, customersResponse, productsResponse] =
          await Promise.all([
            getSales({ page: 1, per_page: 10 }),
            getCustomers({ per_page: 100 }),
            getProducts({ per_page: 100 }),
          ]);

        if (isMounted) {
          const salesData = salesResponse.data?.data || {};

          setSales(salesData.sales || []);
          setPagination(
            salesData.pagination || {
              current_page: 1,
              per_page: 10,
              total: 0,
              last_page: 1,
            },
          );
          setCustomers(customersResponse.data?.data?.customers || []);
          setProducts(productsResponse.data?.data?.products || []);
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

    loadPageData();

    return () => {
      isMounted = false;
    };
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

  async function handleConfirm(sale) {
    const confirmed = window.confirm(
      `Confirm sale #${sale.id}? Inventory stock will decrease.`,
    );

    if (!confirmed) return;

    setActionLoadingId(sale.id);
    setError("");

    try {
      await confirmSale(sale.id);
      fetchSales(pagination.current_page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCancel(sale) {
    const confirmed = window.confirm(`Cancel draft sale #${sale.id}?`);

    if (!confirmed) return;

    setActionLoadingId(sale.id);
    setError("");

    try {
      await cancelSale(sale.id);
      fetchSales(pagination.current_page);
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
              Sales Management
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              Sales
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create sale drafts, confirm sales, cancel drafts, and track
              customer sales.
            </p>
          </div>

          {isAdmin && <Button onClick={openCreateModal}>Create Sale</Button>}
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
            placeholder="Customer or note"
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
        <Loader text="Loading sales..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-950">Sale List</h2>
              <p className="mt-1 text-sm text-gray-500">
                {pagination.total} sale{pagination.total === 1 ? "" : "s"}{" "}
                found.
              </p>
            </div>

            {sales.length === 0 ? (
              <div className="px-5 py-8">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No sales found.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Try changing filters or create a sale draft.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
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

                  <tbody className="divide-y divide-gray-100">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-semibold text-gray-950">
                          #{sale.id}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {sale.customer?.name || "-"}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {sale.sale_date || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                              sale.status,
                            )}`}
                          >
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-gray-800">
                          ৳{formatMoney(sale.total_amount)}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {sale.note || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/sales/${sale.id}`)}
                            >
                              View
                            </Button>

                            {isAdmin && sale.status === "draft" && (
                              <>
                                <Button
                                  onClick={() => handleConfirm(sale)}
                                  disabled={actionLoadingId === sale.id}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() => handleCancel(sale)}
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

          <Pagination pagination={pagination} onPageChange={fetchSales} />
        </>
      )}

      {showFormModal && (
        <Modal
          title="Create Sale Draft"
          onClose={() => setShowFormModal(false)}
          width="max-w-5xl"
        >
          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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

            <div className="rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 className="font-semibold text-gray-950">Sale Items</h3>
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
                <p className="text-sm font-medium text-blue-700">Sale Total</p>
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

export default SalePage;
