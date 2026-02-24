
# 🛡️ Lunara Travel — Fraud Monitoring Dashboard

An interactive, real-time fraud investigation dashboard built for Lunara Travel's fraud analyst team. Detects and visualizes transaction anomalies including velocity attacks, card testing sequences, geographic mismatches, and high-risk BIN clusters.

## 🚀 Setup & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Tech Stack

- **React + Vite** — fast dev/build tooling
- **Recharts** — transaction timeline and BIN charts
- **Tailwind CSS** — utility-first styling
- **date-fns** — timestamp manipulation

## 📁 Project Structure

```
src/
  data/
    transactions.js       # Generated mock dataset (415+ transactions)
  components/
    Timeline.jsx          # Area chart — transaction volume over 24h
    GeoTable.jsx          # Geographic risk inspector with mismatch highlighting
    VelocityPanel.jsx     # Velocity detector — cards used N times in 10-min windows
    BinChart.jsx          # BIN decline rate bar chart
    StatsBar.jsx          # Top-level KPI summary cards
    Drawer.jsx            # Transaction detail side panel
  App.jsx                 # Root layout, tabs, filters, state
```

## 🔍 Embedded Fraud Patterns & How to Find Them

### 1. Velocity Attack
**What it is:** Same card used 10 times in ~5 minutes across different customer accounts.

**How to find it:**
1. Go to the **Velocity & BINs** tab
2. Look for BIN `453901` — flagged with **10 in 10min** badge in red
3. Click it to open the drawer and see the full transaction history

### 2. Card Testing Sequence
**What it is:** Card `492182` used with escalating amounts ($0.50 → $1 → $2 → $5 → $25 → $350 → $620) to probe card validity before large purchases.

**How to find it:**
1. Go to **Velocity & BINs** tab → BIN chart on the right
2. `492182` appears as a high-risk BIN with >40% decline rate (red bar)
3. Go to **Geo Inspector** tab → filter **Mismatches only**
4. Find the sequence from customer `C9001` — small amounts escalating to large, with NG card + RU IP

### 3. Geographic Mismatches
**What it is:** 7+ transactions where card country, IP country, and booking destination are all different (e.g. German card, Russian IP, booking in Bogotá).

**How to find it:**
1. Go to **Overview** tab or **Geo Inspector** tab
2. Toggle **"Mismatches only"** checkbox
3. Rows highlighted in orange — Card Country and IP Country columns show the mismatch
4. Look for combinations like DE/RU/Bogotá, US/CN/Bangkok, BR/NG/Berlin

### 4. High-Risk BINs
**What it is:** BINs `492182`, `455301`, `601100` have decline rates >40%, indicating compromised card batches.

**How to find it:**
1. Go to **Velocity & BINs** tab
2. BIN chart on the right — red bars indicate >40% decline rate
3. Click any red bar to open the drawer for that BIN's transaction history

## 🎨 Design Decisions

- **Dark theme** — reduces eye strain for analysts monitoring dashboards for hours
- **Tab layout** — separates Overview, Geo Inspector, and Velocity/BINs to avoid information overload
- **Click-to-inspect drawer** — any transaction, BIN, or velocity entry opens a right-side panel with full context and card history, keeping the analyst in flow
- **Color coding** — green/red/yellow/purple for statuses, orange for geo mismatches, red for high-risk, consistent throughout
- **Status filter** — global filter affecting all views so analysts can isolate e.g. only declined transactions

## 🔮 What I'd Add With More Time

1. **Real-time WebSocket feed** — stream live transactions instead of static mock data
2. **World map view** — plot card origin vs IP country vs destination on a map for geographic anomalies
3. **Custom alert rules** — let analysts define thresholds (e.g. "flag cards used >5x in 10 min") with live highlighting
4. **Time range zoom** — brush/zoom on the timeline to drill into specific hour windows
5. **Export / case management** — let analysts flag transactions and export a CSV report
6. **ML anomaly score** — assign each transaction a risk score based on combined signals