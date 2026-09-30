"use client";
import Link from "next/link";
import { usePeople } from "@/lib/usePeople";
import { Avatar, btn, btnGhost, Card, Confidence, InferredList, SourceBadge } from "./ui";
import NotFound from "./NotFound";

export default function ProfileView({ id }: { id: string }) {
  const { get, ready, people } = usePeople();
  const p = get(id);
  if (!p) return <NotFound ready={ready} />;
  const pr = p.profile;
  const limited = p.extraction?.status === "limited" || p.extraction?.status === "failed";
  const other = people.find((x) => x.id !== p.id)!;

  return (
    <div className="rise pt-8">
      <Card className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar person={p} size={96} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight">{p.name}</h1>
            {p.demo && <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-300">Fictional demo persona</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
            {p.linkedinUrl ? <a href={p.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-white">LinkedIn ↗</a> : <span className="text-zinc-600">No LinkedIn link</span>}
            {p.instagramUrl ? <a href={p.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-white">Instagram ↗</a> : <span className="text-zinc-600">No Instagram link</span>}
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/rankings/${p.id}`} className={btn}>See best matches</Link>
          <Link href={`/date/${p.id}/${other.id}`} className={btnGhost}>Random date</Link>
        </div>
      </Card>

      {limited && (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
          We could only retrieve limited public information from this profile.
          {p.extraction?.notes.filter((n) => !n.startsWith("We could only")).map((n) => <div key={n} className="mt-1 text-xs text-amber-200/70">{n}</div>)}
        </div>
      )}

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">About</h2>
          <span className="flex items-center gap-2"><Confidence value={pr.summaryConfidence} /><SourceBadge source={pr.summarySource} /></span>
        </div>
        <p className="mt-3 text-lg leading-relaxed text-zinc-200">{pr.summary}</p>
        <p className="mt-3 text-xs text-zinc-600">AI-inferred from public LinkedIn and Instagram content only. Treat as tentative, not fact.</p>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InferredList title="Interests" hint="Likely interested in…" items={pr.interests} />
        <InferredList title="Hobbies" hint="Appears to enjoy…" items={pr.hobbies} />
        <InferredList title="Values" hint="Public content suggests…" items={pr.values} />
        <InferredList title="Conversation topics" hint="Could light up when talking about…" items={pr.conversationTopics} />
        <InferredList title="Lifestyle signals" hint="Public content hints at…" items={pr.lifestyleSignals} />
        <InferredList title="What energizes them" hint="Seems energized by…" items={pr.energizers} />
        <div className="md:col-span-2"><InferredList title="Potential compatibility strengths" hint="May pair well with people who…" items={pr.compatibilitySignals} /></div>
      </div>
    </div>
  );
}
