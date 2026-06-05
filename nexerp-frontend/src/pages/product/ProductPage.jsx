import { useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../../api/productApi";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { getRole } from "../../utils/auth";

const emptyForm = {
  sku: "",
  name: "",
  size: "",
  color: "",
  quantity: "",
  purchase_price: "",
  purchase_date: "",
  low_stock_threshold: "",
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

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function ProductPage() {
  const isAdmin = getRole() === "admin";

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [filters, setFilters] = useState({
    search: "",
    size: "",
    color: "",
    per_page: 10,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchProducts(1);
  }, []);

  function buildParams(page = 1) {
    const params = {
      page,
      per_page: filters.per_page,
    };

    if (filters.search) params.search = filters.search;
    if (filters.size) params.size = filters.size;
    if (filters.color) params.color = filters.color;

    return params;
  }

  async function fetchProducts(page = 1) {
    setLoading(true);
    setError("");

    try {
      const response = await getProducts(buildParams(page));
      const data = response.data?.data || {};

      setProducts(data.products || []);
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

  function handleSearchSubmit(event) {
    event.preventDefault();
    fetchProducts(1);
  }

  function resetFilters() {
    setFilters({
      search: "",
      size: "",
      color: "",
      per_page: 10,
    });

    setTimeout(() => {
      fetchProducts(1);
    }, 0);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError("");
    setShowFormModal(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);

    setForm({
      sku: product.sku || "",
      name: product.name || "",
      size: product.size || "",
      color: product.color || "",
      quantity: product.inventory?.quantity ?? product.stock ?? "",
      purchase_price: product.inventory?.purchase_price || "",
      purchase_date: product.inventory?.purchase_date || "",
      low_stock_threshold: product.inventory?.low_stock_threshold ?? "",
    });

    setFormError("");
    setShowFormModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    const payload = {
      sku: form.sku,
      name: form.name,
      size: form.size || null,
      color: form.color || null,
      quantity: Number(form.quantity),
      purchase_price: Number(form.purchase_price),
      purchase_date: form.purchase_date || null,
      low_stock_threshold: Number(form.low_stock_threshold),
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      setShowFormModal(false);
      setEditingProduct(null);
      setForm(emptyForm);
      fetchProducts(pagination.current_page);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(product) {
    setError("");
    setDeleteTarget(product);
  }

  function closeDeleteDialog() {
    if (deleteLoading) return;
    setDeleteTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setError("");

    try {
      await deleteProduct(deleteTarget.id);

      const nextPage =
        products.length === 1 && pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page;

      setDeleteTarget(null);
      fetchProducts(nextPage);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              Product Management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Products
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Manage product records, product attributes, and initial inventory
              setup.
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={openCreateModal}
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold shadow-md shadow-blue-100 sm:w-auto"
            >
              + Add Product
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Filters</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search and narrow product records by SKU, name, size, or color.
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto]"
        >
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by SKU or product name"
          />

          <Input
            label="Size"
            name="size"
            value={filters.size}
            onChange={handleFilterChange}
            placeholder="XL, 36..."
          />

          <Input
            label="Color"
            name="color"
            value={filters.color}
            onChange={handleFilterChange}
            placeholder="Black, White..."
          />

          <Input
            label="Per Page"
            type="number"
            name="per_page"
            min="1"
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
        <Loader text="Loading products..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Product List
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {pagination.total} product{pagination.total === 1 ? "" : "s"}{" "}
                  found.
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {pagination.total} record{pagination.total === 1 ? "" : "s"}
              </span>
            </div>

            {products.length === 0 ? (
              <div className="px-5 py-7">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No products available
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Create your first product or adjust the current filters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Size</th>
                      <th className="px-5 py-3">Color</th>
                      <th className="px-5 py-3 text-right">Stock</th>
                      <th className="px-5 py-3 text-right">Unit Cost</th>
                      <th className="px-5 py-3">Purchase Date</th>
                      {isAdmin && (
                        <th className="px-5 py-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {product.sku}
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {product.name}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {product.size || "-"}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {product.color || "-"}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-slate-800">
                          {product.stock ?? product.inventory?.quantity ?? 0}
                        </td>

                        <td className="px-5 py-4 text-right font-medium text-slate-700">
                          ৳{formatMoney(product.inventory?.purchase_price)}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {product.inventory?.purchase_date || "-"}
                        </td>

                        {isAdmin && (
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                className="rounded-xl font-bold"
                                onClick={() => openEditModal(product)}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="danger"
                                className="rounded-xl font-bold"
                                onClick={() => openDeleteDialog(product)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {pagination.total > 0 && (
            <Pagination pagination={pagination} onPageChange={fetchProducts} />
          )}
        </>
      )}

      {showFormModal && (
        <Modal
          title={editingProduct ? "Edit Product" : "Add Product"}
          onClose={() => setShowFormModal(false)}
        >
          {formError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              label="SKU"
              name="sku"
              value={form.sku}
              onChange={handleFormChange}
              required
            />

            <Input
              label="Name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
            />

            <Input
              label="Size"
              name="size"
              value={form.size}
              onChange={handleFormChange}
            />

            <Input
              label="Color"
              name="color"
              value={form.color}
              onChange={handleFormChange}
            />

            <Input
              label="Quantity"
              type="number"
              min="0"
              name="quantity"
              value={form.quantity}
              onChange={handleFormChange}
              required
            />

            <Input
              label="Purchase Price"
              type="number"
              min="0"
              step="0.01"
              name="purchase_price"
              value={form.purchase_price}
              onChange={handleFormChange}
              required
            />

            <Input
              label="Purchase Date"
              type="date"
              name="purchase_date"
              value={form.purchase_date}
              onChange={handleFormChange}
            />

            <Input
              label="Low Stock Threshold"
              type="number"
              min="0"
              name="low_stock_threshold"
              value={form.low_stock_threshold}
              onChange={handleFormChange}
              required
            />

            <div className="flex justify-end gap-3 md:col-span-2">
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
                {saving
                  ? "Saving..."
                  : editingProduct
                    ? "Update Product"
                    : "Create Product"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product"
        message={`Are you sure you want to delete "${
          deleteTarget?.name || "this product"
        }"? This action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Keep Product"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}

export default ProductPage;
