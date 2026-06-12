import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getAllPrompts, addPrompt, togglePrompt } from "../../lib/db";
import { Card, Button, Badge, SectionLabel, EmptyState, Spinner } from "../../components/shared/UI";

export default function AdminPrompts() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", promptText: "", type: "creative", curriculum: "both" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllPrompts().then(p => { setPrompts(p); setLoading(false); });
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title || !form.promptText) return;
    setSaving(true);
    await addPrompt(profile.id, form);
    const updated = await getAllPrompts();
    setPrompts(updated);
    setForm({ title: "", promptText: "", type: "creative", curriculum: "both" });
    setAdding(false);
    setSaving(false);
  }

  async function handleToggle(id, current) {
    await togglePrompt(id, !current);
    setPrompts(p => p.map(pr => pr.id === id ? { ...pr, is_active: !current } : pr));
  }

  const typeColor = t => t === "creative" ? "green" : "amber";
  const curriculumLabel = c => ({ n5_scotland: "N5", gcse_england: "GCSE", both: "Both" }[c] || c);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button small variant="ghost" onClick={() => navigate("/admin")}>← Back</Button>
          <span style={{ fontWeight: 600, color: "#111" }}>Writing prompts</span>
        </div>
        <Button small variant="primary" onClick={() => setAdding(true)}>Add prompt</Button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {adding && (
          <Card style={{ marginBottom: "1.5rem", borderColor: "#2563eb" }}>
            <SectionLabel>New prompt</SectionLabel>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>Title (shown to student)</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. A moment of loneliness"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", color: "#111" }} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>Prompt text</label>
                <textarea value={form.promptText} onChange={e => setForm(f => ({ ...f, promptText: e.target.value }))}
                  placeholder="e.g. Write about a moment when you felt completely alone."
                  rows={3}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", color: "#111", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#111" }}>
                    <option value="creative">Creative writing</option>
                    <option value="discursive">Discursive writing</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>Curriculum</label>
                  <select value={form.curriculum} onChange={e => setForm(f => ({ ...f, curriculum: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#111" }}>
                    <option value="both">Both (N5 + GCSE)</option>
                    <option value="n5_scotland">N5 Scotland only</option>
                    <option value="gcse_england">GCSE England only</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="primary" disabled={saving}>{saving ? "Saving…" : "Save prompt"}</Button>
                <Button onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? <Spinner /> : prompts.length === 0 ? (
          <EmptyState icon="📋" title="No prompts yet" body="Add your first writing prompt." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {prompts.map(p => (
              <Card key={p.id} style={{ opacity: p.is_active ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{p.title}</span>
                      <Badge color={typeColor(p.type)}>{p.type}</Badge>
                      <Badge color="gray">{curriculumLabel(p.curriculum)}</Badge>
                      {!p.is_active && <Badge color="red">Inactive</Badge>}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{p.prompt_text}</div>
                  </div>
                  <Button small variant={p.is_active ? "danger" : "default"} onClick={() => handleToggle(p.id, p.is_active)} style={{ marginLeft: 16, flexShrink: 0 }}>
                    {p.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
