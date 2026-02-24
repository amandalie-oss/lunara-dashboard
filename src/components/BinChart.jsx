import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ALL_TXN } from "../data/transactions";

export default function BinChart({ onSelect }) {
  const binData = useMemo(() => {
    const map = {};
    ALL_TXN.forEach(t => {
      if (!map[t.cardBin]) map[t.cardBin] = { bin: t.cardBin, total: 0, declined: 0 };
      map[t.cardBin].total++;
      if (t.status === "declined") map[t.cardBin].declined++;
    });
    return Object.values(map)
      .map(b => ({ ...b, declineRate: Math.round((b.declined / b.total) * 100) }))
      .sort((a, b) => b.declineRate - a.declineRate)
      .slice(0, 10);
  }, []);

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-white font-semibold mb-4">Top BINs by Decline Rate</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={binData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} unit="%" />
          <YAxis dataKey="bin" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={70} />
          <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
          <Bar dataKey="declineRate" radius={[0, 4, 4, 0]} onClick={d => onSelect && onSelect(ALL_TXN.find(t => t.cardBin === d.bin))}>
            {binData.map((entry, i) => (
              <Cell key={i} fill={entry.declineRate > 40 ? "#ef4444" : entry.declineRate > 20 ? "#f59e0b" : "#22c55e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}