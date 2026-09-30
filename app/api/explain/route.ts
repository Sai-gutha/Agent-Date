import { z } from "zod";
import { complete, llmProvider, parseJson } from "@/lib/llm";
import { PersonSchema } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  const parsed = z
    .object({ person: PersonSchema, matches: z.array(z.object({ person: PersonSchema, shared: z.array(z.string()) })).max(8) })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || !llmProvider()) return Response.json({ explanations: [] });
  const { person, matches } = parsed.data;
  const f = (p: typeof person) =>
    `${p.name}: ${p.profile.summary} Interests: ${[...p.profile.interests, ...p.profile.hobbies].map((i) => i.text).join(", ")}. Values: ${p.profile.values.map((i) => i.text).join(", ")}.`;
  try {
    const raw = await complete({
      system:
        'For each candidate, write ONE sentence (max 25 words) explaining why they may be a good match for the main person, using only the provided profile data, with tentative wording ("Public content suggests..."). Never mention religion, race, ethnicity, sexual orientation, health, politics. Return ONLY JSON: {"explanations":["...", ...]} in the same order as the candidates.',
      messages: [{ role: "user", content: `MAIN: ${f(person)}\n\nCANDIDATES:\n${matches.map((m, i) => `${i + 1}. ${f(m.person)} Shared: ${m.shared.join(", ") || "none"}`).join("\n")}` }],
      maxTokens: 700,
      json: true,
    });
    const out = parseJson<{ explanations: string[] }>(raw);
    return Response.json({ explanations: out.explanations ?? [] });
  } catch {
    return Response.json({ explanations: [] });
  }
}
