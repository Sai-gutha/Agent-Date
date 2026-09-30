"use client";
import Link from "next/link";
import { usePeople } from "@/lib/usePeople";
import { Avatar, Pill } from "./ui";

export default function AgentGrid() {
  const { people, custom } = usePeople();
  return (
    <section className="mt-24">
      <h2 className="text-3xl font-semibold tracking-tight">{people.length} Agents Ready to Date</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Seeded demo personas are fictional. {custom.length > 0 && `Plus ${custom.length} you built.`}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p, i) => (
          <Link key={p.id} href={`/profile/${p.id}`} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
            className="rise group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06]">
            <div className="flex items-center gap-3">
              <Avatar person={p} />
              <div className="min-w-0">
                <div className="truncate font-medium">{p.name}</div>
                <div className="text-xs text-zinc-500">{p.demo ? "Demo persona" : "Your agent"}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.profile.interests.slice(0, 3).map((i) => <Pill key={i.text}>{i.text}</Pill>)}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
