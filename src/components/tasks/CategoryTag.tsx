export default function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-700/60 dark:text-slate-300 dark:ring-slate-500/40">
      {label}
    </span>
  );
}
