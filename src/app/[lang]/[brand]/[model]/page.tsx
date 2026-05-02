import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/site/EmptyState";
import { Header } from "@/components/site/Header";
import { StatusBadge } from "@/components/site/StatusBadge";
import {
  buildPageMetadata,
  getBrand,
  getIssuesByModel,
  getModel,
  getModels,
} from "@/lib/data";
import { isLanguage, languages, localizedValue } from "@/lib/types";

type PageProps = {
  params: Promise<{ lang: string; brand: string; model: string }>;
};

export async function generateStaticParams() {
  const models = await getModels();

  return languages.flatMap((lang) =>
    models.map((model) => ({
      lang,
      brand: model.brandId,
      model: model.id,
    })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang: rawLang, brand: brandId, model: modelId } = await params;

  if (!isLanguage(rawLang)) {
    return {};
  }

  const [brand, model] = await Promise.all([
    getBrand(brandId),
    getModel(modelId),
  ]);

  if (!brand || !model || model.brandId !== brand.id) {
    return {};
  }

  return buildPageMetadata({
    lang: rawLang,
    pathParts: [brand.id, model.id],
    title: localizedValue(model.seoTitle, rawLang),
    description: `Known issues, warnings, and fixes for ${brand.name} ${model.name} ${model.years}.`,
    image: brand.image,
  });
}

export default async function ModelPage({ params }: PageProps) {
  const { lang: rawLang, brand: brandId, model: modelId } = await params;

  if (!isLanguage(rawLang)) {
    notFound();
  }

  const [brand, model, issues] = await Promise.all([
    getBrand(brandId),
    getModel(modelId),
    getIssuesByModel(modelId),
  ]);

  if (!brand || !model || model.brandId !== brand.id) {
    notFound();
  }

  return (
    <>
      <Header lang={rawLang} pathParts={[brand.id, model.id]} />
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <section className="mb-10 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Known issues
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            {brand.name} {model.name}
          </h1>
          <p className="mt-2 text-zinc-500">{model.years}</p>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            {localizedValue(model.seoTitle, rawLang)}
          </p>
        </section>

        {issues.length === 0 ? (
          <EmptyState message="No known issues have been added for this model yet." />
        ) : (
          <div className="grid gap-4">
            {issues.map((issue) => (
              <Link
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                href={`/${rawLang}/${brand.id}/${model.id}/${issue.id}`}
                key={issue.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">
                    {localizedValue(issue.title, rawLang)}
                  </h2>
                  <StatusBadge status={issue.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {localizedValue(issue.contentMarkdown, rawLang)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
