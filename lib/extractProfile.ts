// Public-page extraction. Only fetches the two URLs the user supplied, without
// logging in, using cookies, or circumventing any access restriction. If a
// platform serves a login wall / block, we report "limited" and never invent data.
export interface PlatformExtraction {
  platform: "linkedin" | "instagram";
  url: string | null;
  status: "ok" | "limited" | "failed" | "skipped";
  fields: Record<string, string>;
  note?: string;
}

export interface ExtractionResult {
  status: "ok" | "limited" | "failed";
  name: string | null;
  extractedFields: { linkedin: Record<string, string>; instagram: Record<string, string> };
  text: string;
  notes: string[];
  platforms: PlatformExtraction[];
}

export const LIMITED_MESSAGE =
  "We could only retrieve limited public information from this profile.";

const HOSTS = {
  linkedin: /^(?:[a-z]{2,3}\.)?linkedin\.com$|^www\.linkedin\.com$/i,
  instagram: /^(?:www\.)?instagram\.com$/i,
};

export function validateUrl(raw: string, platform: "linkedin" | "instagram"): URL | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!HOSTS[platform].test(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&#x27;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#064;/g, "@")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/\s+/g, " ").trim();
}

function meta(html: string, key: string): string | null {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i");
  const m = html.match(re1) ?? html.match(re2);
  return m ? decode(m[1]) : null;
}

const LOGIN_WALL = /(sign in|log in|login|join now|authwall|challenge)/i;

async function fetchHtml(url: string): Promise<{ html: string; status: number; finalUrl: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AgentDateBot/0.1; public-metadata-only)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    const html = (await res.text()).slice(0, 600_000);
    return { html, status: res.status, finalUrl: res.url };
  } finally {
    clearTimeout(t);
  }
}

/** Optional: render with Playwright if installed and ENABLE_PLAYWRIGHT=1 (public, logged-out only). */
async function renderWithPlaywright(url: string): Promise<string | null> {
  if (process.env.ENABLE_PLAYWRIGHT !== "1") return null;
  try {
    const name = "playwright";
    const pw = await import(/* webpackIgnore: true */ name);
    const browser = await pw.chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 });
      return (await page.content()) as string;
    } finally {
      await browser.close();
    }
  } catch {
    return null;
  }
}

function jsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const v = JSON.parse(m[1]);
      (Array.isArray(v) ? v : v["@graph"] ?? [v]).forEach((x: Record<string, unknown>) => out.push(x));
    } catch {}
  }
  return out;
}

function parseLinkedIn(html: string, url: string): PlatformExtraction {
  const fields: Record<string, string> = {};
  const title = meta(html, "og:title");
  const desc = meta(html, "og:description") ?? meta(html, "description");
  const ld = jsonLd(html).find((x) => x["@type"] === "Person") as Record<string, unknown> | undefined;
  const blocked = !title || LOGIN_WALL.test(title ?? "") && !desc;

  if (ld) {
    if (typeof ld.name === "string") fields.name = decode(ld.name);
    if (typeof ld.jobTitle === "string") fields.headline = decode(ld.jobTitle);
    if (typeof ld.description === "string") fields.about = decode(ld.description);
    const worksFor = ld.worksFor as { name?: string }[] | { name?: string } | undefined;
    const org = Array.isArray(worksFor) ? worksFor.map((w) => w.name).filter(Boolean).join(", ") : worksFor?.name;
    if (org) fields.organizations = org;
  }
  if (title && !blocked) {
    const [nm, ...rest] = title.replace(/\s*\|\s*LinkedIn.*$/i, "").split(" - ");
    fields.name ??= nm.trim();
    if (rest.length) fields.headline ??= rest.join(" - ").trim();
  }
  if (desc && !blocked) fields.description = desc;

  const useful = Object.keys(fields).length > 0;
  return {
    platform: "linkedin", url, fields, status: useful ? (fields.about || fields.description ? "ok" : "limited") : "limited",
    note: useful ? undefined : "LinkedIn returned a sign-in wall or no public metadata.",
  };
}

function parseInstagram(html: string, url: string): PlatformExtraction {
  const fields: Record<string, string> = {};
  const title = meta(html, "og:title");
  const desc = meta(html, "og:description") ?? meta(html, "description");
  const blocked = (!title && !desc) || (title && /^Instagram$/i.test(title.trim()) && !desc);
  if (!blocked) {
    if (title) fields.displayName = title.replace(/\s*[•·(@].*$/, "").trim() || title;
    if (desc) {
      fields.metadata = desc;
      const bio = desc.match(/on Instagram:\s*["“]?(.+?)["”]?$/i);
      if (bio) fields.bio = bio[1];
    }
    const captions = [...html.matchAll(/"caption":\{"text":"((?:[^"\\]|\\.)*)"/g)]
      .slice(0, 8).map((m) => { try { return JSON.parse(`"${m[1]}"`) as string; } catch { return ""; } }).filter(Boolean);
    if (captions.length) fields.captions = captions.join(" || ");
  }
  const useful = Object.keys(fields).length > 0;
  return {
    platform: "instagram", url, fields, status: useful ? (fields.captions || fields.bio ? "ok" : "limited") : "limited",
    note: useful ? undefined : "Instagram returned a login wall or no public metadata.",
  };
}

async function extractOne(platform: "linkedin" | "instagram", raw: string | null): Promise<PlatformExtraction> {
  if (!raw?.trim()) return { platform, url: null, status: "skipped", fields: {} };
  const u = validateUrl(raw, platform);
  if (!u) return { platform, url: raw, status: "failed", fields: {}, note: `Not a valid ${platform} URL.` };
  try {
    let { html, status } = await fetchHtml(u.toString());
    let parsed = platform === "linkedin" ? parseLinkedIn(html, u.toString()) : parseInstagram(html, u.toString());
    if (Object.keys(parsed.fields).length === 0) {
      const rendered = await renderWithPlaywright(u.toString());
      if (rendered) parsed = platform === "linkedin" ? parseLinkedIn(rendered, u.toString()) : parseInstagram(rendered, u.toString());
    }
    if (status >= 400 && Object.keys(parsed.fields).length === 0) {
      parsed.note = `${platform} responded with HTTP ${status} to logged-out access.`;
    }
    return parsed;
  } catch (e) {
    return { platform, url: u.toString(), status: "failed", fields: {}, note: `Request failed: ${(e as Error).message}` };
  }
}

export function nameFromUrls(linkedin: string | null, instagram: string | null): string | null {
  const li = linkedin && validateUrl(linkedin, "linkedin")?.pathname.match(/\/in\/([^/]+)/)?.[1];
  const ig = instagram && validateUrl(instagram, "instagram")?.pathname.split("/").filter(Boolean)[0];
  const slug = li || ig;
  if (!slug) return null;
  const words = decodeURIComponent(slug).replace(/[-_.]+/g, " ").replace(/\d+/g, "").trim();
  return words ? words.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}

export async function extractProfile(linkedinUrl: string | null, instagramUrl: string | null): Promise<ExtractionResult> {
  const [li, ig] = await Promise.all([extractOne("linkedin", linkedinUrl), extractOne("instagram", instagramUrl)]);
  const notes = [li, ig].filter((p) => p.note).map((p) => p.note!);

  const lines: string[] = [];
  if (Object.keys(li.fields).length) {
    lines.push("=== LINKEDIN (public) ===");
    for (const [k, v] of Object.entries(li.fields)) lines.push(`${k}: ${v}`);
  }
  if (Object.keys(ig.fields).length) {
    lines.push("=== INSTAGRAM (public) ===");
    for (const [k, v] of Object.entries(ig.fields)) lines.push(`${k}: ${v}`);
  }
  const text = lines.join("\n");
  const anyOk = [li, ig].some((p) => p.status === "ok");
  const anyContent = text.length > 0;
  const status = anyOk && [li, ig].every((p) => p.status === "ok" || p.status === "skipped") ? "ok" : anyContent ? "limited" : "failed";

  return {
    status: status === "failed" ? "limited" : status, // spec: clearly return "limited" when extraction can't get full data
    name: li.fields.name ?? ig.fields.displayName ?? nameFromUrls(linkedinUrl, instagramUrl),
    extractedFields: { linkedin: li.fields, instagram: ig.fields },
    text,
    notes: status === "ok" ? notes : [LIMITED_MESSAGE, ...notes],
    platforms: [li, ig],
  };
}
