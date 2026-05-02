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
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">

        {/* Model hero */}
        <section className="py-10 sm:py-14 border-b border-neutral-200">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-3">
            {brand.name}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            {model.name}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-neutral-400 uppercase tracking-wider">
            {model.years}
          </p>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-500 max-w-3xl">
            {localizedValue(model.seoTitle, rawLang)}
          </p>
        </section>

        {/* Issues list */}
        <section className="py-8 pb-14">
          <div className="flex items-center gap-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 shrink-0">
              Known Issues
            </p>
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 shrink-0">{issues.length} total</span>
          </div>

          {issues.length === 0 ? (
            <EmptyState message="No known issues have been added for this model yet." />
          ) : (
            <div className="border border-neutral-200">
              {issues.map((issue, index) => (
                <Link
                  className={`group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-5 py-4 hover:bg-neutral-50 transition-colors ${index > 0 ? "border-t border-neutral-200" : ""}`}
                  href={`/${rawLang}/${brand.id}/${model.id}/${issue.id}`}
                  key={issue.id}
                >
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-neutral-900 group-hover:text-red-700 transition-colors">
                      {localizedValue(issue.title, rawLang)}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500 line-clamp-2">
                      {localizedValue(issue.contentMarkdown, rawLang)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={issue.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
