import { z } from "zod";
import type { CollectionName } from "./types";

const localizedStringSchema = z.object({
  en: z.string().default(""),
  es: z.string().default(""),
  pt: z.string().default(""),
});

export const brandSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  seoDescription: localizedStringSchema,
  image: z.string().default(""),
});

export const modelSchema = z.object({
  id: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  years: z.string().min(1),
  seoTitle: localizedStringSchema,
});

export const issueSchema = z.object({
  id: z.string().min(1),
  brandId: z.string().min(1),
  modelId: z.string().min(1),
  status: z.enum(["fixed", "warning", "investigating"]),
  title: localizedStringSchema,
  contentMarkdown: localizedStringSchema,
  image: z.string().default(""),
});

export const collectionSchemas = {
  brands: brandSchema,
  models: modelSchema,
  issues: issueSchema,
} satisfies Record<CollectionName, z.ZodType>;

export function parseCollectionRecord(
  collectionName: CollectionName,
  value: unknown,
) {
  return collectionSchemas[collectionName].parse(value);
}
