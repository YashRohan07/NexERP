function formatMoney(value) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SummaryCards({ summary }) {
  const lowStockCount = Number(summary?.low_stock_count || 0);

  const cards = [
    {
      label: "Total Products",
      value: summary?.total_products || 0,
      helper: "Active product records",
      accent: "border-l-blue-500",
      tag: "Products",
      tagClass: "bg-blue-50 text-blue-700",
    },
    {
      label: "Total Quantity",
      value: summary?.total_quantity || 0,
      helper: "Current stock units",
      accent: "border-l-indigo-500",
      tag: "Stock",
      tagClass: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Inventory Value",
      value: formatMoney(summary?.inventory_value),
      prefix: "৳",
      helper: "Stock value at unit cost",
      accent: "border-l-emerald-500",
      tag: "Value",
      tagClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Low Stock Count",
      value: lowStockCount,
      helper:
        lowStockCount > 0
          ? "Products needing attention"
          : "No urgent stock alerts",
      accent: lowStockCount > 0 ? "border-l-red-500" : "border-l-gray-300",
      tag: lowStockCount > 0 ? "Alert" : "Stable",
      tagClass:
        lowStockCount > 0
          ? "bg-red-50 text-red-700"
          : "bg-gray-100 text-gray-700",
    },
    {
      label: "Total Purchases",
      value: formatMoney(summary?.total_purchases),
      prefix: "৳",
      helper: "Confirmed purchase value",
      accent: "border-l-amber-500",
      tag: "Purchase",
      tagClass: "bg-amber-50 text-amber-700",
    },
    {
      label: "Total Sales",
      value: formatMoney(summary?.total_sales),
      prefix: "৳",
      helper: "Confirmed sales value",
      accent: "border-l-purple-500",
      tag: "Sales",
      tagClass: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border border-gray-200 border-l-4 ${card.accent} bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${card.tagClass}`}
            >
              {card.tag}
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">
            {card.prefix}
            {card.value}
          </p>

          <p className="mt-4 text-xs font-medium text-gray-400">
            {card.helper}
          </p>
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;
