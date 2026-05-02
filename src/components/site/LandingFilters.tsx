"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Brand, Issue, Language, Model } from "@/lib/types";
import { localizedValue } from "@/lib/types";

export function LandingFilters({
  brands,
  issues,
  lang,
  models,
}: {
  brands: Brand[];
  issues: Issue[];
  lang: Language;
  models: Model[];
}) {
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [year, setYear] = useState("");

  const filteredModels = useMemo(
    () =>
      models.filter(
        (model) =>
          (!brandId || model.brandId === brandId) &&
          (!year || model.years.toLowerCase().includes(year.toLowerCase())),
      ),
    [brandId, models, year],
  );

  const filteredIssues = useMemo(
    () =>
      issues
        .filter((issue) => {
          const model = models.find((item) => item.id === issue.modelId);

          return (
            (!brandId || issue.brandId === brandId) &&
            (!modelId || issue.modelId === modelId) &&
            (!year ||
              model?.years.toLowerCase().includes(year.toLowerCase()) === true)
          );
        })
        .slice(0, 8),
    [brandId, issues, modelId, models, year],
  );

  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const selectedModel = models.find((model) => model.id === modelId);
  const destination = selectedModel
    ? `/${lang}/${selectedModel.brandId}/${selectedModel.id}`
    : selectedBrand
      ? `/${lang}/${selectedBrand.id}`
      : `/${lang}`;

  return (
    <section className="mb-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          SEO filters
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Find a real brand or model page
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Each filter points to an indexable URL with metadata built from the
          vehicle brand, model, and year/version text.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="text-sm font-medium">
          Brand
          <select
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 dark:border-zinc-700"
            onChange={(event) => {
              setBrandId(event.target.value);
              setModelId("");
            }}
            value={brandId}
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Model / version
          <select
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 dark:border-zinc-700"
            onChange={(event) => setModelId(event.target.value)}
            value={modelId}
          >
            <option value="">All models</option>
            {filteredModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.years})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Year / generation
          <input
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 dark:border-zinc-700"
            onChange={(event) => setYear(event.target.value)}
            placeholder="e.g. Gen IV, 2007"
            value={year}
          />
        </label>

        <div className="flex items-end">
          <Link
            className="inline-flex w-full justify-center rounded-xl bg-zinc-950 px-5 py-3 font-semibold text-white dark:bg-white dark:text-zinc-950"
            href={destination}
          >
            Open SEO page
          </Link>
        </div>
      </div>

      {filteredIssues.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {filteredIssues.map((issue) => {
            const model = models.find((item) => item.id === issue.modelId);
            const brand = brands.find((item) => item.id === issue.brandId);

            if (!model || !brand) {
              return null;
            }

            return (
              <Link
                className="rounded-2xl border border-zinc-200 p-4 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                href={`/${lang}/${brand.id}/${model.id}/${issue.id}`}
                key={issue.id}
              >
                <p className="text-sm text-zinc-500">
                  {brand.name} {model.name} {model.years}
                </p>
                <h3 className="mt-1 font-semibold">
                  {localizedValue(issue.title, lang)}
                </h3>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
