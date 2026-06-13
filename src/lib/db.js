import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, increment
} from "firebase/firestore";
import { db } from "./firebase";

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateProfile(uid, data) {
  return updateDoc(doc(db, "profiles", uid), data);
}

// ── Admin: get linked students ────────────────────────────────────────────────

export async function getLinkedStudents(adminId) {
  const linksSnap = await getDocs(
    query(collection(db, "admin_student_links"), where("admin_id", "==", adminId))
  );
  const studentIds = linksSnap.docs.map(d => d.data().student_id);
  if (!studentIds.length) return [];
  const profiles = await Promise.all(studentIds.map(id => getProfile(id)));
  return profiles.filter(Boolean);
}

// ── Writing prompts ───────────────────────────────────────────────────────────

// Admin: get own prompts only
export async function getAdminPrompts(adminId) {
  const snap = await getDocs(
    query(collection(db, "writing_prompts"), where("created_by_admin_id", "==", adminId))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Student: get active prompts from their linked admin
export async function getStudentPrompts(adminId, writingType) {
  const snap = await getDocs(
    query(
      collection(db, "writing_prompts"),
      where("created_by_admin_id", "==", adminId)
    )
  );
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return all.filter(p => p.is_active === true && p.type === writingType);
}

export async function addPrompt(adminId, { title, promptText, type, targetSkill, hints }) {
  return addDoc(collection(db, "writing_prompts"), {
    created_by_admin_id: adminId,
    title,
    prompt_text: promptText,
    type,
    target_skill: targetSkill,
    hints,
    is_active: true,
    created_at: serverTimestamp()
  });
}

export async function togglePrompt(promptId, isActive) {
  return updateDoc(doc(db, "writing_prompts", promptId), { is_active: isActive });
}

// ── Submissions ───────────────────────────────────────────────────────────────

export async function saveSubmission(studentId, {
  promptId, responseText, wordCount, writingType,
  curriculum, scoreTotal, starsEarned, aiFeedback, targetSkill
}) {
  const ref = await addDoc(collection(db, "submissions"), {
    student_id: studentId,
    prompt_id: promptId,
    response_text: responseText,
    word_count: wordCount,
    writing_type: writingType,
    curriculum,
    score_total: scoreTotal,
    stars_earned: starsEarned,
    target_skill: targetSkill || null,
    ai_feedback: aiFeedback,
    created_at: serverTimestamp()
  });

  await updateDoc(doc(db, "profiles", studentId), {
    total_stars: increment(starsEarned),
    last_submission_at: serverTimestamp()
  });

  return ref.id;
}

export async function getStudentSubmissions(studentId, limitCount = 50) {
  const snap = await getDocs(
    query(
      collection(db, "submissions"),
      where("student_id", "==", studentId),
      orderBy("created_at", "desc"),
      limit(limitCount)
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSubmission(submissionId) {
  const snap = await getDoc(doc(db, "submissions", submissionId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Get set of prompt IDs the student has already submitted
export async function getCompletedPromptIds(studentId) {
  const snap = await getDocs(
    query(collection(db, "submissions"), where("student_id", "==", studentId))
  );
  return new Set(snap.docs.map(d => d.data().prompt_id));
}

// ── Weekly streak ─────────────────────────────────────────────────────────────

export async function checkAndAwardStreakBonus(studentId) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

  const snap = await getDocs(
    query(
      collection(db, "submissions"),
      where("student_id", "==", studentId),
      where("created_at", ">=", startOfWeek),
      limit(2)
    )
  );

  // If this is exactly the first submission this week, award bonus
  if (snap.docs.length === 1) {
    await updateDoc(doc(db, "profiles", studentId), {
      total_stars: increment(1)
    });
    return true; // bonus awarded
  }
  return false;
}

// ── Progress summaries ────────────────────────────────────────────────────────

export async function saveProgressSummary(studentId, { submissionCount, summaryText }) {
  return addDoc(collection(db, "progress_summaries"), {
    student_id: studentId,
    submission_count_at_generation: submissionCount,
    summary_text: summaryText,
    generated_at: serverTimestamp()
  });
}

export async function getLatestProgressSummary(studentId) {
  const snap = await getDocs(
    query(
      collection(db, "progress_summaries"),
      where("student_id", "==", studentId),
      orderBy("generated_at", "desc"),
      limit(1)
    )
  );
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// ── Admin link lookup ─────────────────────────────────────────────────────────

export async function getAdminForStudent(studentId) {
  const snap = await getDocs(
    query(collection(db, "admin_student_links"), where("student_id", "==", studentId))
  );
  return snap.empty ? null : snap.docs[0].data().admin_id;
}
