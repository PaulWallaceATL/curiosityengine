import EmailDrafter from "@/components/EmailDrafter";
import TaskQuickCreate from "@/components/TaskQuickCreate";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-zinc-950 to-black">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[80rem] rounded-full bg-gradient-to-r from-indigo-600/30 to-cyan-500/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/30">Preview</span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Sales Curiosity</h1>
              <p className="mt-2 max-w-xl text-sm text-zinc-300">Craft compelling outreach with LinkedIn context and your voice. Manage tasks that sync to your admin workspace.</p>
            </div>
            <a href="/admin" className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg hover:shadow-indigo-500/10 active:translate-y-0">Go to Admin →</a>
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Drafter */}
          <div className="card-surface lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur transition hover:shadow-xl hover:shadow-indigo-500/10 dark:border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-white">Draft personalized email from LinkedIn</h2>
              <span className="text-xs text-zinc-400">AI-assisted</span>
            </div>
            <p className="mb-3 text-xs text-zinc-300">Paste a LinkedIn profile URL and describe your personal context. We’ll enrich with profile details when possible.</p>
            <EmailDrafter />
          </div>

          {/* Quick task */}
          <div className="card-surface rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur transition hover:shadow-xl hover:shadow-indigo-500/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-white">Quick task</h2>
              <span className="text-xs text-zinc-400">Dashboard sync</span>
            </div>
            <TaskQuickCreate />
            <p className="mt-4 text-[11px] leading-5 text-zinc-400">Tasks appear instantly in your Admin workspace. Use this for research, briefings, and email tasks.</p>
          </div>
        </div>
      </section>
    </main>
  );
}


