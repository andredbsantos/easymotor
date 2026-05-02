import type { MetadataRoute } from "next";
import { getBrands, getIssues, getModels } from "@/lib/data";
import { languages } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easymotor.app";
  const [brands, models, issues] = await Promise.all([
    getBrands(),
    getModels(),
    getIssues(),
  ]);

  const urls: MetadataRoute.Sitemap = [];

  for (const lang of languages) {
    urls.push({ url: `${siteUrl}/${lang}`, changeFrequency: "daily" });

    for (const brand of brands) {
      urls.push({
        url: `${siteUrl}/${lang}/${brand.id}`,
        changeFrequency: "weekly",
      });
    }

    for (const model of models) {
      urls.push({
        url: `${siteUrl}/${lang}/${model.brandId}/${model.id}`,
        changeFrequency: "weekly",
      });
    }

    for (const issue of issues) {
      urls.push({
        url: `${siteUrl}/${lang}/${issue.brandId}/${issue.modelId}/${issue.id}`,
        changeFrequency: "monthly",
      });
    }
  }

  return urls;
}
