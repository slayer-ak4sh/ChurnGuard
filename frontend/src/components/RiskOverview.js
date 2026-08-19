import React, { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { fetchDashboardStats, fetchScores } from "../api";

const RISK_COLOR = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };

export default function RiskOverview({ setPage }) {
  const [stats, setStats] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true); setError("");
    Promise.all([fetchDashboardStats(), fetchScores()])
      .then(([s, sc]) => { setStats(s); setScores(sc); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
      <span className="spinner" />Loading risk overview...
    </div>
  );

  if (error) return (
    <div className="risk-wrap">
      <div className="error-box">❌ {error}</div>
      <button className="btn-primary" style={{ marginTop: 12, width: "auto", padding: "10px 24px" }} onClick={load}>Retry</button>
    </div>
  );

  const riskPieData = [
    { name: "High Risk", value: stats.highRisk || 0, color: RISK_COLOR.HIGH },
    { name: "Medium Risk", value: stats.mediumRisk || 0, color: RISK_COLOR.MEDIUM },
    { name: "Low Risk", value: stats.lowRisk || 0, color: RISK_COLOR.LOW },
  ].filter((d) => d.value > 0);

  const buckets = { "0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0 };
  scores.forEach(({ churnProbability: p }) => {
    const pct = (p || 0) * 100;
    if (pct < 20) buckets["0-20%"]++;
    else if (pct < 40) buckets["20-40%"]++;
    else if (pct < 60) buckets["40-60%"]++;
    else if (pct < 80) buckets["60-80%"]++;
    else buckets["80-100%"]++;
  });
  const barData = Object.entries(buckets).map(([range, count]) => ({ range, count }));
  const isEmpty = stats.totalCustomers === 0;

  return (
    <div className="risk-wrap">
      <div className="page-title" style={{ marginBottom: 4 }}>Risk Overview</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Churn risk distribution across all scored accounts
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Customers</div>
          <div className="stat-card-value">{stats.totalCustomers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">High Risk</div>
          <div className="stat-card-value danger">{stats.highRisk}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Medium Risk</div>
          <div className="stat-card-value warn">{stats.mediumRisk}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Avg Churn Probability</div>
          <div className="stat-card-value">{stats.avgChurnProbability}%</div>
        </div>
      </div>

      {isEmpty ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No data yet</div>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
            Analyze customers in the Predict & Retain tab to see risk charts here.
          </div>
          <button className="btn-primary" style={{ width: "auto", padding: "10px 24px", margin: "0 auto" }}
            onClick={() => setPage("predict")}>
            Go to Predict & Retain
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
              Churn Probability Distribution
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" />
                <XAxis dataKey="range" tick={{ fill: "#6b7a8d", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7a8d", fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e9ef", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#00c9a7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
              Risk Level Breakdown
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {riskPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e9ef", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 13, color: "#6b7a8d" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Recent Churn Scores
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="c360-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Churn Probability</th>
                    <th>Risk Level</th>
                    <th>Prediction</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.slice(0, 15).map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{s.customerId}</td>
                      <td style={{ fontWeight: 700, color: RISK_COLOR[s.riskLevel] }}>
                        {((s.churnProbability || 0) * 100).toFixed(1)}%
                      </td>
                      <td>
                        <div className="churn-risk-cell">
                          <div className={`risk-dot ${s.riskLevel}`} />
                          <span className={`risk-label-pill ${s.riskLevel}`}>{s.riskLevel}</span>
                        </div>
                      </td>
                      <td style={{ color: s.churnPrediction ? RISK_COLOR.HIGH : RISK_COLOR.LOW, fontWeight: 500 }}>
                        {s.churnPrediction ? "⚠️ Will Churn" : "✅ Will Stay"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
