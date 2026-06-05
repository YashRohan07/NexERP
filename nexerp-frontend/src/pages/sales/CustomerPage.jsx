import { useEffect, useState } from "react";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../../api/customerApi";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { getRole } from "../../utils/auth";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
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

function CustomerPage() {
  const isAdmin = getRole() === "admin";

  const [customers, setCustomers] = useState([]);
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
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  function buildParams(page = 1) {
    const params = {
      page,
      per_page: filters.per_page,
    };

    if (filters.search) {
      params.search = filters.search;
    }

    return params;
  }

  async function fetchCustomers(page = 1) {
    setLoading(true);
    setError("");

    try {
      const response = await getCustomers(buildParams(page));
      const data = response.data?.data || {};

      setCustomers(data.customers || []);
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
    fetchCustomers(1);
  }

  function resetFilters() {
    setFilters({
      search: "",
      per_page: 10,
    });

    setTimeout(() => {
      fetchCustomers(1);
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
    setEditingCustomer(null);
    setForm(emptyForm);
    setFormError("");
    setShowFormModal(true);
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setFormError("");
    setShowFormModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    const payload = {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    };

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
      } else {
        await createCustomer(payload);
      }

      setShowFormModal(false);
      setEditingCustomer(null);
      setForm(emptyForm);
      fetchCustomers(pagination.current_page);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(customer) {
    setError("");
    setDeleteTarget(customer);
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
      await deleteCustomer(deleteTarget.id);

      const nextPage =
        customers.length === 1 && pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page;

      setDeleteTarget(null);
      fetchCustomers(nextPage);
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
              Customer Management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Customers
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Manage retail and walk-in customer records for sales activity.
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={openCreateModal}
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold shadow-md shadow-blue-100 sm:w-auto"
            >
              + Add Customer
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Filters</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search customer records by name, phone, or email.
          </p>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-4 md:grid-cols-[1.5fr_0.8fr_auto]"
        >
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by customer name, phone, or email"
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
        <Loader text="Loading customers..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Customer List
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {pagination.total} customer
                  {pagination.total === 1 ? "" : "s"} found.
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {pagination.total} record{pagination.total === 1 ? "" : "s"}
              </span>
            </div>

            {customers.length === 0 ? (
              <div className="px-5 py-7">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No customers available
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Create your first customer or adjust the current filters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Phone</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Address</th>
                      {isAdmin && (
                        <th className="px-5 py-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {customer.name}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {customer.phone || "-"}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {customer.email || "-"}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {customer.address || "-"}
                        </td>

                        {isAdmin && (
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                className="rounded-xl font-bold"
                                onClick={() => openEditModal(customer)}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="danger"
                                className="rounded-xl font-bold"
                                onClick={() => openDeleteDialog(customer)}
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
            <Pagination pagination={pagination} onPageChange={fetchCustomers} />
          )}
        </>
      )}

      {showFormModal && (
        <Modal
          title={editingCustomer ? "Edit Customer" : "Add Customer"}
          onClose={() => setShowFormModal(false)}
        >
          {formError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              label="Name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
            />

            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleFormChange}
            />

            <Input
              label="Address"
              name="address"
              value={form.address}
              onChange={handleFormChange}
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
                  : editingCustomer
                    ? "Update Customer"
                    : "Create Customer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Customer"
        message={`Are you sure you want to delete "${
          deleteTarget?.name || "this customer"
        }"? This action cannot be undone.`}
        confirmText="Delete Customer"
        cancelText="Keep Customer"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}

export default CustomerPage;
