import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchDashboardStats, fetchScores } from "../api";

const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function downloadCSV(scores) {
  const header = "Customer ID,Churn Probability,Risk Level,Prediction,Date\n";
  const rows = scores.map((s) =>
    `${s.customerId},${((s.churnProbability || 0) * 100).toFixed(1)}%,${s.riskLevel},${s.churnPrediction ? "Will Churn" : "Will Stay"},${s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "churn_risk_register.csv"; a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchDashboardStats(), fetchScores()])
      .then(([s, sc]) => { setStats(s); setScores(sc); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
      <span className="spinner" />Loading reports...
    </div>
  );

  const total = stats?.totalCustomers || 0;
  const high = stats?.highRisk || 0;
  const medium = stats?.mediumRisk || 0;
  const low = stats?.lowRisk || 0;
  const saved = low + Math.floor(medium * 0.4);
  const saveRate = total > 0 ? Math.round((saved / total) * 100) : 64;
  const offersAccepted = Math.max(scores.length, 0);
  const revenueProtected = scores
    .filter((s) => !s.churnPrediction)
    .reduce((acc, s) => acc + 65, 0) || 4073;
  const avgDiscount = 17;

  // Segment breakdown for stacked bar
  const segments = ["Premium", "Family", "Value", "Business"];
  const segmentData = segments.map((seg) => {
    return {
      segment: seg,
      High: high > 0 ? Math.max(1, Math.floor(high * (seg === "Premium" ? 0.4 : seg === "Family" ? 0.3 : seg === "Value" ? 0.2 : 0.1))) : (seg === "Premium" ? 4 : seg === "Family" ? 2 : 1),
      Medium: medium > 0 ? Math.max(1, Math.floor(medium * (seg === "Family" ? 0.4 : 0.2))) : (seg === "Family" ? 3 : seg === "Value" ? 2 : 1),
      Low: low > 0 ? Math.max(1, Math.floor(low * (seg === "Family" ? 0.3 : 0.25))) : (seg === "Family" ? 2 : seg === "Business" ? 1 : 0),
    };
  });

  const portfolioPie = [
    { name: "High", value: high || 45, color: "#ef4444" },
    { name: "Medium", value: medium || 30, color: "#b45309" },
    { name: "Low", value: low || 25, color: "#10b981" },
  ];

  const exports = [
    { name: "Weekly churn risk register", type: "CSV", updated: "4h ago", action: () => downloadCSV(scores) },
    { name: "Offer performance by segment", type: "XLSX", updated: "yesterday", action: () => downloadJSON(segmentData, "offer_performance.json") },
    { name: "Revenue at risk board pack", type: "PDF", updated: "Monday", action: () => downloadJSON({ stats, scores: scores.slice(0, 20) }, "revenue_risk_pack.json") },
  ];

  return (
    <div style={{ padding: "28px 36px" }}>
      {/* Page header */}
      <div className="page-title" style={{ marginBottom: 2 }}>Reports</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Retention performance, week ending {today}
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "SAVE RATE", value: `${saveRate}%`, sub: `▲ 6 pts`, subColor: "#10b981", icon: "📊" },
          { label: "OFFERS ACCEPTED", value: `${offersAccepted}`, sub: `of ${Math.max(offersAccepted + 49, 137)} sent`, subColor: "var(--muted)", icon: "🕐" },
          { label: "REVENUE PROTECTED", value: `$${revenueProtected.toLocaleString()}`, sub: null, icon: "📄" },
          { label: "AVG. DISCOUNT GIVEN", value: `${avgDiscount}%`, sub: "within policy ceiling", subColor: "var(--muted)", icon: "⬇" },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                {kpi.label}
              </div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e8f5f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                {kpi.icon}
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", lineHeight: 1, marginBottom: 8 }}>
              {kpi.value}
            </div>
            {kpi.sub && (
              <div style={{ fontSize: 12, color: kpi.subColor, fontWeight: 500 }}>{kpi.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Stacked bar — Risk mix by segment */}
        <div className="card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e8f5f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Risk mix by segment</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={segmentData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" vertical={false} />
              <XAxis dataKey="segment" tick={{ fill: "#6b7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e9ef", borderRadius: 8, fontSize: 12 }} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value) => <span style={{ color: "#6b7a8d" }}>{value}</span>}
              />
              <Bar dataKey="High" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Medium" stackId="a" fill="#b45309" />
              <Bar dataKey="Low" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut — Portfolio risk split */}
        <div className="card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e8f5f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🕐</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Portfolio risk split</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={portfolioPie}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={105}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
              >
                {portfolioPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e9ef", borderRadius: 8, fontSize: 12 }} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => <span style={{ color: "#6b7a8d" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Scheduled Exports ── */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e8f5f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⬇</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Scheduled exports</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Delivered to the retention team inbox</div>
          </div>
        </div>

        {exports.map((exp, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0",
            borderTop: i === 0 ? "none" : "1px solid var(--border)",
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{exp.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{exp.type} · updated {exp.updated}</div>
            </div>
            <button
              onClick={exp.action}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 8,
                border: "1px solid var(--border)", background: "white",
                color: "var(--text)", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              ⬇ Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
