import type { Inferred, Person, Source } from "@/lib/types";
import { hash } from "@/lib/text";

export function Avatar({ person, size = 48 }: { person: Pick<Person, "name" | "avatar" | "id">; size?: number }) {
  const hue = hash(person.id) % 360;
  const initials = person.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (person.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={person.avatar} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white/90"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${hue} 55% 38%), hsl(${(hue + 50) % 360} 60% 24%))` }}
    >
      {initials}
    </div>
  );
}

const SRC: Record<Source, string> = {
  LinkedIn: "bg-sky-500/15 text-sky-300 ring-sky-400/20",
  Instagram: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/20",
  Both: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
};
export function SourceBadge({ source }: { source: Source }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${SRC[source]}`}>{source}</span>;
}

export function Confidence({ value }: { value: number }) {
  const label = value >= 0.75 ? "High" : value >= 0.5 ? "Medium" : "Low";
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500" title={`Confidence ${Math.round(value * 100)}%`}>
      <span className="h-1 w-8 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full rounded-full bg-white/70" style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      {label}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 ${className}`}>{children}</div>;
}

export function InferredList({ title, hint, items }: { title: string; hint: string; items: Inferred[] }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Not enough public information available.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.text} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm capitalize text-zinc-200">{i.text}</span>
              <span className="flex items-center gap-2"><Confidence value={i.confidence} /><SourceBadge source={i.source} /></span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs capitalize text-zinc-300">{children}</span>;
}

export const btn = "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10";
