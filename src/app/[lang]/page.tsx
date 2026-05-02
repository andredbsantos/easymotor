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

  const [featured, ...rest] = brands;

  return (
    <>
      <Header lang={rawLang} />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">

        {/* Editorial hero */}
        <section className="py-10 sm:py-14 border-b border-neutral-200">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-3">
            Vehicle Diagnostics
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight text-neutral-900 max-w-3xl">
            Car &amp; motorcycle issue solving, built for search.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-500 max-w-2xl">
            Browse known issues by brand and model, then jump into clear fixes,
            warnings, and investigation notes.
          </p>
        </section>

        {/* Filters */}
        <div className="py-8">
          <LandingFilters
            brands={brands}
            issues={issues}
            lang={rawLang}
            models={models}
          />
        </div>

        {/* Brands */}
        {brands.length === 0 ? (
          <EmptyState message="No brands have been added yet. Add your first brand in the admin dashboard or import a feed." />
        ) : (
          <section className="pb-14">
            <div className="flex items-center gap-4 mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 shrink-0">
                All Brands
              </p>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            {/* Featured brand — large card */}
            {featured ? (
              <Link
                className="group mb-6 flex flex-col sm:flex-row gap-0 border border-neutral-200 bg-white hover:border-red-700 transition-colors overflow-hidden block"
                href={`/${rawLang}/${featured.id}`}
              >
                <div
                  className="h-48 sm:h-auto sm:w-72 shrink-0 bg-neutral-100 bg-cover bg-center"
                  style={{
                    backgroundImage: featured.image
                      ? `url(${featured.image})`
                      : undefined,
                  }}
                />
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-2">
                    Featured
                  </p>
                  <h2 className="text-3xl font-bold text-neutral-900 group-hover:text-red-700 transition-colors">
                    {featured.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500 line-clamp-3">
                    {localizedValue(featured.seoDescription, rawLang)}
                  </p>
                  <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-red-700">
                    Browse issues →
                  </span>
                </div>
              </Link>
            ) : null}

            {/* Remaining brands grid */}
            {rest.length > 0 ? (
              <div className="grid gap-px bg-neutral-200 border border-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((brand) => (
                  <Link
                    className="group bg-white p-5 hover:bg-neutral-50 transition-colors flex flex-col"
                    href={`/${rawLang}/${brand.id}`}
                    key={brand.id}
                  >
                    <div
                      className="mb-4 h-32 bg-neutral-100 bg-cover bg-center"
                      style={{
                        backgroundImage: brand.image
                          ? `url(${brand.image})`
                          : undefined,
                      }}
                    />
                    <h2 className="text-lg font-bold text-neutral-900 group-hover:text-red-700 transition-colors">
                      {brand.name}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-500 line-clamp-2 flex-1">
                      {localizedValue(brand.seoDescription, rawLang)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        )}
      </main>
    </>
  );
}
