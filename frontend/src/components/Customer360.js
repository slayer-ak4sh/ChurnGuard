import React, { useState, useEffect, useCallback } from "react";
import { fetchCustomers, fetchCustomer } from "../api";

const RISK_COLOR = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };

function getSegment(c) {
  const m = c.MonthlyCharges || 0;
  if (m > 90) return "Premium";
  if (m > 65) return "Business";
  if (c.Partner || c.Dependents) return "Family";
  return "Value";
}

function getServices(c) {
  const s = [];
  if (c.InternetService === "Fiber optic") s.push("Fiber Internet");
  else if (c.InternetService === "DSL") s.push("DSL Internet");
  if (c.StreamingTV === "Yes") s.push("Streaming TV");
  if (c.StreamingMovies === "Yes") s.push("Streaming Movies");
  if (c.OnlineBackup === "Yes") s.push("Cloud Backup");
  if (c.OnlineSecurity === "Yes") s.push("Online Security");
  if (c.DeviceProtection === "Yes") s.push("Device Protection");
  if (c.TechSupport === "Yes") s.push("Tech Support");
  if (c.PhoneService) s.push("Phone Service");
  return s;
}

function mockSupportHistory(name) {
  const issues = [
    { dot: "red", date: "14 AUG", title: "Speed complaint", desc: "Reported evening throttling below 200 Mbps." },
    { dot: "orange", date: "07 AUG", title: "Technician visit", desc: "Line splitter replaced." },
    { dot: "green", date: "26 JUL", title: "Install delay", desc: "Activation delayed by 5 days." },
  ];
  return issues;
}

// ── Customer Detail ────────────────────────────────────────────────────────────
function CustomerDetail({ customerId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOffers, setShowOffers] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchCustomer(customerId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
      <span className="spinner" />Loading customer profile...
    </div>
  );

  if (!data) return <div className="error-box">Failed to load customer.</div>;

  const c = data.customer || {};
  const score = data.latestScore || {};
  const offers = data.latestOffers || {};
  const prob = score.churnProbability ? (score.churnProbability * 100).toFixed(0) : "—";
  const risk = score.riskLevel || "LOW";
  const segment = getSegment(c);
  const services = getServices(c);
  const support = mockSupportHistory(c.customerName);
  const totalCharges = ((c.MonthlyCharges || 0) * (c.tenure || 1)).toFixed(2);
  const drivers = offers.churnDrivers || [];
  const topDriver = drivers[0] || "multiple risk factors";

  const driverColors = ["", "orange", "yellow", "orange", "", "yellow"];

  return (
    <div className="detail-wrap">
      <button className="back-btn" onClick={onBack}>
        ← Back to Customer 360
      </button>

      {/* Hero Card */}
      <div className="hero-card">
        <div className="hero-left">
          <div className="segment-tag">{segment.toUpperCase()} SEGMENT</div>
          <div className="hero-name">{c.customerName || customerId}</div>
          <div className="hero-meta">
            <div className="hero-meta-item">
              <label>Plan</label>
              <span>{c.InternetService === "Fiber optic" ? "Fiber 1 Gig" : c.InternetService === "DSL" ? "DSL Basic" : "Phone Only"}</span>
            </div>
            <div className="hero-meta-item">
              <label>Tenure</label>
              <span>{c.tenure || 0} months</span>
            </div>
            <div className="hero-meta-item">
              <label>Contract</label>
              <span>{c.Contract || "—"}</span>
            </div>
            <div className="hero-meta-item">
              <label>Location</label>
              <span>{c.city || "India"}</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="churn-score-label">CHURN RISK SCORE</div>
          <div className={`churn-score-value ${risk}`}>
            <div className={`risk-dot ${risk}`} style={{ width: 10, height: 10, borderRadius: "50%", background: RISK_COLOR[risk] }} />
            <span className={`churn-score-pct ${risk}`}>{prob}%</span>
            <span className={`churn-score-risk ${risk}`}>{risk}</span>
          </div>
          <button className="view-offer-btn" onClick={() => setShowOffers((v) => !v)}>
            ✦ {showOffers ? "Hide" : "View"} AI Retention Offer
          </button>
        </div>
      </div>

      {/* Retention Offers Panel */}
      {showOffers && offers.recommendations?.length > 0 && (
        <div className="offers-panel" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div className="detail-card-icon" style={{ background: "#f0fdf4" }}>🎯</div>
            <div>
              <div className="detail-card-title">AI Retention Recommendations</div>
              <div className="detail-card-sub">Personalized offers to prevent churn</div>
            </div>
          </div>
          {offers.recommendations.map((r, i) => (
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
          {offers.retentionMessage && (
            <div style={{ marginTop: 12, padding: "12px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: 13, color: "#065f46", lineHeight: 1.5 }}>
              {offers.retentionMessage}
            </div>
          )}
        </div>
      )}

      {/* Main detail grid */}
      <div className="detail-grid">
        {/* Why they might churn */}
        <div className="detail-card">
          <div className="detail-card-header">
            <div className="detail-card-icon">💡</div>
            <div>
              <div className="detail-card-title">Why they might churn</div>
              <div className="detail-card-sub">Top contributing factors, in plain language</div>
            </div>
          </div>
          <div className="driver-tags">
            {drivers.slice(0, 4).map((d, i) => (
              <span key={i} className={`driver-tag ${driverColors[i] || ""}`}>{d}</span>
            ))}
          </div>
          <div className="driver-insight">
            The strongest single driver is <strong>{topDriver.toLowerCase()}</strong>. Addressing it directly is the most efficient retention lever for this account.
          </div>
        </div>

        {/* Billing summary */}
        <div className="detail-card">
          <div className="detail-card-header">
            <div className="detail-card-icon blue">🧾</div>
            <div>
              <div className="detail-card-title">Billing summary</div>
              <div className="detail-card-sub">Current cycle</div>
            </div>
          </div>
          <div className="billing-item">
            <div className="billing-label">Monthly Charges</div>
            <div className="billing-value">${c.MonthlyCharges?.toFixed(2) || "—"}</div>
            <div className="billing-sub">Lifetime billed ${totalCharges}</div>
          </div>
          <div className="billing-item">
            <div className="billing-label">Payment Method</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 18 }}>💳</span>
              <span className="billing-method">{c.PaymentMethod || "—"}</span>
            </div>
          </div>
          {offers.estimatedCltv && (
            <div className="billing-item">
              <div className="billing-label">Estimated CLTV</div>
              <div className="billing-value" style={{ fontSize: 18 }}>${offers.estimatedCltv?.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>

      <div className="detail-grid">
        {/* Services subscribed */}
        <div className="detail-card">
          <div className="detail-card-header">
            <div className="detail-card-icon orange">📶</div>
            <div>
              <div className="detail-card-title">Services subscribed</div>
              <div className="detail-card-sub">{services.length} active service{services.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
          {services.length > 0 ? services.map((s, i) => (
            <div className="service-item" key={i}>
              <div className="service-dot" />
              {s}
            </div>
          )) : (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>No services found</div>
          )}
        </div>

        {/* Support & complaint history */}
        <div className="detail-card">
          <div className="detail-card-header">
            <div className="detail-card-icon purple">🕐</div>
            <div>
              <div className="detail-card-title">Support & complaint history</div>
              <div className="detail-card-sub">Most recent interactions</div>
            </div>
          </div>
          {support.map((s, i) => (
            <div className="support-item" key={i}>
              <div className={`support-dot ${s.dot}`} />
              <div>
                <div className="support-date">{s.date}</div>
                <div className="support-title">{s.title}</div>
                <div className="support-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Customer 360 List ──────────────────────────────────────────────────────────
export default function Customer360() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [contractFilter, setContractFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchCustomers()
      .then(setCustomers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => {
    const name = (c.customerName || c.customerId || "").toLowerCase();
    const id = (c.customerId || "").toLowerCase();
    const q = search.toLowerCase();
    if (q && !name.includes(q) && !id.includes(q)) return false;
    if (riskFilter !== "all" && c.riskLevel !== riskFilter) return false;
    if (contractFilter !== "all" && c.Contract !== contractFilter) return false;
    return true;
  });

  if (selected) {
    return <CustomerDetail customerId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="c360-wrap">
      <div className="page-header" style={{ padding: 0, marginBottom: 20 }}>
        <div className="page-title">Customer 360</div>
        <div className="page-subtitle">Select an account to open its full profile</div>
      </div>

      <div className="card">
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <div className="c360-icon">👥</div>
          <div>
            <div className="c360-title">All accounts</div>
            <div className="c360-count">{filtered.length} sampled accounts from the scored base</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search customer or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="all">All risk levels</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select className="filter-select" value={contractFilter} onChange={(e) => setContractFilter(e.target.value)}>
            <option value="all">All contracts</option>
            <option value="Month-to-month">Month-to-month</option>
            <option value="One year">One year</option>
            <option value="Two year">Two year</option>
          </select>
          <div className="count-badge">{filtered.length} accounts</div>
        </div>

        {/* Table */}
        {error && <div className="error-box" style={{ margin: 16 }}>❌ {error}</div>}

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
            <span className="spinner" />Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No customers yet</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Go to <strong>Predict & Retain</strong> tab and analyze customers first.
            </div>
          </div>
        ) : (
          <table className="c360-table">
            <thead>
              <tr>
                <th>Customer ↕</th>
                <th>Tenure ↕</th>
                <th>Contract</th>
                <th>Monthly ↕</th>
                <th>Churn risk ↕</th>
                <th>Segment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const prob = c.latestChurnScore ? (c.latestChurnScore * 100).toFixed(0) : null;
                const risk = c.riskLevel || "LOW";
                const contract = c.Contract || "—";
                const contractClass = contract === "One year" ? "oneyear" : contract === "Two year" ? "twoyear" : "";
                return (
                  <tr key={i} onClick={() => setSelected(c.customerId)}>
                    <td>
                      <div className="customer-name">{c.customerName || c.customerId}</div>
                      <div className="customer-id">{c.customerId}{c.city ? ` · ${c.city}` : ""}</div>
                    </td>
                    <td>{c.tenure != null ? `${c.tenure} mo` : "—"}</td>
                    <td>
                      <span className={`contract-badge ${contractClass}`}>{contract}</span>
                    </td>
                    <td>${c.MonthlyCharges?.toFixed(2) || "—"}</td>
                    <td>
                      {prob ? (
                        <div className="churn-risk-cell">
                          <div className={`risk-dot ${risk}`} />
                          <span className={`risk-pct ${risk}`}>{prob}%</span>
                          <span className={`risk-label-pill ${risk}`}>{risk}</span>
                        </div>
                      ) : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td className="segment-text">{getSegment(c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
