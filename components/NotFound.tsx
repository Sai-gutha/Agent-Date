import Link from "next/link";
export default function NotFound({ ready }: { ready: boolean }) {
  return (
    <div className="py-32 text-center text-zinc-400">
      {ready ? <>Agent not found. Custom agents live in your browser only. <Link href="/" className="text-white underline">Go home</Link></> : "Loading…"}
    </div>
  );
}
