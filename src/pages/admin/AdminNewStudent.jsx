import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../../components/shared/UI";

export default function AdminNewStudent() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 56 }}>
        <Button small variant="ghost" onClick={() => navigate("/admin")}>← Back</Button>
        <span style={{ fontWeight: 600, color: "#111", marginLeft: 12 }}>Add student</span>
      </div>

      <div style={{ maxWidth: 480, margin: "2rem auto", padding: "0 1.5rem" }}>
        <Card>
          <div style={{ fontSize: 32, textAlign: "center", marginBottom: "1rem" }}>👤</div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: "0.75rem", textAlign: "center" }}>
            Create student accounts in Firebase Console
          </h2>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            <p style={{ marginBottom: "0.75rem" }}>To add a new student:</p>
            <ol style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li>Go to <strong>Firebase Console → Authentication → Add user</strong> — enter their email and password, copy their UID</li>
              <li>Go to <strong>Firestore → profiles collection → Add document</strong> — use their UID as document ID, add: display_name, email, role: student, curriculum, total_stars: 0</li>
              <li>Go to <strong>Firestore → admin_student_links → Add document</strong> — add: admin_id (your UID), student_id (their UID), created_at (timestamp)</li>
            </ol>
          </div>
          <Button fullWidth onClick={() => window.open("https://console.firebase.google.com", "_blank")}>
            Open Firebase Console ↗
          </Button>
        </Card>
      </div>
    </div>
  );
}
