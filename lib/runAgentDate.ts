import { complete, parseJson, llmProvider } from "./llm";
import { scorePair } from "./rankMatches";
import { hash } from "./text";
import { EvaluationSchema, type AgentDate, type Person, type Turn } from "./types";

const TURNS = 6;

const SYSTEM_PREFIX =
  "You represent this person during a simulated first date. You know only the information in their LinkedIn and Instagram-derived profile. Be curious and conversational. Do not invent private facts.";

function card(p: Person) {
  const f = (xs: { text: string }[]) => xs.map((x) => x.text).join("; ") || "(none)";
  return `Name: ${p.name}
Summary: ${p.profile.summary}
Interests: ${f(p.profile.interests)}
Hobbies: ${f(p.profile.hobbies)}
Values: ${f(p.profile.values)}
Conversation topics: ${f(p.profile.conversationTopics)}
Lifestyle signals: ${f(p.profile.lifestyleSignals)}
Energizers: ${f(p.profile.energizers)}`;
}

function system(me: Person, other: Person) {
  return `${SYSTEM_PREFIX}

You are ${me.name}'s agent. Your person's profile:
${card(me)}

You are on a date with ${other.name}'s agent. Their profile:
${card(other)}

Rules: reply in 1-3 sentences, first person as ${me.name.split(" ")[0]}, natural and warm. Only reference facts in the profiles, tentatively where inferred. Never mention religion, race, ethnicity, sexual orientation, health, or politics. Output just your next line, no prefix.`;
}

export async function nextTurn(a: Person, b: Person, history: Turn[]): Promise<Turn> {
  const speaker: "A" | "B" = history.length % 2 === 0 ? "A" : "B";
  const me = speaker === "A" ? a : b, other = speaker === "A" ? b : a;
  if (!llmProvider()) return { speaker, text: offlineLine(me, other, history.length) };
  // From this agent's perspective: its own lines are "assistant", the other's are "user".
  const msgs = history.map((t) => ({ role: (t.speaker === speaker ? "assistant" : "user") as "assistant" | "user", content: t.text }));
  if (!msgs.length || msgs[0].role !== "user") msgs.unshift({ role: "user", content: "(The date begins. Open with a friendly, curious first line.)" });
  // merge consecutive same-role (defensive)
  const merged: typeof msgs = [];
  for (const m of msgs) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n" + m.content; else merged.push({ ...m });
  }
  if (merged[merged.length - 1].role !== "user") merged.push({ role: "user", content: "(Your turn.)" });
  const text = (await complete({ system: system(me, other), messages: merged, maxTokens: 200 })).trim().replace(/^["“]|["”]$/g, "");
  return { speaker, text };
}

export async function evaluate(a: Person, b: Person, conversation: Turn[]): Promise<AgentDate> {
  const base = scorePair(a, b);
  if (llmProvider()) {
    try {
      const raw = await complete({
        system: `You evaluate a simulated first date between two agents, using ONLY the two profiles and the transcript. Do not use outside knowledge and never reference sensitive characteristics (religion, race, ethnicity, sexual orientation, health, politics). Return ONLY JSON: {"compatibilityScore":0-100,"sharedInterests":[],"strengths":[],"friction":[],"naturalTopics":[],"meetAgain":boolean,"verdict":"one or two sentences, tentative wording"}. Use 2-4 items per list. Be honest: include realistic friction.`,
        messages: [{
          role: "user",
          content: `PERSON A\n${card(a)}\n\nPERSON B\n${card(b)}\n\nTRANSCRIPT\n${conversation.map((t) => `${t.speaker === "A" ? a.name : b.name}: ${t.text}`).join("\n")}\n\nStructured overlap baseline: ${Math.round(base.score)}/100.`,
        }],
        maxTokens: 900,
        json: true,
      });
      const ev = EvaluationSchema.parse(parseJson(raw));
      return { personA: a.id, personB: b.id, conversation, mode: "llm", ...ev, compatibilityScore: Math.round(ev.compatibilityScore) };
    } catch {
      /* fall through to structured evaluation */
    }
  }
  return offlineEvaluation(a, b, conversation);
}

function offlineEvaluation(a: Person, b: Person, conversation: Turn[]): AgentDate {
  const { score, shared, breakdown } = scorePair(a, b);
  const vals = a.profile.values.map((v) => v.text).filter((v) => b.profile.values.some((w) => w.text === v));
  const a1 = a.name.split(" ")[0], b1 = b.name.split(" ")[0];
  const strengths = [
    shared.length ? `Public content suggests shared interest in ${shared.slice(0, 3).join(", ")}` : "Different interests could keep conversation fresh",
    vals.length ? `Overlapping values: ${vals.join(", ")}` : "Values look complementary rather than identical",
  ];
  const friction = [
    breakdown.lifestyle < 0.25 ? "Lifestyle rhythms may differ" : "Similar routines could leave less novelty",
    shared.length < 2 ? "Few overlapping interests in public content" : "Limited public data, so this is tentative",
  ];
  return {
    personA: a.id, personB: b.id, conversation, mode: "offline",
    compatibilityScore: score,
    sharedInterests: shared,
    strengths, friction,
    naturalTopics: shared.length ? shared.slice(0, 3) : a.profile.conversationTopics.slice(0, 2).map((t) => t.text),
    meetAgain: score >= 65,
    verdict: `Offline structured evaluation (no LLM key configured): ${a1} and ${b1} ${score >= 65 ? "appear likely to enjoy a second date" : "may find it a slower start"}.`,
  };
}

/** Deterministic template dialogue so the demo works with no API key. */
function offlineLine(me: Person, other: Person, turn: number): string {
  const { shared } = scorePair(me, other);
  const myTopics = me.profile.conversationTopics.map((t) => t.text);
  const theirInterests = [...other.profile.interests, ...other.profile.hobbies].map((t) => t.text);
  const pick = <T,>(xs: T[], salt = 0) => xs[(hash(me.id + other.id) + salt) % Math.max(1, xs.length)];
  const s = shared[turn % Math.max(1, shared.length)] ?? pick(theirInterests, turn);
  const my = pick(myTopics, turn);
  const oFirst = other.name.split(" ")[0], mFirst = me.name.split(" ")[0];
  const lines = [
    `Hi ${oFirst}! Your public profile suggests you're into ${shared[0] ?? pick(theirInterests)} — what got you started?`,
    `Nice to meet you, ${oFirst}! Honestly ${pick(theirInterests, 3)} is a big one for me. ${shared.length ? `Sounds like we both like ${shared[0]}.` : "What does a great weekend look like for you?"}`,
    `That's a great answer. I'd say I'm energized by ${pick(me.profile.energizers.map((e) => e.text), turn)}. Anything like that for you?`,
    `Definitely something I appreciate — I tend to talk about ${my} way too much. ${shared.length > 1 ? `And ${shared[1]} is another thing we seem to share.` : ""}`,
    `Honestly that's the kind of thing I'd love to do together — maybe something around ${s}?`,
    `I'd like that, ${oFirst}. This was easy to talk to you — let's do it again. — ${mFirst}`,
  ];
  return lines[Math.min(turn, lines.length - 1)].trim();
}

export async function runAgentDate(a: Person, b: Person, onTurn?: (t: Turn) => void): Promise<AgentDate> {
  const conversation: Turn[] = [];
  for (let i = 0; i < TURNS; i++) {
    const t = await nextTurn(a, b, conversation);
    conversation.push(t);
    onTurn?.(t);
  }
  return evaluate(a, b, conversation);
}
