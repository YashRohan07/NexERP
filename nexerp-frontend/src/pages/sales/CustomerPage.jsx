import { useEffect, useState } from "react";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../../api/customerApi";
import Button from "../../components/common/Button";
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      try {
        const response = await getCustomers({ page: 1, per_page: 10 });
        const data = response.data?.data || {};

        if (isMounted) {
          setCustomers(data.customers || []);
          setPagination(
            data.pagination || {
              current_page: 1,
              per_page: 10,
              total: 0,
              last_page: 1,
            },
          );
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

    loadCustomers();

    return () => {
      isMounted = false;
    };
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

  async function handleDelete(customer) {
    const confirmed = window.confirm(
      `Delete customer "${customer.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteCustomer(customer.id);
      fetchCustomers(pagination.current_page);
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
              Customer Management
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              Customers
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage retail and walk-in customer information used for sales.
            </p>
          </div>

          {isAdmin && <Button onClick={openCreateModal}>Add Customer</Button>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-4 md:grid-cols-4"
        >
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Customer name, phone, email"
          />

          <Input
            label="Per Page"
            type="number"
            min="1"
            name="per_page"
            value={filters.per_page}
            onChange={handleFilterChange}
          />

          <div className="flex items-end gap-2 md:col-span-2">
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
        <Loader text="Loading customers..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-950">
                Customer List
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {pagination.total} customer
                {pagination.total === 1 ? "" : "s"} found.
              </p>
            </div>

            {customers.length === 0 ? (
              <div className="px-5 py-8">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No customers found.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Try changing filters or add a new customer.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
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

                  <tbody className="divide-y divide-gray-100">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-semibold text-gray-950">
                          {customer.name}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {customer.phone || "-"}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {customer.email || "-"}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {customer.address || "-"}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => openEditModal(customer)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleDelete(customer)}
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

          <Pagination pagination={pagination} onPageChange={fetchCustomers} />
        </>
      )}

      {showFormModal && (
        <Modal
          title={editingCustomer ? "Edit Customer" : "Add Customer"}
          onClose={() => setShowFormModal(false)}
        >
          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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
                onClick={() => setShowFormModal(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving}>
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
    </div>
  );
}

export default CustomerPage;
