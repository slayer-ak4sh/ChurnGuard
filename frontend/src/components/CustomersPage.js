import React, { useState, useEffect, useCallback } from "react";
import { fetchCustomers, fetchCustomer } from "../api";

const RISK_COLOR = { HIGH: "#ff4d6d", MEDIUM: "#ffb347", LOW: "#00d4aa" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetchCustomers()
      .then(setCustomers)
      .catch((e) => setError(e.message || "Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    if (selected === id) return;
    setSelected(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await fetchCustomer(id);
      setDetail(d);
    } catch (e) {
      setError(e.message || "Failed to load customer detail");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="grid-2">
      {/* Customer list */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            All Customers {!loading && `(${customers.length})`}
          </div>
          <button
            onClick={load}
            style={{ background: "var(--card2)", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}
          >
            🔄 Refresh
          </button>
        </div>

        {error && <div className="error-box" style={{ marginBottom: 12 }}>❌ {error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            <span className="spinner" />Loading...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              No customers yet. Analyze customers in the <strong>Predict</strong> tab first.
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Risk</th>
                  <th>Churn Score</th>
                  <th>Contract</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr
                    key={i}
                    style={{ cursor: "pointer", background: selected === c.customerId ? "var(--card2)" : "" }}
                    onClick={() => openDetail(c.customerId)}
                  >
                    <td style={{ color: "var(--accent)", fontWeight: 500 }}>{c.customerId}</td>
                    <td>
                      {c.riskLevel
                        ? <span className={`risk-badge risk-${c.riskLevel}`}>{c.riskLevel}</span>
                        : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td>
                      {c.latestChurnScore != null
                        ? <span style={{ color: RISK_COLOR[c.riskLevel] || "var(--text)" }}>
                            {(c.latestChurnScore * 100).toFixed(1)}%
                          </span>
                        : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{c.Contract || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer detail */}
      <div className="card">
        <div className="card-title">Customer Detail</div>

        {!selected && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👆</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>Click a customer to view details</div>
          </div>
        )}

        {detailLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            <span className="spinner" />Loading...
          </div>
        )}

        {detail && !detailLoading && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{selected}</div>
              {detail.latestScore && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <span className={`risk-badge risk-${detail.latestScore.riskLevel}`}>
                    {detail.latestScore.riskLevel} RISK
                  </span>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>
                    {((detail.latestScore.churnProbability || 0) * 100).toFixed(1)}% churn probability
                  </span>
                </div>
              )}
            </div>

            {/* Profile fields */}
            <div className="card-title" style={{ marginBottom: 10 }}>Profile</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {["tenure", "MonthlyCharges", "Contract", "InternetService", "PaymentMethod"].map((k) =>
                detail.customer?.[k] != null ? (
                  <div key={k} style={{ background: "var(--card2)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{detail.customer[k]}</div>
                  </div>
                ) : null
              )}
            </div>

            {/* Latest offers */}
            {detail.latestOffers?.recommendations?.length > 0 && (
              <>
                <div className="card-title" style={{ marginBottom: 10 }}>Latest Retention Offers</div>
                {detail.latestOffers.recommendations.slice(0, 3).map((r, i) => (
                  <div className="rec-card" key={i}>
                    <div className="rec-header">
                      <span className={`priority-${r.priority}`}>{r.priority}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.category}</span>
                    </div>
                    <div className="rec-action">{r.action}</div>
                    <div className="rec-impact">📈 {r.expected_impact}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
