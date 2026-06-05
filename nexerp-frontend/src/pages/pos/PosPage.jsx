import { useEffect, useMemo, useState } from "react";
import { getCustomers } from "../../api/customerApi";
import { checkoutPos, getPosProducts } from "../../api/posApi";
import Loader from "../../components/common/Loader";
import { getRole } from "../../utils/auth";

const today = new Date().toISOString().slice(0, 10);

const emptyCheckoutForm = {
  customer_id: "",
  sale_date: today,
  payment_method: "cash",
  note: "",
};

function formatMoney(value) {
  const amount = Number(value || 0);

  return `৳${amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function getErrorMessage(error) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.errors) {
    const firstError = Object.values(error.response.data.errors)?.[0]?.[0];

    if (firstError) {
      return firstError;
    }
  }

  return "Something went wrong. Please try again.";
}

function getStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("low")) {
    return "bg-amber-50 text-amber-700";
  }

  if (normalizedStatus.includes("stock")) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

function normalizeProduct(product) {
  return {
    product_id: product.product_id || product.id,
    sku: product.sku || "-",
    name: product.name || "-",
    size: product.size || "-",
    color: product.color || "-",
    available_stock: Number(product.available_stock ?? product.stock ?? 0),
    unit_cost: product.unit_cost || product.purchase_price || 0,
    stock_status: product.stock_status || "In Stock",
  };
}

function PosPage() {
  const role = getRole();
  const isAdmin = role === "admin";

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);

  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [recentlyAddedProductId, setRecentlyAddedProductId] = useState(null);
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter((product) => {
      return [
        product.sku,
        product.name,
        product.size,
        product.color,
        product.stock_status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [products, search]);

  const cartQuantity = useMemo(() => {
    return cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return (
        total + Number(item.quantity || 0) * Number(item.selling_price || 0)
      );
    }, 0);
  }, [cart]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const requests = [getPosProducts({ per_page: 50 })];

        if (isAdmin) {
          requests.push(getCustomers({ per_page: 50 }));
        }

        const responses = await Promise.all(requests);
        const productResponse = responses[0];
        const customerResponse = responses[1];

        if (isMounted) {
          const productList =
            productResponse.data?.data?.products?.map(normalizeProduct) || [];

          setProducts(productList);

          if (isAdmin) {
            setCustomers(customerResponse?.data?.data?.customers || []);
          }
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

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  function handleCheckoutFormChange(event) {
    const { name, value } = event.target;

    setCheckoutForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function getProductCartQuantity(productId) {
    const cartItem = cart.find((item) => item.product_id === productId);

    return Number(cartItem?.quantity || 0);
  }

  function getRemainingStock(product) {
    const productId = product.product_id;
    const availableStock = Number(product.available_stock || 0);
    const cartQuantityForProduct = getProductCartQuantity(productId);

    return Math.max(availableStock - cartQuantityForProduct, 0);
  }

  function addToCart(product) {
    if (!isAdmin) {
      return;
    }

    const remainingStock = getRemainingStock(product);

    if (remainingStock <= 0) {
      setError("No stock available for this product.");
      return;
    }

    setError("");
    setReceipt(null);
    setRecentlyAddedProductId(product.product_id);

    window.setTimeout(() => {
      setRecentlyAddedProductId(null);
    }, 900);

    setCart((previous) => {
      const existingItem = previous.find(
        (item) => item.product_id === product.product_id,
      );

      if (existingItem) {
        return previous.map((item) => {
          if (item.product_id !== product.product_id) {
            return item;
          }

          return {
            ...item,
            quantity: Number(item.quantity || 0) + 1,
          };
        });
      }

      return [
        ...previous,
        {
          product_id: product.product_id,
          sku: product.sku,
          name: product.name,
          available_stock: Number(product.available_stock || 0),
          quantity: 1,
          selling_price: Number(product.unit_cost || 0),
        },
      ];
    });
  }

  function updateCartItem(productId, field, value) {
    setError("");
    setReceipt(null);

    setCart((previous) =>
      previous.map((item) => {
        if (item.product_id !== productId) {
          return item;
        }

        let nextValue = value;

        if (field === "quantity") {
          nextValue = Math.max(1, Number(value || 1));
          nextValue = Math.min(nextValue, Number(item.available_stock || 0));
        }

        if (field === "selling_price") {
          nextValue = Math.max(0, Number(value || 0));
        }

        return {
          ...item,
          [field]: nextValue,
        };
      }),
    );
  }

  function removeFromCart(productId) {
    setError("");
    setReceipt(null);

    setCart((previous) =>
      previous.filter((item) => item.product_id !== productId),
    );
  }

  function clearCart() {
    setCart([]);
    setReceipt(null);
    setError("");
  }

  async function handleCheckout() {
    if (!isAdmin) {
      setError("Only admin users can complete POS checkout.");
      return;
    }

    if (!cart.length) {
      setError("Please add at least one product to the cart.");
      return;
    }

    setCheckoutLoading(true);
    setError("");
    setReceipt(null);

    try {
      const payload = {
        customer_id: checkoutForm.customer_id
          ? Number(checkoutForm.customer_id)
          : null,
        sale_date: checkoutForm.sale_date,
        payment_method: checkoutForm.payment_method,
        note: checkoutForm.note || null,
        items: cart.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          selling_price: Number(item.selling_price),
        })),
      };

      const response = await checkoutPos(payload);
      const receiptData = response.data?.data?.receipt || null;

      setReceipt(receiptData);
      setCart([]);
      setCheckoutForm(emptyCheckoutForm);

      const productResponse = await getPosProducts({ per_page: 50 });
      setProducts(
        productResponse.data?.data?.products?.map(normalizeProduct) || [],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return <Loader text="Loading POS..." />;
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              Point of Sale
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              POS Checkout
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Search products, add items to cart, and complete quick customer
              checkout.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-center shadow-sm sm:w-auto sm:min-w-36">
            <p className="text-sm font-semibold text-blue-700">Cart Total</p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {formatMoney(cartTotal)}
            </p>

            <p className="mt-1 text-sm font-medium text-blue-700">
              {cartQuantity} item{cartQuantity === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      {!isAdmin && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          Member users can view POS products only. Add to cart and checkout are
          admin-only actions.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section
        className={`grid gap-5 ${isAdmin ? "xl:grid-cols-[1fr_420px]" : ""}`}
      >
        <div className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950">
                Product Search
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Find checkout products by SKU, name, size, or color.
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by SKU, name, size, or color"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Available Products
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredProducts.length} product
                  {filteredProducts.length === 1 ? "" : "s"} available.
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {filteredProducts.length} item
                {filteredProducts.length === 1 ? "" : "s"}
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="px-5 py-7">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No products available for checkout
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Add products with stock or adjust your search keyword.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {filteredProducts.map((product) => {
                  const remainingStock = getRemainingStock(product);
                  const isOutOfStock = remainingStock <= 0;
                  const isRecentlyAdded =
                    recentlyAddedProductId === product.product_id;

                  return (
                    <div
                      key={product.product_id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            {product.sku}
                          </p>

                          <h3 className="mt-1 truncate text-lg font-bold text-slate-950">
                            {product.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {product.size} / {product.color}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            product.stock_status,
                          )}`}
                        >
                          {product.stock_status}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Stock
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-950">
                            {isAdmin ? remainingStock : product.available_stock}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Selling Price
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-950">
                            {formatMoney(product.unit_cost)}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={isOutOfStock}
                          className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none ${
                            isRecentlyAdded
                              ? "bg-emerald-600 shadow-emerald-100"
                              : "bg-blue-600 shadow-blue-100 hover:bg-blue-700"
                          }`}
                        >
                          {isOutOfStock
                            ? "Out of Stock"
                            : isRecentlyAdded
                              ? "Added ✓"
                              : "Add to Cart"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {isAdmin && (
          <aside className="min-w-0 space-y-5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 xl:sticky xl:top-24">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-950">
                  Checkout Cart
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review selected items and complete the sale.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Customer
                  </label>

                  <select
                    name="customer_id"
                    value={checkoutForm.customer_id}
                    onChange={handleCheckoutFormChange}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Walk-in / Default Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Sale Date
                  </label>

                  <input
                    type="date"
                    name="sale_date"
                    value={checkoutForm.sale_date}
                    onChange={handleCheckoutFormChange}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Payment Method
                  </label>

                  <select
                    name="payment_method"
                    value={checkoutForm.payment_method}
                    onChange={handleCheckoutFormChange}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Note
                  </label>

                  <input
                    type="text"
                    name="note"
                    value={checkoutForm.note}
                    onChange={handleCheckoutFormChange}
                    placeholder="Optional"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Cart is empty
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Add products from the product list.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product_id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-slate-950">
                              {item.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.sku} / Stock: {item.available_stock}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_id)}
                            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Qty
                            </label>

                            <input
                              type="number"
                              min="1"
                              max={item.available_stock}
                              value={item.quantity}
                              onChange={(event) =>
                                updateCartItem(
                                  item.product_id,
                                  "quantity",
                                  event.target.value,
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Price
                            </label>

                            <input
                              type="number"
                              min="0"
                              value={item.selling_price}
                              onChange={(event) =>
                                updateCartItem(
                                  item.product_id,
                                  "selling_price",
                                  event.target.value,
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-white px-4 py-3 text-right text-sm font-bold text-slate-950">
                          Line Total:{" "}
                          {formatMoney(
                            Number(item.quantity || 0) *
                              Number(item.selling_price || 0),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-blue-700">
                    <span>Items</span>
                    <span>{cartQuantity}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-950">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-slate-950">
                      {formatMoney(cartTotal)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={checkoutLoading || cart.length === 0}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading || cart.length === 0}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
                  >
                    {checkoutLoading ? "Processing..." : "Checkout"}
                  </button>
                </div>
              </div>
            </div>

            {receipt && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-bold text-slate-950">
                    Receipt #{receipt.sale_id}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Checkout completed successfully.
                  </p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Customer</p>

                      <p className="font-bold text-slate-950">
                        {receipt.customer?.name || "Walk-in Customer"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Date</p>

                      <p className="font-bold text-slate-950">
                        {receipt.sale_date}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Channel</p>

                      <p className="font-bold uppercase text-slate-950">
                        {receipt.sale_channel || "POS"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Payment</p>

                      <p className="font-bold capitalize text-slate-950">
                        {String(receipt.payment_method || "-").replace(
                          "_",
                          " ",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(receipt.items || []).map((item, index) => (
                      <div
                        key={`${item.sku}-${index}`}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-950">
                              {item.name}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.sku} × {item.quantity} @{" "}
                              {formatMoney(item.selling_price)}
                            </p>
                          </div>

                          <p className="font-bold text-slate-950">
                            {formatMoney(item.line_total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">Total Paid</span>

                      <span className="text-2xl font-bold">
                        {formatMoney(receipt.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </section>
    </div>
  );
}

export default PosPage;
