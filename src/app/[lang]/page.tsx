import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/site/EmptyState";
import { Header } from "@/components/site/Header";
import { LandingFilters } from "@/components/site/LandingFilters";
import { buildPageMetadata, getBrands, getIssues, getModels } from "@/lib/data";
import { isLanguage, languages, localizedValue } from "@/lib/types";

type PageProps = {
  params: Promise<{ lang: string }>;
};

export function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang: rawLang } = await params;

  if (!isLanguage(rawLang)) {
    return {};
  }

  return buildPageMetadata({
    lang: rawLang,
    title: "Car and motorcycle issue solver",
    description:
      "Find known problems, warnings, fixes, and troubleshooting guides by brand and model.",
  });
}

export default async function LanguageHome({ params }: PageProps) {
  const { lang: rawLang } = await params;

  if (!isLanguage(rawLang)) {
    notFound();
  }

  const [brands, models, issues] = await Promise.all([
    getBrands(),
    getModels(),
    getIssues(),
  ]);

  return (
    <>
      <Header lang={rawLang} />
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <section className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Easymotor
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Car and motorcycle issue solving, built for search.
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Browse known issues by brand and model, then jump into clear fixes,
            warnings, and investigation notes.
          </p>
        </section>

        <LandingFilters
          brands={brands}
          issues={issues}
          lang={rawLang}
          models={models}
        />

        {brands.length === 0 ? (
          <EmptyState message="No brands have been added yet. Add your first brand in the admin dashboard or import a feed." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                href={`/${rawLang}/${brand.id}`}
                key={brand.id}
              >
                <div className="mb-5 h-36 rounded-2xl bg-zinc-100 bg-cover bg-center dark:bg-zinc-900" style={{ backgroundImage: brand.image ? `url(${brand.image})` : undefined }} />
                <h2 className="text-2xl font-semibold">{brand.name}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {localizedValue(brand.seoDescription, rawLang)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
