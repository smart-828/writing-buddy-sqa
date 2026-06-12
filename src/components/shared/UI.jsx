export function Button({ children, onClick, disabled, variant = "default", fullWidth, small }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    border: "1px solid", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? "100%" : "auto",
    padding: small ? "6px 14px" : "10px 20px",
    fontSize: small ? 13 : 14,
  };
  const variants = {
    default: { background: "white", borderColor: "#ddd", color: "#111" },
    primary: { background: "#2563eb", borderColor: "#2563eb", color: "white" },
    danger: { background: "white", borderColor: "#fca5a5", color: "#dc2626" },
    ghost: { background: "transparent", borderColor: "transparent", color: "#555" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{
      background: "white", border: "1px solid #e5e7eb",
      borderRadius: 12, padding: "1.25rem",
      ...style
    }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
      textTransform: "uppercase", color: "#9ca3af", marginBottom: "0.75rem"
    }}>
      {children}
    </div>
  );
}

export function Stars({ score, max = 5, size = 18, color = "#f59e0b" }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: size, color: i < score ? color : "#e5e7eb" }}>★</span>
      ))}
    </span>
  );
}

export function Badge({ children, color = "blue" }) {
  const colors = {
    blue: { bg: "#eff6ff", text: "#1d4ed8" },
    green: { bg: "#f0fdf4", text: "#15803d" },
    amber: { bg: "#fffbeb", text: "#b45309" },
    red: { bg: "#fef2f2", text: "#b91c1c" },
    gray: { bg: "#f9fafb", text: "#374151" },
    purple: { bg: "#faf5ff", text: "#7e22ce" },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      fontSize: 12, fontWeight: 500, padding: "2px 8px",
      borderRadius: 6, background: c.bg, color: c.text
    }}>
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
      <div style={{
        width: 28, height: 28, border: "2px solid #e5e7eb",
        borderTopColor: "#2563eb", borderRadius: "50%",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#6b7280" }}>
      <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>{title}</div>
      {body && <div style={{ fontSize: 14, marginBottom: "1rem" }}>{body}</div>}
      {action}
    </div>
  );
}
