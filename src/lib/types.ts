export const languages = ["en", "es", "pt"] as const;

export type Language = (typeof languages)[number];

export type LocalizedString = Record<Language, string>;

export type IssueStatus = "fixed" | "warning" | "investigating";

export interface Brand {
  id: string;
  name: string;
  seoDescription: LocalizedString;
  image: string;
}

export interface Model {
  id: string;
  brandId: string;
  name: string;
  years: string;
  seoTitle: LocalizedString;
}

export interface Issue {
  id: string;
  brandId: string;
  modelId: string;
  status: IssueStatus;
  title: LocalizedString;
  contentMarkdown: LocalizedString;
  image: string;
}

export interface IssueWithRelations {
  brand: Brand;
  model: Model;
  issue: Issue;
}

export type CollectionName = "brands" | "models" | "issues";

export function isLanguage(value: string): value is Language {
  return languages.includes(value as Language);
}

export function localizedValue(
  values: LocalizedString | undefined,
  lang: Language,
): string {
  return values?.[lang] || values?.en || "";
}
