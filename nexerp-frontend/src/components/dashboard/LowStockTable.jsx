function LowStockTable({ products = [] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            Low Stock Products
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Products that need attention based on their configured threshold.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {products.length} item{products.length === 1 ? "" : "s"}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="px-5 py-7">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No stock alerts
            </p>
            <p className="mt-1 text-xs text-slate-500">
              All products are currently above their low-stock threshold.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3 text-right">Threshold</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr
                  key={product.id || product.sku}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    {product.sku || "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {product.name || "-"}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-800">
                    {product.quantity ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-right text-slate-700">
                    {product.threshold ?? "-"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
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
