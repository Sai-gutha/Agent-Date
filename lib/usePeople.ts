"use client";
import { useCallback, useEffect, useState } from "react";
import seed from "@/data/people.json";
import type { AgentDate, Person } from "./types";

export const SEED = seed as unknown as Person[];
const KEY = "agentdate.custom";
const DKEY = "agentdate.dates";

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}

export function saveCustomPerson(p: Person) {
  try {
    const cur = read<Person[]>(KEY, []).filter((x) => x.id !== p.id);
    localStorage.setItem(KEY, JSON.stringify([p, ...cur]));
  } catch {}
}

export function usePeople() {
  const [custom, setCustom] = useState<Person[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { setCustom(read<Person[]>(KEY, [])); setReady(true); }, []);
  const people = [...custom, ...SEED];
  const get = useCallback((id: string) => people.find((p) => p.id === id), [custom]); // eslint-disable-line react-hooks/exhaustive-deps
  return { people, custom, get, ready };
}

export const dateKey = (a: string, b: string) => `${a}__${b}`;
export function getCachedDate(a: string, b: string): AgentDate | null {
  return read<Record<string, AgentDate>>(DKEY, {})[dateKey(a, b)] ?? null;
}
export function cacheDate(a: string, b: string, d: AgentDate) {
  try {
    const all = read<Record<string, AgentDate>>(DKEY, {});
    all[dateKey(a, b)] = d;
    localStorage.setItem(DKEY, JSON.stringify(all));
  } catch {}
}
