import Badge from "./Badge";
import { ALL_TXN, riskLevel, fmtFull } from "../data/transactions";

export default function Drawer({ txn, onClose }) {
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
            <div className="text-gray-400 text-xs font-semibold uppercase mb-2">
              Other transactions — BIN {txn.cardBin}
            </div>
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