import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../api/categoryApi";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { getRole } from "../../utils/auth";

const emptyForm = {
  name: "",
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

function CategoryPage() {
  const isAdmin = getRole() === "admin";

  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [filters, setFilters] = useState({
    search: "",
    per_page: 10,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchCategories(1);
  }, []);

  function buildParams(page = 1) {
    const params = {
      page,
      per_page: filters.per_page,
    };

    if (filters.search) params.search = filters.search;

    return params;
  }

  async function fetchCategories(page = 1) {
    setLoading(true);
    setError("");

    try {
      const response = await getCategories(buildParams(page));
      const data = response.data?.data || {};

      setCategories(data.categories || []);
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
    fetchCategories(1);
  }

  function resetFilters() {
    setFilters({
      search: "",
      per_page: 10,
    });

    setTimeout(() => {
      fetchCategories(1);
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
    setEditingCategory(null);
    setForm(emptyForm);
    setFormError("");
    setShowFormModal(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
    });
    setFormError("");
    setShowFormModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    const payload = {
      name: form.name.trim(),
    };

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await createCategory(payload);
      }

      setShowFormModal(false);
      setEditingCategory(null);
      setForm(emptyForm);
      fetchCategories(pagination.current_page);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(category) {
    setError("");
    setDeleteTarget(category);
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
      await deleteCategory(deleteTarget.id);

      const nextPage =
        categories.length === 1 && pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page;

      setDeleteTarget(null);
      fetchCategories(nextPage);
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
              Category Management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Categories
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Create and manage product categories before adding products.
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={openCreateModal}
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold shadow-md shadow-blue-100 sm:w-auto"
            >
              + Add Category
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Filters</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search and narrow category records by name.
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-4 lg:grid-cols-[1.5fr_0.7fr_auto]"
        >
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by category name"
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
        <Loader text="Loading categories..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Category List
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {pagination.total} categor
                  {pagination.total === 1 ? "y" : "ies"} found.
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {pagination.total} record{pagination.total === 1 ? "" : "s"}
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="px-5 py-7">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No categories available
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Create your first category before adding products.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Category Name</th>
                      {isAdmin && (
                        <th className="px-5 py-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-medium text-slate-700">
                          {category.name}
                        </td>

                        {isAdmin && (
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                className="rounded-xl font-bold"
                                onClick={() => openEditModal(category)}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="danger"
                                className="rounded-xl font-bold"
                                onClick={() => openDeleteDialog(category)}
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
            <Pagination
              pagination={pagination}
              onPageChange={fetchCategories}
            />
          )}
        </>
      )}

      {showFormModal && (
        <Modal
          title={editingCategory ? "Edit Category" : "Add Category"}
          onClose={() => setShowFormModal(false)}
          width="max-w-lg"
        >
          {formError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Category Name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Example: Shirt"
              required
            />

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
                {saving
                  ? "Saving..."
                  : editingCategory
                    ? "Update Category"
                    : "Create Category"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        message={`Are you sure you want to delete "${
          deleteTarget?.name || "this category"
        }"? If this category is already used by products, it cannot be deleted.`}
        confirmText="Delete Category"
        cancelText="Keep Category"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}

export default CategoryPage;
