import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { getLinkedStudents } from "../../lib/db";
import { Card, Button, Badge, Spinner, EmptyState, Stars } from "../../components/shared/UI";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      getLinkedStudents(profile.id).then(s => {
        setStudents(s);
        setLoading(false);
      });
    }
  }, [profile]);

  const curriculumLabel = c => c === "n5_scotland" ? "N5 Scotland" : "GCSE England";
  const curriculumColor = c => c === "n5_scotland" ? "blue" : "purple";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{
        background: "white", borderBottom: "1px solid #e5e7eb",
        padding: "0 1.5rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 56
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>✏️</span>
          <span style={{ fontWeight: 600, fontSize: 16, color: "#111" }}>Writing Buddy</span>
          <Badge color="gray">Admin</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{profile?.display_name}</span>
          <Button small onClick={() => navigate("/admin/prompts")}>Manage prompts</Button>
          <Button small onClick={() => navigate("/admin/students/new")}>Add student</Button>
          <Button small variant="ghost" onClick={() => signOut(auth)}>Sign out</Button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: "1.5rem" }}>
          Your students
        </h2>

        {loading ? <Spinner /> : students.length === 0 ? (
          <EmptyState
            icon="🎓"
            title="No students yet"
            body="Add your first student to get started."
            action={<Button onClick={() => navigate("/admin/students/new")}>Add student</Button>}
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {students.map(s => (
              <Card key={s.id} style={{ cursor: "pointer", transition: "border-color 0.15s" }}
                onClick={() => navigate(`/admin/students/${s.id}`)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: "#eff6ff", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 16, fontWeight: 600, color: "#2563eb"
                    }}>
                      {s.display_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "#111" }}>{s.display_name}</div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{s.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Badge color={curriculumColor(s.curriculum)}>{curriculumLabel(s.curriculum)}</Badge>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Stars score={Math.min(s.total_stars, 5)} max={5} size={14} />
                        <span style={{ fontSize: 13, color: "#6b7280" }}>{s.total_stars} total</span>
                      </div>
                    </div>
                    <span style={{ color: "#d1d5db", fontSize: 18 }}>›</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
