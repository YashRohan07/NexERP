function getStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "confirmed") {
    return "bg-green-50 text-green-700";
  }

  if (normalizedStatus === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (normalizedStatus === "draft") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-gray-100 text-gray-700";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function RecentPurchases({ purchases = [] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">
            Recent Purchases
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Latest supplier purchase activity.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          Latest {purchases.length}
        </span>
      </div>

      {purchases.length === 0 ? (
        <div className="px-5 py-8">
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
            <p className="text-sm font-medium text-gray-700">
              No recent purchases found.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Purchase activity will appear here after records are created.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Purchase ID</th>
                <th className="px-5 py-3">Supplier</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-950">
                    #{purchase.id}
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {purchase.supplier || "-"}
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {purchase.purchase_date || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                        purchase.status,
                      )}`}
                    >
                      {purchase.status || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-gray-800">
                    ৳{formatMoney(purchase.total_amount)}
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

export default RecentPurchases;
