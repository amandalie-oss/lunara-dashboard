import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ALL_TXN } from "../data/transactions";

export default function Timeline({ filters }) {
  const hourly = useMemo(() => {
    const buckets = {};
    ALL_TXN.forEach(t => {
      if (filters.status !== "all" && t.status !== filters.status) return;
      const h = new Date(t.timestamp).getHours();
      if (!buckets[h]) buckets[h] = { hour: `${String(h).padStart(2,"0")}:00`, approved: 0, declined: 0, pending: 0, refunded: 0 };
      buckets[h][t.status]++;
    });
    return Array.from({ length: 24 }, (_, i) =>
      buckets[i] || { hour: `${String(i).padStart(2,"0")}:00`, approved: 0, declined: 0, pending: 0, refunded: 0 }
    );
  }, [filters]);

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-white font-semibold mb-4">Transaction Volume (24h)</h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={hourly}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="hour" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
          <Legend />
          <Area type="monotone" dataKey="approved" stackId="1" stroke="#22c55e" fill="#22c55e33" />
          <Area type="monotone" dataKey="declined" stackId="1" stroke="#ef4444" fill="#ef444433" />
          <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b33" />
          <Area type="monotone" dataKey="refunded" stackId="1" stroke="#8b5cf6" fill="#8b5cf633" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}