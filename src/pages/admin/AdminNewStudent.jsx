import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { createStudentAccount } from "../../lib/db";
import { Card, Button } from "../../components/shared/UI";

export default function AdminNewStudent() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", curriculum: "n5_scotland" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function field(label, key, type = "text", options = null) {
    return (
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
        {options ? (
          <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#111", boxSizing: "border-box" }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#111", boxSizing: "border-box" }} />
        )}
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.displayName || !form.email || !form.password) { setError("All fields are required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      await createStudentAccount(profile.id, form);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 56 }}>
        <Button small variant="ghost" onClick={() => navigate("/admin")}>← Back</Button>
        <span style={{ fontWeight: 600, color: "#111", marginLeft: 12 }}>Add student</span>
      </div>

      <div style={{ maxWidth: 480, margin: "2rem auto", padding: "0 1.5rem" }}>
        <Card>
          <form onSubmit={handleSubmit}>
            {field("Student's name", "displayName")}
            {field("Email address", "email", "email")}
            {field("Password", "password", "password")}
            {field("Curriculum", "curriculum", "text", [
              { value: "n5_scotland", label: "National 5 Scotland (SQA)" },
              { value: "gcse_england", label: "GCSE England (AQA)" }
            ])}
            {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <Button fullWidth variant="primary" disabled={loading}>
                {loading ? "Creating…" : "Create student account"}
              </Button>
              <Button fullWidth onClick={() => navigate("/admin")}>Cancel</Button>
            </div>
          </form>
        </Card>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: "1rem", textAlign: "center" }}>
          Share the email and password with the student so they can sign in.
        </p>
      </div>
    </div>
  );
}
