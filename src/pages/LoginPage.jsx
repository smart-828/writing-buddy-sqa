import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f9fafb", fontFamily: "system-ui, sans-serif", padding: "1rem"
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 36, marginBottom: "0.5rem" }}>✏️</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: 0 }}>Writing Buddy</h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>Sign in to continue</p>
        </div>

        <div style={{
          background: "white", border: "1px solid #e5e7eb",
          borderRadius: 12, padding: "1.5rem"
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus
                style={{
                  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
                  borderRadius: 8, fontSize: 14, fontFamily: "inherit",
                  boxSizing: "border-box", color: "#111"
                }}
              />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
                  borderRadius: 8, fontSize: 14, fontFamily: "inherit",
                  boxSizing: "border-box", color: "#111"
                }}
              />
            </div>
            {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}
            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "10px", background: "#2563eb",
                border: "none", borderRadius: 8, color: "white",
                fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, fontFamily: "inherit"
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
