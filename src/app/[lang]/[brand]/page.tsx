import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/site/EmptyState";
import { Header } from "@/components/site/Header";
import {
  buildPageMetadata,
  getBrand,
  getBrands,
  getModelsByBrand,
} from "@/lib/data";
import { isLanguage, languages, localizedValue } from "@/lib/types";

type PageProps = {
  params: Promise<{ lang: string; brand: string }>;
};

export async function generateStaticParams() {
  const brands = await getBrands();

  return languages.flatMap((lang) =>
    brands.map((brand) => ({ lang, brand: brand.id })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang: rawLang, brand: brandId } = await params;

  if (!isLanguage(rawLang)) {
    return {};
  }

  const brand = await getBrand(brandId);

  if (!brand) {
    return {};
  }

  return buildPageMetadata({
    lang: rawLang,
    pathParts: [brand.id],
    title: `${brand.name} known issues and fixes`,
    description: localizedValue(brand.seoDescription, rawLang),
    image: brand.image,
  });
}

export default async function BrandPage({ params }: PageProps) {
  const { lang: rawLang, brand: brandId } = await params;

  if (!isLanguage(rawLang)) {
    notFound();
  }

  const [brand, models] = await Promise.all([
    getBrand(brandId),
    getModelsByBrand(brandId),
  ]);

  if (!brand) {
    notFound();
  }

  return (
    <>
      <Header lang={rawLang} pathParts={[brand.id]} />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">

        {/* Brand hero */}
        <section className="py-10 sm:py-14 border-b border-neutral-200">
          {brand.image ? (
            <div
              className="mb-8 h-56 sm:h-72 bg-neutral-100 bg-cover bg-center border border-neutral-200"
              style={{ backgroundImage: `url(${brand.image})` }}
            />
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-3">
            Brand Overview
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            {brand.name}
          </h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-500 max-w-3xl">
            {localizedValue(brand.seoDescription, rawLang)}
          </p>
        </section>

        {/* Models list */}
        <section className="py-8 pb-14">
          <div className="flex items-center gap-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 shrink-0">
              Models
            </p>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {models.length === 0 ? (
            <EmptyState message="No models have been added for this brand yet." />
          ) : (
            <div className="grid gap-px bg-neutral-200 border border-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <Link
                  className="group bg-white p-5 hover:bg-neutral-50 transition-colors"
                  href={`/${rawLang}/${brand.id}/${model.id}`}
                  key={model.id}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    {model.years}
                  </p>
                  <h2 className="mt-1.5 text-lg font-bold text-neutral-900 group-hover:text-red-700 transition-colors">
                    {model.name}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500 line-clamp-2">
                    {localizedValue(model.seoTitle, rawLang)}
                  </p>
                  <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-wider text-red-700">
                    View issues →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
