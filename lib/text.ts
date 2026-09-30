const STOP = new Set(["the", "and", "of", "for", "with", "in", "on", "to", "a", "an", "at", "from", "new", "good", "likes", "enjoys", "loves", "into", "values", "time"]);

export function stem(w: string) {
  return w.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(ing|ers|er|es|s|ed|y)$/, "");
}
export function tokens(s: string): Set<string> {
  return new Set(s.split(/[\s,/&-]+/).map(stem).filter((w) => w.length > 2 && !STOP.has(w)));
}
export function itemsOverlap(a: string, b: string): boolean {
  const ta = tokens(a), tb = tokens(b);
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}
/** Items of `a` that have a match in `b` (returns a's text). */
export function sharedItems(a: string[], b: string[]): string[] {
  return a.filter((x) => b.some((y) => itemsOverlap(x, y)));
}
export function hash(s: string) {
  return [...s].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
}
