import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { analyzeCustomer } from "../api";

const INITIAL = {
  customerName: "", city: "",
  gender: 0, SeniorCitizen: 0, Partner: 0, Dependents: 0,
  tenure: 12, PhoneService: 1, PaperlessBilling: 0,
  MonthlyCharges: 65,
  MultipleLines: "No", InternetService: "DSL",
  OnlineSecurity: "No", OnlineBackup: "No",
  DeviceProtection: "No", TechSupport: "No",
  StreamingTV: "No", StreamingMovies: "No",
  Contract: "Month-to-month", PaymentMethod: "Electronic check",
};

const RISK_COLOR = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };

function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function PredictPage() {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { setError("Customer name is required"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      // Generate a stable customerId from name
      const customerId = `TC-${slugify(form.customerName)}-${Date.now().toString().slice(-4)}`;
      const payload = { ...form, customerId, customerName: form.customerName, city: form.city };
      const data = await analyzeCustomer(payload);
      setResult({ ...data, customerName: form.customerName });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const prob = result ? (result.churn_probability * 100).toFixed(1) : 0;
  const risk = result?.risk_level || "LOW";

  return (
    <div className="predict-wrap">
      <div className="page-title" style={{ marginBottom: 4 }}>Predict & Retain</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Enter customer details to predict churn risk and get AI retention recommendations
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
          Customer Profile
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                placeholder="e.g. Rahul Verma"
                required
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Delhi"
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", +e.target.value)}>
                <option value={0}>Male</option>
                <option value={1}>Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Contract Type</label>
              <select value={form.Contract} onChange={(e) => set("Contract", e.target.value)}>
                <option>Month-to-month</option>
                <option>One year</option>
                <option>Two year</option>
              </select>
            </div>
            <div className="form-group">
              <label>Internet Service</label>
              <select value={form.InternetService} onChange={(e) => set("InternetService", e.target.value)}>
                <option>DSL</option>
                <option>Fiber optic</option>
                <option>No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={form.PaymentMethod} onChange={(e) => set("PaymentMethod", e.target.value)}>
                <option>Electronic check</option>
                <option>Mailed check</option>
                <option>Bank transfer (automatic)</option>
                <option>Credit card (automatic)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Multiple Lines</label>
              <select value={form.MultipleLines} onChange={(e) => set("MultipleLines", e.target.value)}>
                <option>No</option><option>Yes</option><option>No phone service</option>
              </select>
            </div>
            {[["OnlineSecurity","Online Security"],["OnlineBackup","Online Backup"],["DeviceProtection","Device Protection"],["TechSupport","Tech Support"],["StreamingTV","Streaming TV"],["StreamingMovies","Streaming Movies"]].map(([k, label]) => (
              <div className="form-group" key={k}>
                <label>{label}</label>
                <select value={form[k]} onChange={(e) => set(k, e.target.value)}>
                  <option>No</option><option>Yes</option><option>No internet service</option>
                </select>
              </div>
            ))}
            <div className="form-group">
              <label>Monthly Charges ($)</label>
              <input type="number" min="0" step="0.01" value={form.MonthlyCharges}
                onChange={(e) => set("MonthlyCharges", parseFloat(e.target.value) || 0)} required />
            </div>
            <div className="form-group">
              <label>Tenure (Months)</label>
              <input type="number" min="0" max="120" value={form.tenure}
                onChange={(e) => set("tenure", parseInt(e.target.value) || 0)} required />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Additional Info
            </div>
            <div className="checkbox-grid">
              {[["SeniorCitizen","Senior Citizen"],["Partner","Has Partner"],["Dependents","Has Dependents"],["PhoneService","Phone Service"],["PaperlessBilling","Paperless Billing"]].map(([k, label]) => (
                <label className="checkbox-item" key={k}>
                  <input type="checkbox" checked={form[k] === 1} onChange={(e) => set(k, e.target.checked ? 1 : 0)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="error-box">❌ {error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" />Analyzing...</> : "✦ Analyze Churn Risk & Get Recommendations"}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Hero result */}
          <div className="hero-card" style={{ marginBottom: 16 }}>
            <div className="hero-left">
              <div className="segment-tag">PREDICTION RESULT</div>
              <div className="hero-name">{result.customerName}</div>
              <div className="hero-meta">
                <div className="hero-meta-item">
                  <label>Contract</label>
                  <span>{form.Contract}</span>
                </div>
                <div className="hero-meta-item">
                  <label>Tenure</label>
                  <span>{form.tenure} months</span>
                </div>
                <div className="hero-meta-item">
                  <label>Monthly</label>
                  <span>${form.MonthlyCharges}</span>
                </div>
                <div className="hero-meta-item">
                  <label>Est. CLTV</label>
                  <span>${result.estimated_cltv?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="churn-score-label">CHURN RISK SCORE</div>
              <div className={`churn-score-value ${risk}`}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: RISK_COLOR[risk] }} />
                <span className={`churn-score-pct ${risk}`}>{prob}%</span>
                <span className={`churn-score-risk ${risk}`}>{risk}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
                {result.source === "llm" ? "🤖 LangChain + Groq LLM" : "⚙️ Rule-Based Agent"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Churn drivers */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-icon">💡</div>
                <div>
                  <div className="detail-card-title">Why they might churn</div>
                  <div className="detail-card-sub">Top contributing factors</div>
                </div>
              </div>
              <div className="driver-tags">
                {result.churn_drivers?.slice(0, 4).map((d, i) => (
                  <span key={i} className={`driver-tag ${i === 1 ? "orange" : i === 2 ? "yellow" : ""}`}>{d}</span>
                ))}
              </div>
              <div className="driver-insight">
                {result.retention_message}
              </div>
            </div>

            {/* Gauge */}
            <div className="detail-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[{ value: parseFloat(prob) }, { value: 100 - parseFloat(prob) }]}
                    cx="50%" cy="100%" startAngle={180} endAngle={0}
                    innerRadius={55} outerRadius={80} dataKey="value" stroke="none"
                  >
                    <Cell fill={RISK_COLOR[risk]} />
                    <Cell fill="#f0f2f5" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 36, fontWeight: 800, color: RISK_COLOR[risk], marginTop: -50 }}>{prob}%</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ background: risk === "HIGH" ? "#fef2f2" : risk === "MEDIUM" ? "#fffbeb" : "#f0fdf4", color: RISK_COLOR[risk], padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                  {risk} RISK
                </span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="detail-card" style={{ gridColumn: "1 / -1" }}>
              <div className="detail-card-header">
                <div className="detail-card-icon" style={{ background: "#f0fdf4" }}>🎯</div>
                <div>
                  <div className="detail-card-title">AI Retention Recommendations</div>
                  <div className="detail-card-sub">Personalized interventions ranked by impact</div>
                </div>
              </div>
              {result.recommendations?.map((r, i) => (
                <div className="offer-item" key={i}>
                  <div className="offer-header">
                    <span className={`offer-priority ${r.priority}`}>{r.priority}</span>
                    <span className="offer-category">{r.category}</span>
                  </div>
                  <div className="offer-action">{r.action}</div>
                  <div className="offer-desc">{r.description}</div>
                  <div className="offer-impact">📈 {r.expected_impact}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
