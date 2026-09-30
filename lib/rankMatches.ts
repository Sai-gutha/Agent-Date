import type { Person, RankedMatch } from "./types";
import { sharedItems } from "./text";

const W = { interests: 0.3, values: 0.25, lifestyle: 0.2, conversation: 0.15, complementary: 0.1 };
const txt = (xs: { text: string }[]) => xs.map((x) => x.text);

/** Normalized 0..1 overlap: matched items / sqrt(|A|*|B|). */
function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const m = Math.max(sharedItems(a, b).length, sharedItems(b, a).length);
  return Math.min(1, m / Math.sqrt(a.length * b.length));
}

export function scorePair(a: Person, b: Person) {
  const pa = a.profile, pb = b.profile;
  const interestsA = [...txt(pa.interests), ...txt(pa.hobbies)];
  const interestsB = [...txt(pb.interests), ...txt(pb.hobbies)];
  const breakdown = {
    interests: overlap(interestsA, interestsB),
    values: overlap(txt(pa.values), txt(pb.values)),
    lifestyle: overlap(txt(pa.lifestyleSignals), txt(pb.lifestyleSignals)),
    // A's conversation topics resonate with B's interests, and vice versa
    conversation: (overlap(txt(pa.conversationTopics), [...interestsB, ...txt(pb.conversationTopics)]) +
      overlap(txt(pb.conversationTopics), [...interestsA, ...txt(pa.conversationTopics)])) / 2,
    // A's energizers/compat signals meet B's values/lifestyle (what each brings to the other)
    complementary: (overlap(txt(pa.compatibilitySignals), [...txt(pb.energizers), ...txt(pb.lifestyleSignals), ...txt(pb.values)]) +
      overlap(txt(pb.compatibilitySignals), [...txt(pa.energizers), ...txt(pa.lifestyleSignals), ...txt(pa.values)])) / 2,
  };
  const raw =
    breakdown.interests * W.interests + breakdown.values * W.values + breakdown.lifestyle * W.lifestyle +
    breakdown.conversation * W.conversation + breakdown.complementary * W.complementary;
  // Display calibration: raw overlaps of free-text tags are sparse, so map 0..0.6 → 42..97.
  const score = Math.round(42 + 55 * Math.min(1, raw / 0.6));
  const shared = Array.from(new Set(sharedItems(interestsA, interestsB)));
  return { raw, score, breakdown, shared };
}

export function explain(a: Person, b: Person, shared: string[], breakdown: Record<string, number>): string {
  const first = b.name.split(" ")[0];
  const bits: string[] = [];
  if (shared.length) bits.push(`public content suggests a shared interest in ${shared.slice(0, 3).join(", ")}`);
  if (breakdown.values > 0.3) bits.push("overlapping values");
  if (breakdown.lifestyle > 0.3) bits.push("similar lifestyle signals");
  if (!bits.length) return `${first} looks like a different-paced match; complementary interests may make for fresh conversation.`;
  return `${first} and ${a.name.split(" ")[0]} share ${bits.join(" and ")}.`;
}

export function rankMatches(person: Person, all: Person[]): RankedMatch[] {
  return all
    .filter((p) => p.id !== person.id)
    .map((p) => {
      const { raw, score, breakdown, shared } = scorePair(person, p);
      return { person: p, raw, score, breakdown, sharedInterests: shared, explanation: explain(person, p, shared, breakdown) };
    })
    .sort((x, y) => y.raw - x.raw);
}
