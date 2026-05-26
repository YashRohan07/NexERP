import { NavLink } from "react-router-dom";

const links = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Products", path: "/products" },
  { label: "Inventory", path: "/inventory" },
  { label: "Suppliers", path: "/suppliers" },
  { label: "Purchases", path: "/purchases" },
  { label: "Customers", path: "/customers" },
  { label: "Sales", path: "/sales" },
  { label: "POS", path: "/pos" },
  { label: "Reports", path: "/reports" },
];

function Sidebar() {
  return (
    <aside className="min-h-screen w-64 shrink-0 border-r border-gray-200 bg-white px-4 py-5">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">NexERP</h1>
        <p className="mt-1 text-xs text-gray-500">Business Management System</p>
      </div>

      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/dashboard"}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
