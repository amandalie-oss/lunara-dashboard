const COLORS = {
  approved: "bg-green-900 text-green-300",
  declined: "bg-red-900 text-red-300",
  pending: "bg-yellow-900 text-yellow-300",
  refunded: "bg-purple-900 text-purple-300",
  high: "bg-red-800 text-red-200",
  medium: "bg-yellow-800 text-yellow-200",
  low: "bg-gray-700 text-gray-300",
  mismatch: "bg-orange-900 text-orange-200",
};

export default function Badge({ color, children }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${COLORS[color] || "bg-gray-700 text-gray-300"}`}>
      {children}
    </span>
  );
}