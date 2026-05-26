function Loader({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
      {text}
    </div>
  );
}

export default Loader;
