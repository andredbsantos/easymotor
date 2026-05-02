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
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(issueJsonLd({ ...relations, lang: rawLang })),
          }}
          type="application/ld+json"
        />

        <article>
          {/* Issue hero image */}
          {issue.image ? (
            <div
              className="mb-8 h-56 sm:h-72 bg-neutral-100 bg-cover bg-center border border-neutral-200"
              style={{ backgroundImage: `url(${issue.image})` }}
            />
          ) : null}

          {/* Eyebrow */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <StatusBadge status={issue.status} />
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {brand.name} · {model.name} · {model.years}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
            {title}
          </h1>

          <div className="mt-6 h-px bg-red-700 w-12" />

          {/* Content */}
          <div
            className="prose prose-neutral mt-8 max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-neutral-900
              prose-p:text-neutral-600 prose-p:leading-relaxed
              prose-a:text-red-700 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-neutral-900
              prose-li:text-neutral-600
              prose-code:text-red-700 prose-code:bg-red-50 prose-code:px-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </main>
    </>
  );
}
