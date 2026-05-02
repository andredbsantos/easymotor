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
    <header>
      <div className="h-[3px] bg-red-700" />
      <div className="bg-white border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
          <Link
            className="text-xl font-bold tracking-tight text-neutral-900 hover:text-red-700 transition-colors"
            href={`/${lang}`}
          >
            Easymotor
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            {languages.map((code) => (
              <Link
                className={`transition-colors ${
                  code === lang
                    ? "text-red-700 underline underline-offset-4 decoration-red-700"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                href={`/${[code, ...pathParts].filter(Boolean).join("/")}`}
                key={code}
              >
                {code.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
