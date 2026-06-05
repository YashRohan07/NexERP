import { useEffect, useState } from "react";
import { adjustStock, getInventory } from "../../api/inventoryApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import Select from "../../components/common/Select";
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

  if (normalizedStatus === "in stock") {
    return "bg-green-50 text-green-700";
  }

  if (normalizedStatus === "low stock") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "out of stock") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function InventoryPage() {
  const isAdmin = getRole() === "admin";

  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [filters, setFilters] = useState({
    search: "",
    stock_status: "",
    date_from: "",
    date_to: "",
    sort_by: "quantity",
    sort_direction: "asc",
    per_page: 10,
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustment_type: "increase",
    quantity: "",
  });

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState("");
  const [adjustError, setAdjustError] = useState("");

  useEffect(() => {
    fetchInventory(1);
  }, []);

  function buildParams(page = 1) {
    const params = {
      page,
      per_page: filters.per_page,
    };

    if (filters.search) params.search = filters.search;
    if (filters.stock_status) params.stock_status = filters.stock_status;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_direction) params.sort_direction = filters.sort_direction;

    return params;
  }

  async function fetchInventory(page = 1) {
    setLoading(true);
    setError("");

    try {
      const response = await getInventory(buildParams(page));
      const data = response.data?.data || {};

      setInventory(data.inventory || []);
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
    fetchInventory(1);
  }

  function resetFilters() {
    setFilters({
      search: "",
      stock_status: "",
      date_from: "",
      date_to: "",
      sort_by: "quantity",
      sort_direction: "asc",
      per_page: 10,
    });

    setTimeout(() => {
      fetchInventory(1);
    }, 0);
  }

  function openAdjustModal(item) {
    setSelectedItem(item);
    setAdjustForm({
      adjustment_type: "increase",
      quantity: "",
    });
    setAdjustError("");
    setShowAdjustModal(true);
  }

  function handleAdjustChange(event) {
    const { name, value } = event.target;

    setAdjustForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function getNewQuantityPreview() {
    const currentQuantity = Number(selectedItem?.quantity || 0);
    const adjustmentQuantity = Number(adjustForm.quantity || 0);

    if (adjustForm.adjustment_type === "increase") {
      return currentQuantity + adjustmentQuantity;
    }

    if (adjustForm.adjustment_type === "decrease") {
      return Math.max(currentQuantity - adjustmentQuantity, 0);
    }

    return adjustmentQuantity;
  }

  async function handleAdjustSubmit(event) {
    event.preventDefault();

    if (!selectedItem) return;

    setAdjusting(true);
    setAdjustError("");

    try {
      await adjustStock(selectedItem.product_id, {
        adjustment_type: adjustForm.adjustment_type,
        quantity: Number(adjustForm.quantity),
      });

      setShowAdjustModal(false);
      setSelectedItem(null);
      fetchInventory(pagination.current_page);
    } catch (err) {
      setAdjustError(getErrorMessage(err));
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
            Stock Control
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Inventory
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Monitor stock levels, inventory value, purchase cost, thresholds,
            and product status.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Filters</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search and narrow inventory records by product, stock status, date,
            and sorting options.
          </p>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_0.8fr_auto]"
        >
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="SKU / product name"
          />

          <Select
            label="Status"
            name="stock_status"
            value={filters.stock_status}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
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

          <Select
            label="Sort By"
            name="sort_by"
            value={filters.sort_by}
            onChange={handleFilterChange}
          >
            <option value="quantity">Quantity</option>
            <option value="purchase_price">Price</option>
            <option value="total_value">Value</option>
            <option value="purchase_date">Purchase Date</option>
          </Select>

          <Select
            label="Direction"
            name="sort_direction"
            value={filters.sort_direction}
            onChange={handleFilterChange}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>

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
        <Loader text="Loading inventory..." />
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Inventory List
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {pagination.total} inventory record
                  {pagination.total === 1 ? "" : "s"} found.
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {pagination.total} record{pagination.total === 1 ? "" : "s"}
              </span>
            </div>

            {inventory.length === 0 ? (
              <div className="px-5 py-7">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No inventory records available
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Create products with initial stock or adjust the current
                    filters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3 text-right">Qty</th>
                      <th className="px-5 py-3 text-right">Unit Cost</th>
                      <th className="px-5 py-3 text-right">Total Value</th>
                      <th className="px-5 py-3 text-right">Threshold</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Purchase Date</th>
                      {isAdmin && (
                        <th className="px-5 py-3 text-right">Action</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((item) => (
                      <tr
                        key={item.product_id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {item.sku}
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {item.name}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-slate-800">
                          {item.quantity}
                        </td>

                        <td className="px-5 py-4 text-right font-medium text-slate-700">
                          ৳{formatMoney(item.purchase_price)}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-slate-800">
                          ৳{formatMoney(item.total_value)}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-700">
                          {item.low_stock_threshold}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {item.purchase_date || "-"}
                        </td>

                        {isAdmin && (
                          <td className="px-5 py-4 text-right">
                            <Button
                              variant="outline"
                              className="rounded-xl font-bold"
                              onClick={() => openAdjustModal(item)}
                            >
                              Adjust
                            </Button>
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
            <Pagination pagination={pagination} onPageChange={fetchInventory} />
          )}
        </>
      )}

      {showAdjustModal && selectedItem && (
        <Modal
          title={`Adjust Stock - ${selectedItem.name}`}
          onClose={() => setShowAdjustModal(false)}
          width="max-w-xl"
        >
          {adjustError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {adjustError}
            </div>
          )}

          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-700">SKU:</span>{" "}
                {selectedItem.sku}
              </p>

              <p>
                <span className="font-semibold text-slate-700">
                  Current Qty:
                </span>{" "}
                {selectedItem.quantity}
              </p>

              <p>
                <span className="font-semibold text-slate-700">Threshold:</span>{" "}
                {selectedItem.low_stock_threshold}
              </p>

              <p>
                <span className="font-semibold text-slate-700">Status:</span>{" "}
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusClass(
                    selectedItem.status,
                  )}`}
                >
                  {selectedItem.status}
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <Select
              label="Adjustment Type"
              name="adjustment_type"
              value={adjustForm.adjustment_type}
              onChange={handleAdjustChange}
              required
            >
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
              <option value="set">Set Quantity</option>
            </Select>

            <Input
              label="Quantity"
              type="number"
              min="0"
              name="quantity"
              value={adjustForm.quantity}
              onChange={handleAdjustChange}
              required
            />

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-700">
                New Quantity Preview
              </p>

              <p className="mt-1 text-3xl font-bold text-blue-950">
                {getNewQuantityPreview()}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-bold"
                onClick={() => setShowAdjustModal(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={adjusting}
                className="rounded-xl font-bold"
              >
                {adjusting ? "Adjusting..." : "Update Stock"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default InventoryPage;
