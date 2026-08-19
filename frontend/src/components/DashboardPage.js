import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchDashboardStats, fetchScores } from "../api";

const RISK_COLOR = { HIGH: "#ff4d6d", MEDIUM: "#ffb347", LOW: "#00d4aa" };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([fetchDashboardStats(), fetchScores()])
      .then(([s, sc]) => { setStats(s); setScores(sc); })
      .catch((e) => setError(e.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
      <span className="spinner" style={{ width: 24, height: 24 }} />
      <span style={{ marginLeft: 10 }}>Loading dashboard...</span>
    </div>
  );

  if (error) return (
    <div>
      <div className="error-box">❌ {error}</div>
      <button className="btn-primary" style={{ marginTop: 12, width: "auto", padding: "10px 24px" }} onClick={load}>
        Retry
      </button>
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
    <div>
      {/* Stat boxes */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-box">
          <div className="stat-val">{stats.totalCustomers}</div>
          <div className="stat-lbl">Total Customers</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: RISK_COLOR.HIGH }}>{stats.highRisk}</div>
          <div className="stat-lbl">High Risk</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: RISK_COLOR.MEDIUM }}>{stats.mediumRisk}</div>
          <div className="stat-lbl">Medium Risk</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{stats.avgChurnProbability}%</div>
          <div className="stat-lbl">Avg Churn Probability</div>
        </div>
      </div>

      {isEmpty ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No data yet</div>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            Go to the <strong>Predict</strong> tab and analyze some customers to see charts here.
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {/* Bar chart */}
          <div className="card">
            <div className="card-title">Churn Probability Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3250" />
                <XAxis dataKey="range" tick={{ fill: "#8b8fa8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#8b8fa8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1d27", border: "1px solid #2e3250", borderRadius: 8, color: "#e8eaf6" }}
                />
                <Bar dataKey="count" fill="#6c63ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card">
            <div className="card-title">Risk Level Breakdown</div>
            {riskPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%" cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {riskPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1d27", border: "1px solid #2e3250", borderRadius: 8, color: "#e8eaf6" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13, color: "#8b8fa8" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No risk data yet</div>
            )}
          </div>

          {/* Scores table */}
          <div className="card full-width">
            <div className="card-title">Recent Churn Scores</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Churn Probability</th>
                    <th>Risk Level</th>
                    <th>Prediction</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.slice(0, 20).map((s, i) => (
                    <tr key={i}>
                      <td style={{ color: "var(--accent)" }}>{s.customerId}</td>
                      <td>{((s.churnProbability || 0) * 100).toFixed(1)}%</td>
                      <td><span className={`risk-badge risk-${s.riskLevel}`}>{s.riskLevel}</span></td>
                      <td style={{ color: s.churnPrediction ? RISK_COLOR.HIGH : RISK_COLOR.LOW }}>
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
