export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      {message}
    </div>
  );
}
