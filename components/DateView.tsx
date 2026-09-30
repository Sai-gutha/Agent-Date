"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { readNdjson } from "@/lib/stream";
import { cacheDate, getCachedDate, usePeople } from "@/lib/usePeople";
import type { AgentDate, Turn } from "@/lib/types";
import { Avatar, btn, btnGhost, Card, Pill } from "./ui";
import NotFound from "./NotFound";

export default function DateView({ aId, bId }: { aId: string; bId: string }) {
  const { get, ready } = usePeople();
  const a = get(aId), b = get(bId);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState<"A" | "B" | "eval" | null>(null);
  const [result, setResult] = useState<AgentDate | null>(null);
  const [err, setErr] = useState("");
  const run = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  const start = useCallback(async (fresh: boolean) => {
    if (!a || !b) return;
    const my = ++run.current;
    setTurns([]); setResult(null); setErr(""); setThinking("A");
    const cached = fresh ? null : getCachedDate(a.id, b.id);
    if (cached) {
      // replay cached conversation with pacing so it's still watchable
      for (const t of cached.conversation) {
        setThinking(t.speaker);
        await new Promise((r) => setTimeout(r, 900));
        if (run.current !== my) return;
        setTurns((x) => [...x, t]);
      }
      setThinking(null); setResult(cached);
      return;
    }
    try {
      const res = await fetch("/api/date", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ a, b }) });
      if (!res.ok) throw new Error("Date request failed.");
      await readNdjson(res, async (ev) => {
        if (run.current !== my) return;
        if (ev.type === "thinking") setThinking(ev.speaker);
        if (ev.type === "turn") setTurns((x) => [...x, ev.turn]);
        if (ev.type === "evaluating") setThinking("eval");
        if (ev.type === "result") { setResult(ev.date); setThinking(null); cacheDate(a.id, b.id, ev.date); }
        if (ev.type === "error") throw new Error(ev.message);
      });
    } catch (e) { setErr((e as Error).message); setThinking(null); }
  }, [a, b]);

  useEffect(() => { if (ready) start(false); }, [ready, start]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [turns, thinking, result]);

  if (!a || !b) return <NotFound ready={ready} />;
  const name = (s: "A" | "B") => (s === "A" ? a : b);

  return (
    <div className="rise pt-8">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className="relative flex h-2 w-2"><span className="absolute h-2 w-2 animate-ping rounded-full bg-red-500/70" /><span className="h-2 w-2 rounded-full bg-red-500" /></span>
        AgentDate Live
      </div>
      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {[a, b].map((p, i) => (
          <Link key={p.id} href={`/profile/${p.id}`} className={`flex items-center gap-3 ${i ? "flex-row-reverse text-right" : ""}`}>
            <Avatar person={p} size={56} />
            <div><div className="text-xl font-semibold tracking-tight">{p.name}</div><div className="text-xs text-zinc-500">{p.name.split(" ")[0]}&apos;s Agent</div></div>
          </Link>
        ))}
        <span className="order-none col-start-2 row-start-1 text-sm text-zinc-600">vs</span>
      </div>

      <Card className="mt-8 space-y-4">
        {turns.map((t, i) => (
          <div key={i} className={`rise flex gap-3 ${t.speaker === "B" ? "flex-row-reverse" : ""}`}>
            <Avatar person={name(t.speaker)} size={32} />
            <div className={`max-w-[80%] rounded-3xl px-5 py-3 text-[15px] leading-relaxed ${t.speaker === "A" ? "rounded-tl-md bg-white/10" : "rounded-tr-md bg-white text-black"}`}>
              <div className={`mb-0.5 text-[10px] font-medium uppercase tracking-wider ${t.speaker === "A" ? "text-zinc-500" : "text-zinc-500"}`}>{name(t.speaker).name.split(" ")[0]}&apos;s Agent</div>
              {t.text}
            </div>
          </div>
        ))}
        {(thinking === "A" || thinking === "B") && (
          <div className={`flex items-center gap-3 text-sm text-zinc-500 ${thinking === "B" ? "flex-row-reverse" : ""}`}>
            <Avatar person={name(thinking)} size={32} />
            <span>{turns.length === 0 || thinking === "A" ? `${name(thinking).name.split(" ")[0]}'s agent is thinking` : `${name(thinking).name.split(" ")[0]}'s agent is responding`}</span>
            <span className="flex gap-1"><i className="dot h-1.5 w-1.5 rounded-full bg-zinc-400" /><i className="dot h-1.5 w-1.5 rounded-full bg-zinc-400" /><i className="dot h-1.5 w-1.5 rounded-full bg-zinc-400" /></span>
          </div>
        )}
        {thinking === "eval" && <div className="text-sm text-zinc-400">Evaluating compatibility…</div>}
        {err && <div className="text-sm text-red-400">{err}</div>}
        <div ref={end} />
      </Card>

      {result && (
        <div className="rise mt-6 space-y-4">
          <Card className="text-center">
            <div className="text-sm text-zinc-500">Compatibility score</div>
            <div className="mt-1 text-7xl font-semibold tracking-tight">{result.compatibilityScore}<span className="text-3xl text-zinc-500">%</span></div>
            <p className="mx-auto mt-3 max-w-xl text-zinc-300">{result.verdict}</p>
            <div className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm">
              Would they meet again? <b className="ml-2">{result.meetAgain ? "Likely yes" : "Probably not yet"}</b>
            </div>
            {result.mode === "offline" && <p className="mt-3 text-xs text-amber-300/80">Offline simulation: no LLM key configured, so dialogue is template-based from structured profiles.</p>}
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <ListCard title="Shared interests"><div className="flex flex-wrap gap-2">{result.sharedInterests.length ? result.sharedInterests.map((s) => <Pill key={s}>{s}</Pill>) : <span className="text-sm text-zinc-500">None found in public content</span>}</div></ListCard>
            <ListCard title="Topics they naturally connected on"><div className="flex flex-wrap gap-2">{result.naturalTopics.map((s) => <Pill key={s}>{s}</Pill>)}</div></ListCard>
            <ListCard title="Strong connection points"><ul className="list-disc space-y-1 pl-4 text-sm text-zinc-300">{result.strengths.map((s) => <li key={s}>{s}</li>)}</ul></ListCard>
            <ListCard title="Possible friction"><ul className="list-disc space-y-1 pl-4 text-sm text-zinc-300">{result.friction.map((s) => <li key={s}>{s}</li>)}</ul></ListCard>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button className={btn} onClick={() => start(true)}>Run another date</button>
            <Link className={btnGhost} href={`/rankings/${a.id}`}>{a.name.split(" ")[0]}&apos;s rankings</Link>
            <Link className={btnGhost} href={`/rankings/${b.id}`}>{b.name.split(" ")[0]}&apos;s rankings</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ListCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</Card>;
}
