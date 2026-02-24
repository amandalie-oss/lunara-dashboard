import { useMemo, useState } from "react";
import Badge from "./Badge";
import { ALL_TXN, riskLevel, fmt } from "../data/transactions";

export default function GeoTable({ filters, onSelect }) {
  const [mismatchOnly, setMismatchOnly] = useState(false);

  const rows = useMemo(() => ALL_TXN
    .filter(t => {
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (mismatchOnly && !t.geoMismatch) return false;
      return true;
    })
    .slice(-100)
    .reverse(),
  [filters, mismatchOnly]);

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Geographic Risk Inspector</h2>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={mismatchOnly} onChange={e => setMismatchOnly(e.target.checked)} className="accent-orange-400" />
          Mismatches only
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
              {["ID","Time","Amount","Card","IP","Destination","Status","Risk"].map(h => (
                <th key={h} className="text-left py-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(t => {
              const risk = riskLevel(t);
              return (
                <tr
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className={`border-b border-gray-800 cursor-pointer hover:bg-gray-800/60 transition-colors ${t.geoMismatch ? "bg-orange-950/20" : ""}`}
                >
                  <td className="py-2 pr-4 text-blue-400 font-mono">{t.id}</td>
                  <td className="py-2 pr-4 text-gray-400">{fmt(t.timestamp)}</td>
                  <td className="py-2 pr-4 text-white">{t.currency} {t.amount}</td>
                  <td className={`py-2 pr-4 font-semibold ${t.geoMismatch ? "text-orange-400" : "text-gray-300"}`}>{t.cardCountry}</td>
                  <td className={`py-2 pr-4 font-semibold ${t.geoMismatch ? "text-orange-400" : "text-gray-300"}`}>{t.ipCountry}</td>
                  <td className="py-2 pr-4 text-gray-300">{t.bookingDestination}</td>
                  <td className="py-2 pr-4"><Badge color={t.status}>{t.status}</Badge></td>
                  <td className="py-2"><Badge color={risk}>{risk}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}