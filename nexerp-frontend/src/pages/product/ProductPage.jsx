import { useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../../api/productApi";
import Button from "../../components/common/Button";
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
    const nextFilters = {
      search: "",
      size: "",
      color: "",
      per_page: 10,
    };

    setFilters(nextFilters);

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

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete product "${product.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteProduct(product.id);
      fetchProducts(pagination.current_page);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Product Management
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              Products
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage product master data and initial inventory setup.
            </p>
          </div>

          {isAdmin && <Button onClick={openCreateModal}>Add Product</Button>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-4 md:grid-cols-5"
        >
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="SKU or name"
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
        <Loader text="Loading products..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Product List
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {pagination.total} product{pagination.total === 1 ? "" : "s"}{" "}
                  found.
                </p>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="px-5 py-8">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No products found.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Try changing filters or add a new product.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
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

                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-semibold text-gray-950">
                          {product.sku}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {product.name}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {product.size || "-"}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {product.color || "-"}
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-gray-800">
                          {product.stock ?? product.inventory?.quantity ?? 0}
                        </td>
                        <td className="px-5 py-4 text-right text-gray-700">
                          ৳
                          {Number(
                            product.inventory?.purchase_price || 0,
                          ).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {product.inventory?.purchase_date || "-"}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => openEditModal(product)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleDelete(product)}
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

          <Pagination pagination={pagination} onPageChange={fetchProducts} />
        </>
      )}

      {showFormModal && (
        <Modal
          title={editingProduct ? "Edit Product" : "Add Product"}
          onClose={() => setShowFormModal(false)}
        >
          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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
                onClick={() => setShowFormModal(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving}>
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
    </div>
  );
}

export default ProductPage;
