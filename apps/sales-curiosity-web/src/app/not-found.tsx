export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-zinc-950 to-black">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200">
          <span className="size-1.5 rounded-full bg-amber-500" />
          404
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Page not found</h1>
        <p className="max-w-md text-sm text-zinc-300">The page you’re looking for doesn’t exist or has been moved.</p>
        <a href="/" className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10">Go home</a>
      </div>
    </main>
  );
}


