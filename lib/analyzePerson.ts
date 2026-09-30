import { z } from "zod";
import { complete, parseJson, llmProvider } from "./llm";
import { scrub } from "./safety";
import { InferredSchema, type Profile, SourceSchema } from "./types";

const OutSchema = z.object({
  summary: z.string(),
  summarySource: SourceSchema.catch("Both"),
  summaryConfidence: z.number().catch(0.5),
  interests: z.array(InferredSchema).catch([]),
  hobbies: z.array(InferredSchema).catch([]),
  values: z.array(InferredSchema).catch([]),
  conversationTopics: z.array(InferredSchema).catch([]),
  lifestyleSignals: z.array(InferredSchema).catch([]),
  energizers: z.array(InferredSchema).catch([]),
  compatibilitySignals: z.array(InferredSchema).catch([]),
});

export const EMPTY_PROFILE: Profile = {
  summary: "Not enough public information was available to build a reliable profile.",
  summarySource: "Both",
  summaryConfidence: 0,
  interests: [], hobbies: [], values: [], conversationTopics: [],
  lifestyleSignals: [], energizers: [], compatibilitySignals: [],
};

const SYSTEM = `You analyze a person for a dating-compatibility product. You are given ONLY text extracted from their public LinkedIn and public Instagram pages.
Rules:
- Every conclusion must derive strictly from the provided text. Use no outside knowledge. Do not invent facts. If something is not supported, omit it.
- Phrase inferences tentatively ("Likely interested in...", "Public content suggests...", "Appears to enjoy..."). Never state inferences as absolute fact.
- NEVER infer or mention: religion, race, ethnicity, sexual orientation, medical/health conditions, political affiliation.
- Each item: {"text": short phrase (2-6 words, lowercase tag-like), "source": "LinkedIn"|"Instagram"|"Both", "confidence": 0..1}. Confidence reflects how directly the text supports it (direct mention >0.8, weak inference <0.5).
- If the text is sparse, return short or empty arrays and lower confidence. Empty arrays are fine.
Return ONLY JSON with keys: summary (2-3 tentative sentences), summarySource, summaryConfidence, interests, hobbies, values, conversationTopics, lifestyleSignals, energizers (what seems to energize them), compatibilitySignals (potential compatibility strengths).`;

export async function analyzePerson(sourceText: string): Promise<Profile> {
  if (!sourceText.trim()) return EMPTY_PROFILE;
  if (!llmProvider()) {
    return {
      ...EMPTY_PROFILE,
      summary:
        "Public content was retrieved, but no LLM API key is configured, so no AI analysis could be produced. Add ANTHROPIC_API_KEY or OPENAI_API_KEY.",
    };
  }
  const raw = await complete({
    system: SYSTEM,
    messages: [{ role: "user", content: `Extracted public content:\n\n${sourceText.slice(0, 12000)}` }],
    maxTokens: 2000,
    json: true,
  });
  const p = OutSchema.parse(parseJson(raw));
  return {
    ...p,
    summaryConfidence: Math.min(1, Math.max(0, p.summaryConfidence)),
    interests: scrub(p.interests),
    hobbies: scrub(p.hobbies),
    values: scrub(p.values),
    conversationTopics: scrub(p.conversationTopics),
    lifestyleSignals: scrub(p.lifestyleSignals),
    energizers: scrub(p.energizers),
    compatibilitySignals: scrub(p.compatibilitySignals),
  };
}
