import { marked } from "marked";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { StatusBadge } from "@/components/site/StatusBadge";
import {
  buildPageMetadata,
  getIssues,
  getIssueWithRelations,
  issueJsonLd,
} from "@/lib/data";
import { isLanguage, languages, localizedValue } from "@/lib/types";

type PageProps = {
  params: Promise<{
    lang: string;
    brand: string;
    model: string;
    issue: string;
  }>;
};

export async function generateStaticParams() {
  const issues = await getIssues();

  return languages.flatMap((lang) =>
    issues.map((issue) => ({
      lang,
      brand: issue.brandId,
      model: issue.modelId,
      issue: issue.id,
    })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    lang: rawLang,
    brand: brandId,
    model: modelId,
    issue: issueId,
  } = await params;

  if (!isLanguage(rawLang)) {
    return {};
  }

  const relations = await getIssueWithRelations(brandId, modelId, issueId);

  if (!relations) {
    return {};
  }

  return buildPageMetadata({
    lang: rawLang,
    pathParts: [brandId, modelId, issueId],
    title: localizedValue(relations.issue.title, rawLang),
    description: localizedValue(relations.issue.contentMarkdown, rawLang).slice(
      0,
      155,
    ),
    image: relations.issue.image || relations.brand.image,
  });
}

export default async function IssuePage({ params }: PageProps) {
  const {
    lang: rawLang,
    brand: brandId,
    model: modelId,
    issue: issueId,
  } = await params;

  if (!isLanguage(rawLang)) {
    notFound();
  }

  const relations = await getIssueWithRelations(brandId, modelId, issueId);

  if (!relations) {
    notFound();
  }

  const { brand, model, issue } = relations;
  const title = localizedValue(issue.title, rawLang);
  const markdown = localizedValue(issue.contentMarkdown, rawLang);
  const html = await Promise.resolve(marked.parse(markdown));

  return (
    <>
      <Header lang={rawLang} pathParts={[brand.id, model.id, issue.id]} />
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(issueJsonLd({ ...relations, lang: rawLang })),
          }}
          type="application/ld+json"
        />
        <article className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {issue.image ? (
            <div
              className="h-72 bg-zinc-100 bg-cover bg-center dark:bg-zinc-900"
              style={{ backgroundImage: `url(${issue.image})` }}
            />
          ) : null}
          <div className="p-8">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <StatusBadge status={issue.status} />
              <span className="text-sm text-zinc-500">
                {brand.name} {model.name} {model.years}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
            <div
              className="prose prose-zinc mt-8 max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </article>
      </main>
    </>
  );
}
