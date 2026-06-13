// Skill definitions — shared internal labels mapped to curriculum-specific names
export const SKILLS = {
  content:   { label: "Content and ideas",   gcse: "Communication and intention" },
  structure: { label: "Structure",           gcse: "Organisation" },
  expression:{ label: "Expression",          gcse: "Vocabulary and style" },
  accuracy:  { label: "Technical accuracy",  gcse: "Technical accuracy" }
};

export const SKILL_OPTIONS = Object.entries(SKILLS).map(([value, s]) => ({
  value, label: s.label
}));

export function getSkillLabel(skill, curriculum) {
  if (!skill || !SKILLS[skill]) return "";
  return curriculum === "gcse_england" ? SKILLS[skill].gcse : SKILLS[skill].label;
}

// ── AI marking prompt ─────────────────────────────────────────────────────────

export function buildSystemPrompt(curriculum, writingType) {
  const isN5 = curriculum === "n5_scotland";
  const curriculumLabel = isN5 ? "Scottish National 5 (SQA)" : "GCSE England (AQA)";

  const criteria = isN5
    ? writingType === "creative"
      ? [
          { name: "Content and ideas", desc: "Is there something genuine being communicated? Does the writing engage the reader?" },
          { name: "Structure", desc: "Clear shape, effective opening and ending, logical progression." },
          { name: "Expression", desc: "Word choice, imagery, sentence variety, tone, voice." },
          { name: "Technical accuracy", desc: "Grammar, punctuation, spelling. Note every specific error found." }
        ]
      : [
          { name: "Content and ideas", desc: "Clear argument or viewpoint sustained throughout." },
          { name: "Structure", desc: "Logical progression, effective paragraphing, counter-argument included." },
          { name: "Expression", desc: "Linking phrases, tone, clarity, persuasive techniques." },
          { name: "Technical accuracy", desc: "Grammar, punctuation, spelling. Note every specific error found." }
        ]
    : writingType === "creative"
    ? [
        { name: "Communication and intention", desc: "Does the writing engage the reader and fulfil the task?" },
        { name: "Organisation", desc: "Clear structure with effective paragraphing." },
        { name: "Vocabulary and style", desc: "Range and accuracy of vocabulary, literary techniques, sentence variety." },
        { name: "Technical accuracy", desc: "Spelling, punctuation, grammar. Note every specific error found." }
      ]
    : [
        { name: "Communication and intention", desc: "Clear viewpoint, persuades or informs effectively." },
        { name: "Organisation", desc: "Logical structure, topic sentences, counter-argument, conclusion." },
        { name: "Vocabulary and style", desc: "Rhetorical devices, formal register, precise vocabulary." },
        { name: "Technical accuracy", desc: "Spelling, punctuation, grammar. Note every specific error found." }
      ];

  const criteriaJson = criteria
    .map(c => `    {"name": "${c.name}", "score": 4, "comment": "One specific sentence about this piece."}`)
    .join(",\n");

  const criteriaDesc = criteria.map((c, i) => `${i + 1}. ${c.name} — ${c.desc}`).join("\n");

  return `You are an experienced ${curriculumLabel} English teacher marking a ${writingType} writing piece. The student may be an EAL (English as an Additional Language) learner. Your tone is warm, encouraging, and direct — speak to the student personally as 'you'.

Assess using these ${criteria.length} criteria, each scored out of 5:
${criteriaDesc}

Rules:
- Technical accuracy must flag every grammatical, spelling, and punctuation error found. Errors are errors regardless of whether the student is EAL or native.
- Be specific — reference actual phrases or sentences from the student's writing.
- Be honest — do not inflate scores. If the work is weak, say so constructively.
- The student may have been given hints as suggestions. Do NOT penalise the student for not following the hints. Mark only what is on the page.

Return ONLY valid JSON, no other text:
{
  "criteria": [
${criteriaJson}
  ],
  "explanation": "Two paragraphs to the student as 'you'. First: two or three genuine strengths with specific examples. Second: one or two clear areas to improve with a concrete suggestion for each.",
  "sampleAnswer": "A strong 500 word ${writingType} response to the same prompt showing excellent technique for ${curriculumLabel}."
}`;
}

// ── AI prompt generator ───────────────────────────────────────────────────────

export function buildPromptGeneratorSystem(writingType, targetSkill, curriculum) {
  const isN5 = curriculum === "n5_scotland";
  const skillLabel = getSkillLabel(targetSkill, curriculum);
  const curriculumLabel = isN5 ? "National 5 Scotland (SQA)" : "GCSE England (AQA)";

  return `You are an experienced ${curriculumLabel} English teacher creating writing prompts for a secondary school student. The student is an EAL learner re-entering school after time away. They need clear, accessible prompts on relatable topics.

You are creating ${writingType} writing prompts specifically designed to practise the skill: "${skillLabel}".

For each prompt, also generate 3 short hints — point form, one line each — telling the student exactly what to focus on for this skill. Hints should be simple and concrete, not vague encouragement.

Return ONLY valid JSON, no other text:
{
  "prompts": [
    {
      "title": "Short title (4-6 words)",
      "prompt_text": "The full writing prompt as it will appear to the student.",
      "hints": ["Hint one.", "Hint two.", "Hint three."]
    }
  ]
}

Generate 8 prompts. Topics should be relatable to a teenager: school, family, friendship, technology, sport, the future, fairness, identity. Avoid obscure cultural references. Prompts should feel achievable, not intimidating.`;
}

// ── AI progress summary ───────────────────────────────────────────────────────

export function buildProgressPrompt(submissions) {
  const lines = submissions.map((s, i) => {
    const scores = s.ai_feedback?.criteria?.map(c => `${c.name}: ${c.score}/5`).join(", ") || "";
    const skill = s.target_skill ? ` [target: ${s.target_skill}]` : "";
    const d = s.created_at?.toDate ? s.created_at.toDate() : new Date(s.created_at);
    return `Submission ${i + 1} (${d.toLocaleDateString("en-GB")}${skill}): ${scores}`;
  });

  return {
    system: `You are a warm, honest English teacher reviewing a student's writing progress. The student may be an EAL learner. Speak directly to the student as 'you'. Be specific and honest — do not give empty praise. If something has not improved, say so clearly but constructively.`,
    user: `Here are the student's scores across their last ${submissions.length} submissions:\n\n${lines.join("\n")}\n\nWrite an honest progress summary in exactly 3 short paragraphs:\n1. What has genuinely improved (be specific, name the criteria and submissions)\n2. What has stayed the same or gone backwards (be honest)\n3. One single concrete thing to focus on in the next submission\n\nReturn ONLY valid JSON: {"summary": "paragraph one\\n\\nparagraph two\\n\\nparagraph three"}`
  };
}
