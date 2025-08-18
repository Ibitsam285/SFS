export default function ErrorModal({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed z-999 inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-red-800 text-white p-4 rounded-lg shadow-lg flex flex-col items-center border border-red-400 min-w-[260px]">
        <div className="mb-2 font-bold text-lg">Error</div>
        <div className="mb-4 text-center">{message}</div>
        <button
          className="bg-gray-200 hover:bg-gray-300 text-red-800 font-semibold px-4 py-1 rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}