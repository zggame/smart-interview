interface TurnInput {
  question_text: string;
  answer_storage_key: string | null;
}

export function buildInterviewReviewPrompt(jobDescription: string, turns: TurnInput[]) {
  const formattedTurns = turns.map((t, i) => `Q${i + 1}: ${t.question_text}\nAnswer Video Ref: ${t.answer_storage_key || 'No answer provided'}`).join('\n\n');
  return `
You are an AI assisting a recruiter in reviewing an asynchronous interview.
The candidate has completed an interview for the following job description:

${jobDescription}

Here is the transcript and references for the candidate's answers:
${formattedTurns}

Please evaluate the candidate's performance. You must provide exactly two things in your response:
1. RECOMMENDATION: One of the following exact words: "advance", "maybe", or "reject".
2. SUMMARY: A brief paragraph summarizing the candidate's strengths, weaknesses, and overall fit.

Format your response exactly like this:
RECOMMENDATION: advance
SUMMARY: [your summary here]
`.trim();
}

export function parseInterviewReview(rawText: string) {
  const lines = rawText.split('\n');
  let recommendation = 'maybe';
  const summaryParts: string[] = [];

  for (const line of lines) {
    if (line.toUpperCase().startsWith('RECOMMENDATION:')) {
      const rec = line.replace(/RECOMMENDATION:/i, '').trim().toLowerCase();
      if (['advance', 'maybe', 'reject'].includes(rec)) recommendation = rec;
    } else if (line.toUpperCase().startsWith('SUMMARY:')) {
      summaryParts.push(line.replace(/SUMMARY:/i, '').trim());
    } else if (summaryParts.length > 0) {
      summaryParts.push(line.trim());
    }
  }
  return { recommendation, summary: summaryParts.join('\n').trim() };
}
