function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Dashboard API integration will be added in Step 2.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Frontend foundation is ready.
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Auth, protected routes, sidebar layout, navbar, token storage, and
          logout are now connected.
        </p>
      </div>
    </div>
  );
}

export default DashboardPage;
