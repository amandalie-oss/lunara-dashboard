import { useMemo } from "react";
import Badge from "./Badge";
import { ALL_TXN } from "../data/transactions";

export default function VelocityPanel({ onSelect }) {
  const flagged = useMemo(() => {
    const cardMap = {};
    ALL_TXN.forEach(t => {
      if (!cardMap[t.cardBin]) cardMap[t.cardBin] = [];
      cardMap[t.cardBin].push(t);
    });
    return Object.entries(cardMap)
      .map(([bin, txns]) => {
        const sorted = [...txns].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        let maxVelocity = 0;
        sorted.forEach((t, i) => {
          const window = sorted.filter(u => Math.abs(new Date(u.timestamp) - new Date(t.timestamp)) < 10 * 60000);
          if (window.length > maxVelocity) maxVelocity = window.length;
        });
        return { bin, count: txns.length, velocity: maxVelocity, txns };
      })
      .filter(b => b.velocity >= 3)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 10);
  }, []);

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-white font-semibold mb-4">
        Velocity Detector
        <span className="text-xs text-gray-400 font-normal ml-2">(max uses in 10-min window)</span>
      </h2>
      <div className="flex flex-col gap-3">
        {flagged.map(({ bin, count, velocity, txns }) => (
          <div
            key={bin}
            onClick={() => onSelect(txns[0])}
            className="bg-gray-800 rounded-lg p-4 cursor-pointer border border-gray-700 hover:border-red-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-mono font-semibold">BIN: {bin}</span>
              <div className="flex gap-2">
                <Badge color={velocity >= 6 ? "high" : "medium"}>{velocity} in 10min</Badge>
                <Badge color="low">{count} total</Badge>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {txns.slice(0, 8).map(t => (
                <span key={t.id} className={`text-xs px-1.5 py-0.5 rounded font-mono ${t.status === "approved" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                  ${t.amount}
                </span>
              ))}
              {txns.length > 8 && <span className="text-xs text-gray-500">+{txns.length - 8} more</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}