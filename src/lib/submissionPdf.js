import { jsPDF } from "jspdf";

// Builds and downloads an A4 PDF of one submission:
// task + full question, details, the student's passage (verbatim),
// criteria scores with comments, AI feedback, and the sample strong answer.

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 18;

// jsPDF's built-in fonts cover Western European characters and common
// punctuation (— ‘ ’ “ ” …). Anything else would print as garbage, so
// replace it with "?" rather than corrupt the line.
function safe(text) {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\n\t\x20-\x7E\xA0-\xFF–—‘’“”…•€]/g, "?");
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function isoDate(ts) {
  const d = ts ? (ts.toDate ? ts.toDate() : new Date(ts)) : new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function slug(text) {
  return String(text || "writing")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "writing";
}

export function downloadSubmissionPdf({ submission, studentName, promptText }) {
  const s = submission;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  function ensureSpace(h) {
    if (y + h > BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function heading(text) {
    ensureSpace(24); // keep a heading together with its first lines
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text(safe(text), MARGIN, y);
    y += 2;
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;
  }

  // Writes text that wraps and flows across pages, keeping blank lines
  // between paragraphs exactly as written.
  function paragraphText(text, { size = 11, style = "normal", color = [31, 41, 55], indent = 0, lineGap = 1.45 } = {}) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lineH = size * 0.3528 * lineGap;
    const lines = doc.splitTextToSize(safe(text), CONTENT_W - indent);
    lines.forEach(line => {
      ensureSpace(lineH);
      doc.text(line, MARGIN + indent, y);
      y += lineH;
    });
  }

  // ── Title block ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 17, 17);
  const titleLines = doc.splitTextToSize(safe(s.prompt_title || "Writing task"), CONTENT_W);
  titleLines.forEach(line => { doc.text(line, MARGIN, y + 4); y += 8; });
  y += 1;

  const typeLabel = s.writing_type === "creative" ? "Creative writing"
    : s.writing_type === "discursive" ? "Discursive writing" : "";
  const details = [
    studentName,
    formatDate(s.created_at),
    typeLabel,
    `${s.word_count ?? 0} words`,
    `Score ${s.score_total ?? "-"}/20`
  ].filter(Boolean).join("   ·   ");
  paragraphText(details, { size: 10, color: [107, 114, 128] });

  // ── Task question ──
  heading("Task");
  if (promptText) {
    paragraphText(promptText, { size: 11 });
  } else {
    paragraphText("The full question for this task is no longer available (the prompt has been deleted).",
      { size: 10, style: "italic", color: [107, 114, 128] });
  }

  // ── Student's writing ──
  heading(studentName ? `${studentName}'s writing` : "Student's writing");
  paragraphText(s.response_text || "", { size: 11, lineGap: 1.6 });

  // ── Criteria ──
  const criteria = s.ai_feedback?.criteria || [];
  if (criteria.length) {
    heading("Criteria scores");
    criteria.forEach(c => {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 17, 17);
      doc.text(safe(c.name), MARGIN, y);
      doc.text(`${c.score}/5`, PAGE_W - MARGIN, y, { align: "right" });
      y += 5.5;
      if (c.comment) paragraphText(c.comment, { size: 10, color: [75, 85, 99] });
      y += 3;
    });
  }

  // ── AI feedback ──
  if (s.ai_feedback?.explanation) {
    heading("AI feedback");
    paragraphText(s.ai_feedback.explanation, { size: 11 });
  }

  // ── Sample strong answer ──
  if (s.ai_feedback?.sampleAnswer) {
    heading("Sample strong answer");
    paragraphText(s.ai_feedback.sampleAnswer, { size: 11, lineGap: 1.6 });
  }

  // ── Page numbers ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Writing Buddy  ·  Page ${i} of ${pages}`, PAGE_W / 2, PAGE_H - 10, { align: "center" });
  }

  const namePart = (studentName || "Student").split(" ")[0].replace(/[^A-Za-z0-9-]/g, "") || "Student";
  doc.save(`${namePart}_${isoDate(s.created_at)}_${slug(s.prompt_title)}.pdf`);
}
