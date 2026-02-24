import { useState } from "react";
import { STATUSES } from "./data/transactions";
import StatsBar from "./components/StatsBar";
import Timeline from "./components/Timeline";
import GeoTable from "./components/GeoTable";
import VelocityPanel from "./components/VelocityPanel";
import BinChart from "./components/BinChart";
import Drawer from "./components/Drawer";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "geo", label: "Geo Inspector" },
  { id: "velocity", label: "Velocity & BINs" },
];

export default function App() {
  const [filters, setFilters] = useState({ status: "all" });
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🛡️ Lunara Travel — Fraud Monitor</h1>
          <p className="text-gray-400 text-xs mt-0.5">Real-time transaction anomaly detection</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-sm">Live</span>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto">
        <StatsBar />

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-gray-400 text-sm">Filter:</span>
          {["all", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilters(f => ({ ...f, status: s }))}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.status === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-800">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            <Timeline filters={filters} />
            <GeoTable filters={filters} onSelect={setSelected} />
          </div>
        )}
        {tab === "geo" && (
          <GeoTable filters={filters} onSelect={setSelected} />
        )}
        {tab === "velocity" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VelocityPanel onSelect={setSelected} />
            <BinChart onSelect={setSelected} />
          </div>
        )}
      </div>

      <Drawer txn={selected} onClose={() => setSelected(null)} />
    </div>
  );
}