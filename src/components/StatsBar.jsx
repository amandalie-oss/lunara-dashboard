import { useMemo } from "react";
import { ALL_TXN } from "../data/transactions";

export default function StatsBar() {
  const stats = useMemo(() => {
    const total = ALL_TXN.length;
    const approved = ALL_TXN.filter(t => t.status === "approved").length;
    const geo = ALL_TXN.filter(t => t.geoMismatch).length;
    const vel = ALL_TXN.filter(t => t.velocityFlag).length;
    const test = ALL_TXN.filter(t => t.cardTestFlag).length;
    return { total, geo, vel, test, approvalRate: Math.round((approved / total) * 100) };
  }, []);

  const cards = [
    { label: "Total Transactions", value: stats.total, color: "text-white" },
    { label: "Approval Rate", value: `${stats.approvalRate}%`, color: "text-green-400" },
    { label: "Geo Mismatches", value: stats.geo, color: "text-orange-400" },
    { label: "Velocity Flags", value: stats.vel, color: "text-red-400" },
    { label: "Card Test Flags", value: stats.test, color: "text-red-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-gray-400 text-xs uppercase mb-1">{c.label}</div>
          <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}