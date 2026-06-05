import { NavLink } from "react-router-dom";

const links = [
  { label: "Dashboard", path: "/dashboard", icon: "▦" },
  { label: "Products", path: "/products", icon: "◈" },
  { label: "Inventory", path: "/inventory", icon: "▣" },
  { label: "Suppliers", path: "/suppliers", icon: "◇" },
  { label: "Purchases", path: "/purchases", icon: "▤" },
  { label: "Customers", path: "/customers", icon: "◎" },
  { label: "Sales", path: "/sales", icon: "◉" },
  { label: "POS", path: "/pos", icon: "◍" },
  { label: "Reports", path: "/reports", icon: "▥" },
];

function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="flex h-full flex-col px-5 py-5">
        <div className="mb-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm shadow-blue-100/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-200">
              N
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                NexERP
              </h1>
              <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-slate-500">
                Business Management System
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-1 space-y-1.5">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                  )}

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                    }`}
                  >
                    {link.icon}
                  </span>

                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
