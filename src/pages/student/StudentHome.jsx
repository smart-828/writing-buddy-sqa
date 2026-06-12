import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../../components/shared/UI";

export default function StudentHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const curriculumLabel = profile?.curriculum === "n5_scotland" ? "National 5 Scotland" : "GCSE England";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>✏️</span>
          <span style={{ fontWeight: 600, fontSize: 16, color: "#111" }}>Writing Buddy</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/student/progress")} style={{ background: "none", border: "none", fontSize: 13, color: "#2563eb", cursor: "pointer", fontFamily: "inherit" }}>
            My progress
          </button>
          <button onClick={() => signOut(auth)} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111", marginBottom: 8 }}>
            Hello, {profile?.display_name?.split(" ")[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1rem" }}>{curriculumLabel}</p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 999, padding: "8px 20px"
          }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <span style={{ fontSize: 20, fontWeight: 600, color: "#92400e" }}>{profile?.total_stars || 0}</span>
            <span style={{ fontSize: 14, color: "#b45309" }}>stars earned</span>
          </div>
        </div>

        <p style={{ fontSize: 15, color: "#374151", marginBottom: "2rem" }}>
          What would you like to write today?
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card style={{ cursor: "pointer", textAlign: "center", padding: "2rem 1rem", transition: "border-color 0.15s" }}
            onClick={() => navigate("/student/prompts/creative")}>
            <div style={{ fontSize: 40, marginBottom: "0.75rem" }}>🖊️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 6 }}>Creative writing</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              Tell a story, describe an experience, express your imagination
            </div>
          </Card>

          <Card style={{ cursor: "pointer", textAlign: "center", padding: "2rem 1rem", transition: "border-color 0.15s" }}
            onClick={() => navigate("/student/prompts/discursive")}>
            <div style={{ fontSize: 40, marginBottom: "0.75rem" }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 6 }}>Discursive writing</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              Argue a point, share your opinion, discuss both sides
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
