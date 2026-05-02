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
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <section className="mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div
            className="h-56 bg-zinc-100 bg-cover bg-center dark:bg-zinc-900"
            style={{ backgroundImage: brand.image ? `url(${brand.image})` : undefined }}
          />
          <div className="p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Brand overview
            </p>
            <h1 className="mt-3 text-4xl font-bold">{brand.name}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              {localizedValue(brand.seoDescription, rawLang)}
            </p>
          </div>
        </section>

        <h2 className="mb-5 text-2xl font-semibold">Models</h2>
        {models.length === 0 ? (
          <EmptyState message="No models have been added for this brand yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Link
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                href={`/${rawLang}/${brand.id}/${model.id}`}
                key={model.id}
              >
                <p className="text-sm text-zinc-500">{model.years}</p>
                <h3 className="mt-2 text-xl font-semibold">{model.name}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {localizedValue(model.seoTitle, rawLang)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
