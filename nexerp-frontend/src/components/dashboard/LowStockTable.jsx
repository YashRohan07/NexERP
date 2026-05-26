function LowStockTable({ products = [] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">
            Low Stock Products
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Products that are near or below their stock threshold.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {products.length} item{products.length === 1 ? "" : "s"}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="px-5 py-8">
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
            <p className="text-sm font-medium text-gray-700">
              No low stock products found.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Inventory is currently above the configured thresholds.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3 text-right">Threshold</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr
                  key={product.id || product.sku}
                  className="hover:bg-gray-50"
                >
                  <td className="px-5 py-4 font-semibold text-gray-950">
                    {product.sku || "-"}
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {product.name || "-"}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-gray-800">
                    {product.quantity ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700">
                    {product.threshold ?? "-"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      {product.status || "Low Stock"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default LowStockTable;
