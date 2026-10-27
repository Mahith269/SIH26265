import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  const [fdrs, setFdrs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("college");
  const [form, setForm] = useState({
    institution_name: "",
    certificate_number: "",
    bank_name: "",
    amount: "",
    maturity_date: "",
  });

  async function loadFdrs() {
    try {
      setLoading(true);
      const [fdrResponse, alertResponse] = await Promise.all([
        axios.get(`${API_URL}/fdrs`),
        axios.get(`${API_URL}/fdrs/alerts`),
      ]);
      setFdrs(fdrResponse.data);
      setAlerts(alertResponse.data.alerts || []);
      setMessage("");
    } catch (error) {
      console.error("Error loading FDR data:", error);
      setMessage("Could not load FDR data. Make sure the FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFdrs(); }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await axios.post(`${API_URL}/fdrs`, {
        institution_name: form.institution_name.trim(),
        certificate_number: form.certificate_number.trim(),
        bank_name: form.bank_name.trim(),
        amount: Number(form.amount),
        maturity_date: form.maturity_date,
      });
      setForm({ institution_name: "", certificate_number: "", bank_name: "", amount: "", maturity_date: "" });
      setMessage("FDR registered successfully.");
      await loadFdrs();
    } catch (error) {
      const detail = error.response?.data?.detail;
      setMessage(typeof detail === "string" ? detail : "Could not register FDR. Check the details and try again.");
    }
  }

  async function updateStatus(id, action) {
    setMessage("");
    try {
      if (action === "submit") {
        await axios.post(`${API_URL}/fdrs/${id}/submit`);
      } else {
        let reviewNote = "";
        if (action === "correction_required") {
          reviewNote = window.prompt("Enter the corrections required:", "");
          if (reviewNote === null) return;
          if (!reviewNote.trim()) { setMessage("Please enter the corrections required."); return; }
        } else if (action === "verified") {
          reviewNote = window.prompt("Enter verification remarks (optional):", "Documents verified in demo");
          if (reviewNote === null) return;
        }
        await axios.post(`${API_URL}/fdrs/${id}/review`, { action, review_note: reviewNote });
      }
      setMessage("FDR status updated successfully.");
      await loadFdrs();
    } catch (error) {
      const detail = error.response?.data?.detail;
      setMessage(typeof detail === "string" ? detail : "Could not update FDR status. Check the backend API.");
    }
  }

  function renderActions(fdr) {
    if (view === "college") {
      if (fdr.status === "Draft" || fdr.status === "Correction Required") {
        return <button onClick={() => updateStatus(fdr.id, "submit")}>Submit FDR</button>;
      }
      return <span className="muted-text">No action available</span>;
    }
    if (fdr.status === "Submitted") {
      return <button onClick={() => updateStatus(fdr.id, "under_review")}>Start Review</button>;
    }
    if (fdr.status === "Under Review") {
      return <div className="action-group">
        <button onClick={() => updateStatus(fdr.id, "verified")}>Verify</button>
        <button className="secondary-button" onClick={() => updateStatus(fdr.id, "correction_required")}>Request Corrections</button>
      </div>;
    }
    return <span className="muted-text">No action available</span>;
  }

  const stats = [
    ["Total FDRs", fdrs.length],
    ["Draft", fdrs.filter((f) => f.status === "Draft").length],
    ["Submitted", fdrs.filter((f) => f.status === "Submitted").length],
    ["Under Review", fdrs.filter((f) => f.status === "Under Review").length],
    ["Verified", fdrs.filter((f) => f.status === "Verified").length],
    ["Corrections", fdrs.filter((f) => f.status === "Correction Required").length],
  ];
  const visibleFdrs = view === "officer"
    ? fdrs.filter((f) => f.status === "Submitted" || f.status === "Under Review")
    : fdrs;

  function renderMaturityAlert(alert) {
    if (alert.alert_type === "Matured") {
      return <span className="alert-matured">Matured {Math.abs(alert.days_remaining)} day(s) ago</span>;
    }
    return <span className="alert-upcoming">Matures in {alert.days_remaining} day(s)</span>;
  }

  return <div className="container">
    <header className="portal-header">
      <div><h1>FDR Management Portal</h1><p>Security Deposit and Fixed Deposit Receipt Management</p></div>
      <button className="refresh-button" onClick={loadFdrs} disabled={loading}>{loading ? "Loading..." : "Refresh Data"}</button>
    </header>
    {message && <div className="message-banner" role="status">{message}</div>}
    <nav className="dashboard-tabs">
      <button className={view === "college" ? "active-tab" : "tab-button"} onClick={() => setView("college")}>College Dashboard</button>
      <button className={view === "officer" ? "active-tab" : "tab-button"} onClick={() => setView("officer")}>Officer Dashboard</button>
    </nav>
    <section className="stats-grid">{stats.map(([label, value]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
    <section className="panel maturity-panel">
      <div className="panel-heading"><div><h2>FDR Maturity Alerts</h2><p>Verified FDRs that have matured or are due within the next 30 days.</p></div><span className="alert-count">{alerts.length} alert{alerts.length === 1 ? "" : "s"}</span></div>
      {loading ? <p>Loading maturity alerts...</p> : alerts.length === 0 ? <div className="empty-state"><h3>No maturity alerts</h3><p>No verified FDRs are currently due for attention.</p></div> : <div className="table-wrapper"><table><thead><tr><th>Certificate Number</th><th>Institution</th><th>Maturity Date</th><th>Alert</th></tr></thead><tbody>{alerts.map((a) => <tr key={a.id}><td>{a.certificate_number}</td><td>{a.institution_name}</td><td>{a.maturity_date}</td><td>{renderMaturityAlert(a)}</td></tr>)}</tbody></table></div>}
    </section>
    {view === "college" && <section className="panel"><h2>Register New FDR</h2><p className="panel-description">Enter the institution's fixed deposit details.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="institution_name">Institution Name</label><input id="institution_name" name="institution_name" value={form.institution_name} onChange={handleChange} placeholder="Enter institution name" required />
        <label htmlFor="certificate_number">Certificate Number</label><input id="certificate_number" name="certificate_number" value={form.certificate_number} onChange={handleChange} placeholder="e.g. FDR-2026-001" required />
        <label htmlFor="bank_name">Bank Name</label><input id="bank_name" name="bank_name" value={form.bank_name} onChange={handleChange} placeholder="Enter bank name" required />
        <label htmlFor="amount">FDR Amount (₹)</label><input id="amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} placeholder="Enter amount" required />
        <label htmlFor="maturity_date">Maturity Date</label><input id="maturity_date" name="maturity_date" type="date" value={form.maturity_date} onChange={handleChange} required />
        <button type="submit" disabled={loading}>Register FDR</button>
      </form>
    </section>}
    <section className="panel">
      <div className="panel-heading"><div><h2>{view === "college" ? "All FDR Records" : "FDRs Requiring Review"}</h2><p>{view === "college" ? "Track the status of registered FDRs." : "Review submitted FDRs and verify their documents."}</p></div><span className="record-count">{visibleFdrs.length} record{visibleFdrs.length === 1 ? "" : "s"}</span></div>
      {loading ? <p>Loading FDR records...</p> : visibleFdrs.length === 0 ? <div className="empty-state"><h3>No FDR records found</h3><p>{view === "officer" ? "There are no submitted FDRs waiting for review." : "Register your first FDR using the form above."}</p></div> : <div className="table-wrapper"><table><thead><tr><th>Certificate Number</th><th>Institution</th><th>Bank</th><th>Amount</th><th>Maturity Date</th><th>Status</th><th>Review Note</th><th>Action</th></tr></thead><tbody>{visibleFdrs.map((f) => <tr key={f.id}><td>{f.certificate_number}</td><td>{f.institution_name}</td><td>{f.bank_name}</td><td>{Number(f.amount).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })}</td><td>{f.maturity_date}</td><td><span className={`status status-${f.status.toLowerCase().replace(/\s+/g, "-")}`}>{f.status}</span></td><td>{f.review_note || "—"}</td><td>{renderActions(f)}</td></tr>)}</tbody></table></div>}
    </section>
    <footer className="app-footer"><p>FDR Management Portal · Hackathon Prototype</p><p>Demo dashboard only. Authentication and role-based access must be implemented before production use.</p></footer>
  </div>;
}
