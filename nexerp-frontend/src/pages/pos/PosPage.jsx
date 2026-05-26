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

  return "bg-gray-100 text-gray-700";
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Point of Sale
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">
              POS Checkout
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Search products, build a cart, complete checkout, and print
              receipts.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4 text-center">
            <p className="text-sm font-medium text-blue-700">Cart Total</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">
              {formatMoney(cartTotal)}
            </p>
            <p className="mt-1 text-sm text-blue-700">{cartQuantity} items</p>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Member users can view POS products only. Add to cart and checkout are
          admin-only actions.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div
        className={`grid gap-6 ${isAdmin ? "xl:grid-cols-[1fr_420px]" : ""}`}
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-gray-700">
              Search Products
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by SKU, name, size, or color"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h2 className="text-xl font-bold text-gray-950">
                Available Products
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {filteredProducts.length} products available.
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                No POS products found.
              </div>
            ) : (
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {filteredProducts.map((product) => {
                  const remainingStock = getRemainingStock(product);
                  const isOutOfStock = remainingStock <= 0;

                  return (
                    <div
                      key={product.product_id}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-gray-500">
                            {product.sku}
                          </p>
                          <h3 className="mt-1 text-xl font-bold text-gray-950">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {product.size} / {product.color}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            product.stock_status,
                          )}`}
                        >
                          {product.stock_status}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-sm text-gray-500">Stock</p>
                          <p className="mt-1 font-bold text-gray-950">
                            {isAdmin ? remainingStock : product.available_stock}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-sm text-gray-500">Unit Cost</p>
                          <p className="mt-1 font-bold text-gray-950">
                            {formatMoney(product.unit_cost)}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={isOutOfStock}
                          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
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
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-5">
                <h2 className="text-xl font-bold text-gray-950">
                  Checkout Cart
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Review items before completing checkout.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Customer
                  </label>
                  <select
                    name="customer_id"
                    value={checkoutForm.customer_id}
                    onChange={handleCheckoutFormChange}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  <label className="text-sm font-medium text-gray-700">
                    Sale Date
                  </label>
                  <input
                    type="date"
                    name="sale_date"
                    value={checkoutForm.sale_date}
                    onChange={handleCheckoutFormChange}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={checkoutForm.payment_method}
                    onChange={handleCheckoutFormChange}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Note
                  </label>
                  <input
                    type="text"
                    name="note"
                    value={checkoutForm.note}
                    onChange={handleCheckoutFormChange}
                    placeholder="Optional"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {cart.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      Cart is empty.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Add products from the product list.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product_id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-gray-950">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {item.sku} / Stock: {item.available_stock}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_id)}
                            className="text-sm font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">
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
                              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700">
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
                              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-white px-4 py-3 text-right text-sm font-bold text-gray-950">
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

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center justify-between text-sm text-blue-700">
                    <span>Items</span>
                    <span>{cartQuantity}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-950">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-gray-950">
                      {formatMoney(cartTotal)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={checkoutLoading || cart.length === 0}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading || cart.length === 0}
                    className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {checkoutLoading ? "Processing..." : "Checkout"}
                  </button>
                </div>
              </div>
            </div>

            {receipt && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-5">
                  <h2 className="text-xl font-bold text-gray-950">
                    Receipt #{receipt.sale_id}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Checkout completed successfully.
                  </p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Customer</p>
                      <p className="font-bold text-gray-950">
                        {receipt.customer?.name || "Walk-in Customer"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-bold text-gray-950">
                        {receipt.sale_date}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Channel</p>
                      <p className="font-bold uppercase text-gray-950">
                        {receipt.sale_channel || "POS"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Payment</p>
                      <p className="font-bold capitalize text-gray-950">
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
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-gray-950">
                              {item.name}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {item.sku} x {item.quantity} @{" "}
                              {formatMoney(item.selling_price)}
                            </p>
                          </div>

                          <p className="font-bold text-gray-950">
                            {formatMoney(item.line_total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-gray-950 p-5 text-white">
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
          </div>
        )}
      </div>
    </div>
  );
}

export default PosPage;
