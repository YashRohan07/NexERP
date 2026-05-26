function Modal({ title, children, onClose, width = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={`w-full ${width} rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-950">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            Close
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
