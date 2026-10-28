/** Stand-in for a screen that has not been built yet. Remove per route as screens land. */
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <section>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">This screen has not been built yet.</p>
    </section>
  )
}
