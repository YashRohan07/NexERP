import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />

        <div className="min-h-screen flex-1">
          <Navbar />

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
