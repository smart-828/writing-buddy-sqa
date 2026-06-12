export function buildSystemPrompt(curriculum, writingType) {
  const isN5 = curriculum === "n5_scotland";

  const curriculumLabel = isN5
    ? "Scottish National 5 (SQA)"
    : "GCSE England (AQA)";

  const criteria = isN5
    ? writingType === "creative"
      ? [
          { name: "Content and ideas", desc: "Is there something genuine being communicated? Does the writing engage the reader?" },
          { name: "Structure", desc: "Does the writing have a clear shape, effective opening and ending, logical progression?" },
          { name: "Expression", desc: "Word choice, imagery, sentence variety, tone, voice." },
          { name: "Technical accuracy", desc: "Grammar, punctuation, spelling. Note every specific error found." }
        ]
      : [
          { name: "Content and ideas", desc: "Is there a clear argument or viewpoint sustained throughout?" },
          { name: "Structure", desc: "Logical progression, effective paragraphing, counter-argument included?" },
          { name: "Expression", desc: "Linking phrases, tone, clarity, persuasive techniques." },
          { name: "Technical accuracy", desc: "Grammar, punctuation, spelling. Note every specific error found." }
        ]
    : writingType === "creative"
    ? [
        { name: "Communication and intention", desc: "Does the writing engage the reader and fulfil the task?" },
        { name: "Organisation", desc: "Is there a clear structure with effective paragraphing?" },
        { name: "Vocabulary and style", desc: "Range and accuracy of vocabulary, literary techniques, sentence variety." },
        { name: "Technical accuracy", desc: "Spelling, punctuation, grammar. Note every specific error found." }
      ]
    : [
        { name: "Communication and intention", desc: "Is there a clear viewpoint? Does the writing persuade or inform effectively?" },
        { name: "Organisation", desc: "Logical structure, topic sentences, counter-argument, conclusion." },
        { name: "Vocabulary and style", desc: "Rhetorical devices, formal register, precise vocabulary." },
        { name: "Technical accuracy", desc: "Spelling, punctuation, grammar. Note every specific error found." }
      ];

  const criteriaJson = criteria
    .map(c => `    {"name": "${c.name}", "score": 4, "comment": "One specific sentence about this piece."}`)
    .join(",\n");

  const criteriaDesc = criteria
    .map((c, i) => `${i + 1}. ${c.name} — ${c.desc}`)
    .join("\n");

  const maxScore = criteria.length * 5;

  return `You are an experienced ${curriculumLabel} English teacher marking a ${writingType} writing piece. The student may be an EAL (English as an Additional Language) learner. Your tone is warm, encouraging, and direct — you are speaking to the student personally.

Assess the writing using these ${criteria.length} criteria, each scored out of 5:
${criteriaDesc}

Important rules:
- Technical accuracy must flag every grammatical, spelling, and punctuation error found, regardless of whether the student is a native speaker or EAL learner. Errors are errors under any standard.
- Be specific — reference actual phrases or sentences from the student's writing in your feedback.
- Be honest — if the work is weak, say so constructively. Do not inflate scores.
- All scores are out of 5. Total is out of ${maxScore}, normalised to 20 in the system.

Return ONLY valid JSON, no other text, no markdown fences:
{
  "criteria": [
${criteriaJson}
  ],
  "explanation": "Two paragraphs addressing the student as 'you'. First paragraph: two or three genuine strengths with specific examples from the text. Second paragraph: one or two clear areas to improve, framed constructively with a concrete suggestion for each.",
  "sampleAnswer": "A strong 180-220 word ${writingType} response to the same prompt, demonstrating excellent technique appropriate to ${curriculumLabel}."
}`;
}

export function buildProgressPrompt(submissions) {
  const lines = submissions.map((s, i) => {
    const scores = s.ai_feedback.criteria.map(c => `${c.name}: ${c.score}/5`).join(", ");
    return `Submission ${i + 1} (${new Date(s.created_at?.toDate ? s.created_at.toDate() : s.created_at).toLocaleDateString("en-GB")}): ${scores}`;
  });

  return {
    system: `You are a warm, honest English teacher reviewing a student's progress over their last ${submissions.length} writing submissions. The student may be an EAL learner. Speak directly to the student as 'you'.`,
    user: `Here are the student's scores across their last ${submissions.length} submissions:\n\n${lines.join("\n")}\n\nWrite an honest progress summary in 3 short paragraphs:\n1. What has genuinely improved (be specific, cite the criteria)\n2. What has stayed the same or gone backwards (be honest — the student deserves to know)\n3. One concrete thing to focus on in the next submission\n\nReturn ONLY valid JSON: {"summary": "your three paragraphs here with paragraph breaks as \\n\\n"}`
  };
}
