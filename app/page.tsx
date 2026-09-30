import AgentGrid from "@/components/AgentGrid";
import BuildForm from "@/components/BuildForm";

export default function Home() {
  return (
    <>
      <div className="glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px]" />
      <section className="pt-16 text-center sm:pt-24">
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">Your agent dates before you do.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Give us your LinkedIn and Instagram. We build your agent, let it meet other agents, and rank your strongest connections.
        </p>
        <BuildForm />
      </section>
      <AgentGrid />
    </>
  );
}
