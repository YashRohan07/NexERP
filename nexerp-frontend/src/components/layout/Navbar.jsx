import { useLocation, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../../utils/auth";

const pageMeta = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Overview & insights",
  },
  "/products": {
    title: "Products",
    subtitle: "Manage product records",
  },
  "/inventory": {
    title: "Inventory",
    subtitle: "Track stock and value",
  },
  "/suppliers": {
    title: "Suppliers",
    subtitle: "Manage supplier records",
  },
  "/purchases": {
    title: "Purchases",
    subtitle: "Supplier purchase activity",
  },
  "/customers": {
    title: "Customers",
    subtitle: "Manage customer records",
  },
  "/sales": {
    title: "Sales",
    subtitle: "Track sales transactions",
  },
  "/pos": {
    title: "POS",
    subtitle: "Point of sale checkout",
  },
  "/reports": {
    title: "Reports",
    subtitle: "Business performance reports",
  },
};

function formatRole(role) {
  const normalizedRole = String(role || "user").toLowerCase();

  if (normalizedRole === "admin") {
    return "Admin";
  }

  if (normalizedRole === "member") {
    return "Member";
  }

  return "User";
}

function getPageInfo(pathname) {
  if (pathname.startsWith("/purchases/")) {
    return {
      title: "Purchase Details",
      subtitle: "Purchase item breakdown",
    };
  }

  if (pathname.startsWith("/sales/")) {
    return {
      title: "Sale Details",
      subtitle: "Sale item breakdown",
    };
  }

  return (
    pageMeta[pathname] || {
      title: "NexERP",
      subtitle: "Business management system",
    }
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const displayRole = formatRole(user?.role);
  const initials =
    displayRole === "Admin" ? "A" : displayRole === "Member" ? "M" : "U";

  const pageInfo = getPageInfo(location.pathname);

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {pageInfo.title}
          </p>

          <p className="mt-0.5 hidden text-xs font-medium text-slate-400 sm:block">
            {pageInfo.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-sm">
              {initials}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-950">{displayRole}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
