// Belt-and-braces filter: drop inferred items touching sensitive characteristics.
const SENSITIVE =
  /\b(christian|muslim|islam|hindu|jewish|judaism|buddhist|sikh|atheis\w*|religio\w*|church|mosque|temple|faith|race|racial|ethnic\w*|black|white|asian|latino|latina|gay|lesbian|bisexual|queer|lgbt\w*|transgender|sexual orientation|straight|republican|democrat\w*|conservative|liberal|political\w*|politics|left-wing|right-wing|cancer|diabet\w*|depress\w*|anxiety|disorder|disabilit\w*|diagnos\w*|illness|medical|pregnan\w*)\b/i;

export const isSensitive = (s: string) => SENSITIVE.test(s);
export const scrub = <T extends { text: string }>(items: T[]) => items.filter((i) => !isSensitive(i.text));
