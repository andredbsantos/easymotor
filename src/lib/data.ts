import type { Metadata } from "next";
import { readContentStore } from "@/lib/json-content";
import {
  type Brand,
  type Issue,
  type IssueWithRelations,
  type Language,
  type Model,
  languages,
  localizedValue,
} from "@/lib/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easymotor.app";

export async function getBrands(): Promise<Brand[]> {
  return (await readContentStore()).brands;
}

export async function getModels(): Promise<Model[]> {
  return (await readContentStore()).models;
}

export async function getIssues(): Promise<Issue[]> {
  return (await readContentStore()).issues;
}

export async function getBrand(brandId: string): Promise<Brand | null> {
  const brands = await getBrands();
  return brands.find((brand) => brand.id === brandId) || null;
}

export async function getModelsByBrand(brandId: string): Promise<Model[]> {
  const models = await getModels();
  return models.filter((model) => model.brandId === brandId);
}

export async function getModel(modelId: string): Promise<Model | null> {
  const models = await getModels();
  return models.find((model) => model.id === modelId) || null;
}

export async function getIssuesByModel(modelId: string): Promise<Issue[]> {
  const issues = await getIssues();
  return issues.filter((issue) => issue.modelId === modelId);
}

export async function getIssue(issueId: string): Promise<Issue | null> {
  const issues = await getIssues();
  return issues.find((issue) => issue.id === issueId) || null;
}

export async function getIssueWithRelations(
  brandId: string,
  modelId: string,
  issueId: string,
): Promise<IssueWithRelations | null> {
  const [brand, model, issue] = await Promise.all([
    getBrand(brandId),
    getModel(modelId),
    getIssue(issueId),
  ]);

  if (
    !brand ||
    !model ||
    !issue ||
    model.brandId !== brand.id ||
    issue.brandId !== brand.id ||
    issue.modelId !== model.id
  ) {
    return null;
  }

  return { brand, model, issue };
}

export function languageAlternates(pathParts: string[]) {
  return Object.fromEntries(
    languages.map((lang) => [
      lang,
      `/${[lang, ...pathParts].filter(Boolean).join("/")}`,
    ]),
  );
}

export function buildPageMetadata({
  title,
  description,
  lang,
  pathParts = [],
  image,
}: {
  title: string;
  description: string;
  lang: Language;
  pathParts?: string[];
  image?: string;
}): Metadata {
  const pathname = `/${[lang, ...pathParts].filter(Boolean).join("/")}`;

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
      languages: languageAlternates(pathParts),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}${pathname}`,
      locale: lang,
      images: image ? [image] : undefined,
    },
  };
}

export function issueJsonLd({
  brand,
  model,
  issue,
  lang,
}: IssueWithRelations & { lang: Language }) {
  const title = localizedValue(issue.title, lang);
  const content = localizedValue(issue.contentMarkdown, lang);
  const url = `${siteUrl}/${lang}/${brand.id}/${model.id}/${issue.id}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: content.slice(0, 180),
      image: issue.image || brand.image,
      mainEntityOfPage: url,
      about: `${brand.name} ${model.name}`,
      inLanguage: lang,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: title,
          acceptedAnswer: {
            "@type": "Answer",
            text: content.slice(0, 500),
          },
        },
      ],
    },
  ];
}
