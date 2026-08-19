import React, { useState } from "react";
import RiskOverview from "./components/RiskOverview";
import Customer360 from "./components/Customer360";
import PredictPage from "./components/PredictPage";
import ReportsPage from "./components/ReportsPage";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("customer360");

  const navItems = [
    { id: "risk",        label: "Risk Overview",   icon: "⊞" },
    { id: "customer360", label: "Customer 360",    icon: "👤" },
    { id: "predict",     label: "Predict & Retain",icon: "✦"  },
    { id: "reports",     label: "Reports",         icon: "⊟" },
  ];

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">⟳</div>
          <div>
            <div className="brand-name">RetainIQ</div>
            <div className="brand-sub">RETENTION AI</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>


      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {page === "risk"        && <RiskOverview setPage={setPage} />}
        {page === "customer360" && <Customer360 />}
        {page === "predict"     && <PredictPage />}
        {page === "reports"     && <ReportsPage />}
      </main>
    </div>
  );
}
