"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rankMatches } from "@/lib/rankMatches";
import { usePeople } from "@/lib/usePeople";
import { Avatar, Card, Pill } from "./ui";
import NotFound from "./NotFound";

export default function RankingsView({ id }: { id: string }) {
  const { get, people, ready } = usePeople();
  const me = get(id);
  const ranked = useMemo(() => (me ? rankMatches(me, people) : []), [me, people]);
  const [llm, setLlm] = useState<string[]>([]);

  useEffect(() => {
    if (!me || !ranked.length) return;
    const top = ranked.slice(0, 5);
    fetch("/api/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ person: me, matches: top.map((m) => ({ person: m.person, shared: m.sharedInterests })) }) })
      .then((r) => r.json()).then((d) => setLlm(d.explanations ?? [])).catch(() => {});
  }, [me?.id, ranked.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!me) return <NotFound ready={ready} />;
  return (
    <div className="rise pt-8">
      <Link href={`/profile/${me.id}`} className="inline-flex items-center gap-3 text-sm text-zinc-400 hover:text-white"><Avatar person={me} size={28} />{me.name}&apos;s profile</Link>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">Best matches for {me.name.split(" ")[0]}</h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-500">Ranked from structured profile fields: shared interests 30%, values 25%, lifestyle 20%, conversation 15%, complementary traits 10%. Click a match to watch the agents date.</p>
      <div className="mt-8 space-y-3">
        {ranked.map((m, i) => (
          <Link key={m.person.id} href={`/date/${me.id}/${m.person.id}`} style={{ animationDelay: `${Math.min(i, 14) * 25}ms` }}
            className="rise group block rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06]">
            <div className="flex items-center gap-4">
              <div className="w-8 text-center text-2xl font-semibold text-zinc-600">{i + 1}</div>
              <Avatar person={m.person} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-lg font-medium">{m.person.name}</span>
                  <span className="text-2xl font-semibold tabular-nums">{m.score}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${m.score}%` }} /></div>
                <p className="mt-2 text-sm text-zinc-400">{(i < 5 && llm[i]) || m.explanation}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{m.sharedInterests.slice(0, 4).map((s) => <Pill key={s}>{s}</Pill>)}</div>
              </div>
              <span className="hidden text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white sm:block">→</span>
            </div>
          </Link>
        ))}
      </div>
      {!ranked.length && <Card>No other agents yet.</Card>}
    </div>
  );
}
