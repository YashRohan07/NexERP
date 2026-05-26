import { useNavigate } from "react-router-dom";
import { logout } from "../../api/authApi";
import Button from "../common/Button";
import { clearAuth, getUser } from "../../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Local logout should still happen even if the API request fails.
    } finally {
      clearAuth();
      navigate("/login");
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {user?.name || "NexERP User"}
        </p>
        <p className="text-xs capitalize text-gray-500">
          Role: {user?.role || "unknown"}
        </p>
      </div>

      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}

export default Navbar;
