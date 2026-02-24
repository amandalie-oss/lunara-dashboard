import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const STATUSES = ["approved", "declined", "pending", "refunded"];
const CURRENCIES = ["USD", "BRL", "MXN", "THB", "EUR"];
const COUNTRIES = ["BR", "US", "MX", "TH", "DE", "CO", "AR", "RU", "CN", "NG"];
const DESTINATIONS = ["Bangkok", "Bogotá", "São Paulo", "Mexico City", "Berlin", "Miami", "Buenos Aires", "Cancún", "Phuket", "New York"];
const HIGH_RISK_BINS = ["492182", "455301", "601100"];

function rnd(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function ts(hoursAgo, minOffset = 0) {
  return new Date(Date.now() - hoursAgo * 3600000 - minOffset * 60000).toISOString();
}

let idCounter = 1;
function tx(overrides) {
  const cardCountry = pick(COUNTRIES);
  const ipCountry = pick(COUNTRIES);
  const dest = pick(DESTINATIONS);
  return {
    id: `TXN-${String(idCounter++).padStart(4, "0")}`,
    timestamp: ts(rnd(0, 23), rnd(0, 59)),
    amount: parseFloat(rnd(20, 800).toFixed(2)),
    currency: pick(CURRENCIES),
    status: pick(["approved","approved","approved","approved","declined","declined","pending","refunded"]),
    cardBin: `4${Math.floor(rnd(10000,99999))}`,
    cardCountry,
    ipCountry,
    bookingDestination: dest,
    customerId: `C${Math.floor(rnd(1000,9999))}`,
    accountAgeDays: Math.floor(rnd(1, 730)),
    geoMismatch: cardCountry !== ipCountry,
    ...overrides,
  };
}

// Normal transactions
const normal = Array.from({ length: 380 }, () => tx({ geoMismatch: false, ipCountry: undefined, cardCountry: undefined })).map(t => {
  const c = pick(COUNTRIES);
  return { ...t, cardCountry: c, ipCountry: c, geoMismatch: false };
});

// Velocity attack: same card, 10 txns in 5 min, different accounts
const velCard = "453901";
const velBase = Date.now() - 3 * 3600000;
const velocity = Array.from({ length: 10 }, (_, i) => ({
  ...tx({ cardBin: velCard, status: i < 8 ? "approved" : "declined" }),
  timestamp: new Date(velBase + i * 30000).toISOString(),
  amount: parseFloat(rnd(200, 600).toFixed(2)),
  customerId: `C${8000 + i}`,
  velocityFlag: true,
}));

// Card testing sequence
const testCard = "492182";
const testBase = Date.now() - 6 * 3600000;
const cardTesting = [0.5, 1, 2, 5, 25, 350, 620].map((amount, i) => ({
  ...tx({ cardBin: testCard, cardCountry: "NG", ipCountry: "RU", status: i < 4 ? "approved" : i === 4 ? "declined" : "approved" }),
  timestamp: new Date(testBase + i * 120000).toISOString(),
  amount,
  customerId: "C9001",
  cardTestFlag: true,
  geoMismatch: true,
}));

// Geo mismatches
const geoMismatches = [
  tx({ cardCountry: "DE", ipCountry: "RU", bookingDestination: "Bogotá", geoMismatch: true, status: "approved" }),
  tx({ cardCountry: "US", ipCountry: "CN", bookingDestination: "Bangkok", geoMismatch: true, status: "approved" }),
  tx({ cardCountry: "BR", ipCountry: "NG", bookingDestination: "Berlin", geoMismatch: true, status: "declined" }),
  tx({ cardCountry: "DE", ipCountry: "CN", bookingDestination: "Mexico City", geoMismatch: true }),
  tx({ cardCountry: "US", ipCountry: "RU", bookingDestination: "Bogotá", geoMismatch: true }),
  tx({ cardCountry: "MX", ipCountry: "NG", bookingDestination: "Bangkok", geoMismatch: true }),
  tx({ cardCountry: "AR", ipCountry: "CN", bookingDestination: "Miami", geoMismatch: true }),
];

// High-risk BINs
const highRiskBin = Array.from({ length: 18 }, () =>
  tx({ cardBin: pick(HIGH_RISK_BINS), status: pick(["declined","declined","declined","approved","refunded"]) })
);

const ALL_TXN = [...normal, ...velocity, ...cardTesting, ...geoMismatches, ...highRiskBin]
  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

// ── HELPERS ─────────────────────────────────────────────────────────────────
const STATUS_COLOR = { approved: "#22c55e", declined: "#ef4444", pending: "#f59e0b", refunded: "#8b5cf6" };
const RISK_BG = { high: "bg-red-900/60 border-red-500", medium: "bg-yellow-900/40 border-yellow-500", low: "bg-gray-800 border-gray-700" };

function riskLevel(t) {
  if (t.velocityFlag || t.cardTestFlag) return "high";
  if (t.geoMismatch || HIGH_RISK_BINS.includes(t.cardBin)) return "medium";
  return "low";
}

function fmt(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function fmtFull(iso) {
  return new Date(iso).toLocaleString();
}

// ── COMPONENTS ───────────────────────────────────────────────────────────────
function Badge({ color, children }) {
  const colors = {
    approved: "bg-green-900 text-green-300",
    declined: "bg-red-900 text-red-300",
    pending: "bg-yellow-900 text-yellow-300",
    refunded: "bg-purple-900 text-purple-300",
    high: "bg-red-800 text-red-200",
    medium: "bg-yellow-800 text-yellow-200",
    low: "bg-gray-700 text-gray-300",
    mismatch: "bg-orange-900 text-orange-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[color] || "bg-gray-700 text-gray-300"}`}>{children}</span>;
}

function Drawer({ txn, onClose }) {
  if (!txn) return null;
  const risk = riskLevel(txn);
  const sameCard = ALL_TXN.filter(t => t.cardBin === txn.cardBin && t.id !== txn.id).slice(0, 8);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-700 h-full overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{txn.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge color={txn.status}>{txn.status.toUpperCase()}</Badge>
          <Badge color={risk}>Risk: {risk.toUpperCase()}</Badge>
          {txn.geoMismatch && <Badge color="mismatch">GEO MISMATCH</Badge>}
          {txn.velocityFlag && <Badge color="high">VELOCITY ATTACK</Badge>}
          {txn.cardTestFlag && <Badge color="high">CARD TESTING</Badge>}
        </div>
        <div className="bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
          {[
            ["Amount", `${txn.currency} ${txn.amount}`],
            ["Time", fmtFull(txn.timestamp)],
            ["Customer", txn.customerId],
            ["Account Age", `${txn.accountAgeDays} days`],
            ["Card BIN", txn.cardBin],
            ["Card Country", txn.cardCountry],
            ["IP Country", txn.ipCountry],
            ["Destination", txn.bookingDestination],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-gray-400 text-xs">{k}</div>
              <div className={`text-white font-medium ${k === "Card Country" && txn.geoMismatch ? "text-orange-400" : ""}`}>{v}</div>
            </div>
          ))}
        </div>
        {sameCard.length > 0 && (
          <div>
            <div className="text-gray-400 text-xs font-semibold uppercase mb-2">Other transactions with BIN {txn.cardBin}</div>
            <div className="flex flex-col gap-2">
              {sameCard.map(t => (
                <div key={t.id} className="bg-gray-800 rounded p-3 flex justify-between text-sm">
                  <span className="text-gray-300">{t.id} · {t.customerId}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-white">${t.amount}</span>
                    <Badge color={t.status}>{t.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TIMELINE ─────────────────────────────────────────────────────────────────
function Timeline({ filters, onSelect }) {
  const hourly = useMemo(() => {
    const buckets = {};
    ALL_TXN.forEach(t => {
      if (filters.status !== "all" && t.status !== filters.status) return;
      const h = new Date(t.timestamp).getHours();
      if (!buckets[h]) buckets[h] = { hour: `${String(h).padStart(2,"0")}:00`, approved: 0, declined: 0, pending: 0, refunded: 0, total: 0 };
      buckets[h][t.status]++;
      buckets[h].total++;
    });
    return Array.from({ length: 24 }, (_, i) => buckets[i] || { hour: `${String(i).padStart(2,"0")}:00`, approved: 0, declined: 0, pending: 0, refunded: 0, total: 0 });
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

// ── BIN CHART ────────────────────────────────────────────────────────────────
function BinChart({ onSelect }) {
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
          <Bar dataKey="declineRate" radius={[0, 4, 4, 0]} onClick={(d) => onSelect && onSelect(ALL_TXN.find(t => t.cardBin === d.bin))}>
            {binData.map((entry, i) => (
              <Cell key={i} fill={entry.declineRate > 40 ? "#ef4444" : entry.declineRate > 20 ? "#f59e0b" : "#22c55e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── GEO TABLE ────────────────────────────────────────────────────────────────
function GeoTable({ filters, onSelect }) {
  const [showMismatchOnly, setShowMismatchOnly] = useState(false);
  const rows = useMemo(() => {
    return ALL_TXN
      .filter(t => {
        if (filters.status !== "all" && t.status !== filters.status) return false;
        if (showMismatchOnly && !t.geoMismatch) return false;
        return true;
      })
      .slice(-100)
      .reverse();
  }, [filters, showMismatchOnly]);

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Geographic Risk Inspector</h2>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={showMismatchOnly} onChange={e => setShowMismatchOnly(e.target.checked)} className="accent-orange-400" />
          Mismatches only
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
              <th className="text-left py-2 pr-4">ID</th>
              <th className="text-left py-2 pr-4">Time</th>
              <th className="text-left py-2 pr-4">Amount</th>
              <th className="text-left py-2 pr-4">Card</th>
              <th className="text-left py-2 pr-4">IP</th>
              <th className="text-left py-2 pr-4">Destination</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2">Risk</th>
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

// ── VELOCITY ─────────────────────────────────────────────────────────────────
function VelocityPanel({ onSelect }) {
  const flagged = useMemo(() => {
    const cardMap = {};
    ALL_TXN.forEach(t => {
      if (!cardMap[t.cardBin]) cardMap[t.cardBin] = [];
      cardMap[t.cardBin].push(t);
    });
    return Object.entries(cardMap)
      .map(([bin, txns]) => {
        const sorted = txns.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        let maxVelocity = 0;
        for (let i = 0; i < sorted.length; i++) {
          const window = sorted.filter(t => Math.abs(new Date(t.timestamp) - new Date(sorted[i].timestamp)) < 10 * 60000);
          if (window.length > maxVelocity) maxVelocity = window.length;
        }
        return { bin, count: txns.length, velocity: maxVelocity, txns };
      })
      .filter(b => b.velocity >= 3)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 10);
  }, []);

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-white font-semibold mb-4">Velocity Detector <span className="text-xs text-gray-400 font-normal ml-2">(max uses in 10-min window)</span></h2>
      <div className="flex flex-col gap-3">
        {flagged.map(({ bin, count, velocity, txns }) => (
          <div key={bin} onClick={() => onSelect(txns[0])} className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 border border-gray-700 hover:border-red-500 transition-colors">
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

// ── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = useMemo(() => {
    const total = ALL_TXN.length;
    const approved = ALL_TXN.filter(t => t.status === "approved").length;
    const geo = ALL_TXN.filter(t => t.geoMismatch).length;
    const vel = ALL_TXN.filter(t => t.velocityFlag).length;
    const test = ALL_TXN.filter(t => t.cardTestFlag).length;
    return { total, approved, geo, vel, test, approvalRate: Math.round((approved / total) * 100) };
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

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [filters, setFilters] = useState({ status: "all" });
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">🛡️ Lunara Travel — Fraud Monitor</h1>
          <p className="text-gray-400 text-xs mt-0.5">Real-time transaction anomaly detection</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-green-400 text-sm">Live</span>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Stats */}
        <StatsBar />

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-gray-400 text-sm self-center">Filter:</span>
          {["all", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilters(f => ({ ...f, status: s }))}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filters.status === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-800">
          {[
            { id: "overview", label: "Overview" },
            { id: "geo", label: "Geo Inspector" },
            { id: "velocity", label: "Velocity & BINs" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            <Timeline filters={filters} onSelect={setSelected} />
            <GeoTable filters={filters} onSelect={setSelected} />
          </div>
        )}
        {tab === "geo" && (
          <GeoTable filters={{ ...filters, forceShow: true }} onSelect={setSelected} />
        )}
        {tab === "velocity" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VelocityPanel onSelect={setSelected} />
            <BinChart onSelect={setSelected} />
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer txn={selected} onClose={() => setSelected(null)} />
    </div>
  );
}