import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, increment
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase";

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Admin: create a student account ──────────────────────────────────────────

export async function createStudentAccount(adminId, { displayName, email, password, curriculum }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const studentUid = credential.user.uid;

  await updateDoc(doc(db, "profiles", studentUid), {}).catch(() => null);

  const { setDoc } = await import("firebase/firestore");
  await setDoc(doc(db, "profiles", studentUid), {
    display_name: displayName,
    email,
    role: "student",
    curriculum,
    total_stars: 0,
    created_at: serverTimestamp()
  });

  await addDoc(collection(db, "admin_student_links"), {
    admin_id: adminId,
    student_id: studentUid,
    created_at: serverTimestamp()
  });

  return studentUid;
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

export async function getPrompts({ curriculum, writingType } = {}) {
  let q = query(collection(db, "writing_prompts"), where("is_active", "==", true));
  const snap = await getDocs(q);
  let prompts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (curriculum) {
    prompts = prompts.filter(p => p.curriculum === curriculum || p.curriculum === "both");
  }
  if (writingType) {
    prompts = prompts.filter(p => p.type === writingType);
  }
  return prompts;
}

export async function getAllPrompts() {
  const snap = await getDocs(collection(db, "writing_prompts"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPrompt(adminId, { title, promptText, type, curriculum }) {
  return addDoc(collection(db, "writing_prompts"), {
    created_by_admin_id: adminId,
    title,
    prompt_text: promptText,
    type,
    curriculum,
    is_active: true,
    created_at: serverTimestamp()
  });
}

export async function togglePrompt(promptId, isActive) {
  return updateDoc(doc(db, "writing_prompts", promptId), { is_active: isActive });
}

// ── Submissions ───────────────────────────────────────────────────────────────

export async function saveSubmission(studentId, { promptId, responseText, wordCount, writingType, curriculum, scoreTotal, starsEarned, aiFeedback }) {
  const ref = await addDoc(collection(db, "submissions"), {
    student_id: studentId,
    prompt_id: promptId,
    response_text: responseText,
    word_count: wordCount,
    writing_type: writingType,
    curriculum,
    score_total: scoreTotal,
    stars_earned: starsEarned,
    ai_feedback: aiFeedback,
    created_at: serverTimestamp()
  });

  await updateDoc(doc(db, "profiles", studentId), {
    total_stars: increment(starsEarned)
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
