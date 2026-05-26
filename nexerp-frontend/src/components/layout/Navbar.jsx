import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">{user?.name || "User"}</p>
          <p className="text-xs text-gray-500">Role: {user?.role || "-"}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
