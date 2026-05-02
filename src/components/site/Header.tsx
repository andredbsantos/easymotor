import Link from "next/link";
import type { Language } from "@/lib/types";
import { languages } from "@/lib/types";

export function Header({
  lang,
  pathParts = [],
}: {
  lang: Language;
  pathParts?: string[];
}) {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="text-lg font-bold tracking-tight" href={`/${lang}`}>
          Easymotor
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {languages.map((code) => (
            <Link
              className={`rounded-full px-3 py-1 ${
                code === lang
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
              href={`/${[code, ...pathParts].filter(Boolean).join("/")}`}
              key={code}
            >
              {code.toUpperCase()}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
