import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Navbar />

          <main className="w-full min-w-0 flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
