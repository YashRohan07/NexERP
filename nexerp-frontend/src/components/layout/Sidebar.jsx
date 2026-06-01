import { NavLink } from "react-router-dom";

const links = [
  { label: "Dashboard", path: "/", icon: "▦" },
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
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-gray-200 bg-white md:block">
      <div className="flex h-full flex-col px-5 py-5">
        <div className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-md shadow-blue-200">
              N
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-gray-950">
                NexERP
              </h1>
              <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-gray-500">
                Business Management System
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-2 space-y-1.5">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                    }`}
                  >
                    {link.icon}
                  </span>

                  <span>{link.label}</span>

                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                  )}
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
