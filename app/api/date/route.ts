import { z } from "zod";
import { evaluate, nextTurn } from "@/lib/runAgentDate";
import { ndjson } from "@/lib/stream";
import { PersonSchema, type Turn } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const parsed = z.object({ a: PersonSchema, b: PersonSchema }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const { a, b } = parsed.data;
  return ndjson(async (send) => {
    const convo: Turn[] = [];
    for (let i = 0; i < 6; i++) {
      const speaker = i % 2 === 0 ? "A" : "B";
      send({ type: "thinking", speaker });
      const t = await nextTurn(a, b, convo);
      convo.push(t);
      send({ type: "turn", turn: t });
    }
    send({ type: "evaluating" });
    send({ type: "result", date: await evaluate(a, b, convo) });
  });
}
