import { analyzePerson, EMPTY_PROFILE } from "@/lib/analyzePerson";
import { extractProfile, LIMITED_MESSAGE, nameFromUrls } from "@/lib/extractProfile";
import { llmProvider } from "@/lib/llm";
import { hash } from "@/lib/text";
import { ndjson } from "@/lib/stream";
import type { Person } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const li: string | null = body.linkedinUrl?.trim() || null;
  const ig: string | null = body.instagramUrl?.trim() || null;
  return ndjson(async (send) => {
    if (!li || !ig) throw new Error("Please provide both a LinkedIn URL and a public Instagram URL.");
    send({ type: "status", text: "Analyzing LinkedIn..." });
    send({ type: "status", text: "Reading Instagram..." });
    const ex = await extractProfile(li, ig);
    send({ type: "status", text: ex.status === "ok" ? "Public content retrieved." : LIMITED_MESSAGE });
    send({ type: "status", text: "Building personality model..." });
    let profile = EMPTY_PROFILE;
    const notes = [...ex.notes];
    if (ex.text) {
      try {
        profile = await analyzePerson(ex.text);
      } catch (e) {
        notes.push(`AI analysis failed: ${(e as Error).message}`);
      }
    } else if (!llmProvider()) {
      notes.push("No LLM key configured.");
    }
    const name = ex.name ?? nameFromUrls(li, ig) ?? "New Agent";
    const person: Person = {
      id: "u-" + hash(li + "|" + ig).toString(36),
      name, linkedinUrl: li, instagramUrl: ig, avatar: null,
      sourceText: ex.text,
      profile,
      extraction: { status: ex.text ? ex.status : "limited", notes },
    };
    send({ type: "status", text: "Agent ready." });
    send({ type: "result", person });
  });
}
