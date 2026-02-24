// src/data/transactions.js
export const STATUSES = ["approved", "declined", "pending", "refunded"];
export const CURRENCIES = ["USD", "BRL", "MXN", "THB", "EUR"];
export const COUNTRIES = ["BR", "US", "MX", "TH", "DE", "CO", "AR", "RU", "CN", "NG"];
export const DESTINATIONS = ["Bangkok", "Bogotá", "São Paulo", "Mexico City", "Berlin", "Miami", "Buenos Aires", "Cancún", "Phuket", "New York"];
export const HIGH_RISK_BINS = ["492182", "455301", "601100"];
export const STATUS_COLOR = { approved: "#22c55e", declined: "#ef4444", pending: "#f59e0b", refunded: "#8b5cf6" };

function rnd(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let idCounter = 1;
function tx(overrides) {
  const cardCountry = pick(COUNTRIES);
  const ipCountry = pick(COUNTRIES);
  return {
    id: `TXN-${String(idCounter++).padStart(4, "0")}`,
    timestamp: new Date(Date.now() - rnd(0, 23) * 3600000 - rnd(0, 59) * 60000).toISOString(),
    amount: parseFloat(rnd(20, 800).toFixed(2)),
    currency: pick(CURRENCIES),
    status: pick(["approved","approved","approved","approved","declined","declined","pending","refunded"]),
    cardBin: `4${Math.floor(rnd(10000, 99999))}`,
    cardCountry,
    ipCountry,
    bookingDestination: pick(DESTINATIONS),
    customerId: `C${Math.floor(rnd(1000, 9999))}`,
    accountAgeDays: Math.floor(rnd(1, 730)),
    geoMismatch: false,
    velocityFlag: false,
    cardTestFlag: false,
    ...overrides,
  };
}

// Normal transactions
const normal = Array.from({ length: 380 }, () => {
  const c = pick(COUNTRIES);
  return tx({ cardCountry: c, ipCountry: c, geoMismatch: false });
});

// Velocity attack: same card, 10 txns in ~5 min, different accounts
const velBase = Date.now() - 3 * 3600000;
const velocity = Array.from({ length: 10 }, (_, i) => ({
  ...tx({ cardBin: "453901", status: i < 8 ? "approved" : "declined" }),
  timestamp: new Date(velBase + i * 30000).toISOString(),
  amount: parseFloat(rnd(200, 600).toFixed(2)),
  customerId: `C${8000 + i}`,
  velocityFlag: true,
  geoMismatch: false,
}));

// Card testing sequence
const testBase = Date.now() - 6 * 3600000;
const cardTesting = [0.5, 1, 2, 5, 25, 350, 620].map((amount, i) => ({
  ...tx({ cardBin: "492182", cardCountry: "NG", ipCountry: "RU", status: i < 4 ? "approved" : i === 4 ? "declined" : "approved" }),
  timestamp: new Date(testBase + i * 120000).toISOString(),
  amount,
  customerId: "C9001",
  cardTestFlag: true,
  geoMismatch: true,
}));

// Geographic mismatches
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

export const ALL_TXN = [...normal, ...velocity, ...cardTesting, ...geoMismatches, ...highRiskBin]
  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

export function riskLevel(t) {
  if (t.velocityFlag || t.cardTestFlag) return "high";
  if (t.geoMismatch || HIGH_RISK_BINS.includes(t.cardBin)) return "medium";
  return "low";
}

export function fmt(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function fmtFull(iso) {
  return new Date(iso).toLocaleString();}