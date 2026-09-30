"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { readNdjson } from "@/lib/stream";
import { saveCustomPerson } from "@/lib/usePeople";
import { btn } from "./ui";

export default function BuildForm() {
  const router = useRouter();
  const [li, setLi] = useState("");
  const [ig, setIg] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setLog([]);
    try {
      const res = await fetch("/api/build", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ linkedinUrl: li, instagramUrl: ig }) });
      let person = null;
      await readNdjson(res, (ev) => {
        if (ev.type === "status") setLog((l) => [...l, ev.text]);
        if (ev.type === "error") throw new Error(ev.message);
        if (ev.type === "result") person = ev.person;
      });
      if (!person) throw new Error("No agent returned.");
      saveCustomPerson(person);
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/profile/${(person as { id: string }).id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  const input = "w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-white/40";
  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-xl space-y-3 text-left">
      <input className={input} placeholder="LinkedIn URL — https://www.linkedin.com/in/..." value={li} onChange={(e) => setLi(e.target.value)} disabled={busy} required />
      <input className={input} placeholder="Public Instagram URL — https://www.instagram.com/..." value={ig} onChange={(e) => setIg(e.target.value)} disabled={busy} required />
      <button className={`${btn} w-full`} disabled={busy}>{busy ? "Building…" : "Build my agent"}</button>
      {(busy || log.length > 0) && (
        <ul className="space-y-1.5 pt-2 text-sm">
          {log.map((l, i) => (
            <li key={i} className={`rise flex items-center gap-2 ${i === log.length - 1 && busy ? "text-white" : "text-zinc-500"}`}>
              <span>{i === log.length - 1 && busy ? "◌" : "✓"}</span>{l}
            </li>
          ))}
        </ul>
      )}
      {err && <p className="text-sm text-red-400">{err}</p>}
      <p className="pt-1 text-center text-xs text-zinc-600">Only publicly visible content is read. Nothing is stored on our servers.</p>
    </form>
  );
}
