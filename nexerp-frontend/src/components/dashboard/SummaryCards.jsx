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
      accent: "from-blue-500 to-blue-600",
      icon: "▦",
      tag: "Products",
      tagClass: "bg-blue-50 text-blue-700",
    },
    {
      label: "Total Stock",
      value: summary?.total_quantity || 0,
      helper: "Current stock units",
      accent: "from-indigo-500 to-indigo-600",
      icon: "▣",
      tag: "Stock",
      tagClass: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Inventory Value",
      value: formatMoney(summary?.inventory_value),
      prefix: "৳",
      helper: "Stock value at unit cost",
      accent: "from-emerald-500 to-emerald-600",
      icon: "৳",
      tag: "Value",
      tagClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Stock Alerts",
      value: lowStockCount,
      helper:
        lowStockCount > 0 ? "Items below threshold" : "No urgent stock alerts",
      accent:
        lowStockCount > 0
          ? "from-red-500 to-red-600"
          : "from-slate-400 to-slate-500",
      icon: "⚠",
      tag: lowStockCount > 0 ? "Alert" : "Stable",
      tagClass:
        lowStockCount > 0
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-700",
    },
    {
      label: "Total Purchases",
      value: formatMoney(summary?.total_purchases),
      prefix: "৳",
      helper: "Confirmed purchase value",
      accent: "from-amber-500 to-orange-500",
      icon: "▤",
      tag: "Purchase",
      tagClass: "bg-amber-50 text-amber-700",
    },
    {
      label: "Total Sales",
      value: formatMoney(summary?.total_sales),
      prefix: "৳",
      helper: "Confirmed sales value",
      accent: "from-purple-500 to-fuchsia-500",
      icon: "◉",
      tag: "Sales",
      tagClass: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-base font-black text-white shadow-md`}
              >
                {card.icon}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-600">
                  {card.label}
                </p>

                <p className="mt-0.5 text-xs font-medium text-slate-400">
                  {card.helper}
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${card.tagClass}`}
            >
              {card.tag}
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            {card.prefix}
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;
