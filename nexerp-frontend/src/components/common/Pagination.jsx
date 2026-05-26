function Pagination({ pagination, onPageChange }) {
  const currentPage = Number(pagination?.current_page || 1);
  const lastPage = Number(pagination?.last_page || 1);
  const total = Number(pagination?.total || 0);
  const perPage = Number(pagination?.per_page || 10);

  if (lastPage <= 1) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
        Showing {total} record{total === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center">
      <p className="text-sm text-gray-600">
        Page <span className="font-semibold">{currentPage}</span> of{" "}
        <span className="font-semibold">{lastPage}</span> · {total} total ·{" "}
        {perPage} per page
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
