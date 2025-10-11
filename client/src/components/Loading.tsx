export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
      <div className="mt-4 h-24 w-full animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="h-40 animate-pulse rounded-lg bg-muted md:col-span-2" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    </main>
  )
}
