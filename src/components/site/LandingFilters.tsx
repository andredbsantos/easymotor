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
    <section className="mb-10 border border-neutral-200 bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-2">
        Quick Search
      </p>
      <h2 className="text-xl font-bold text-neutral-900 mb-4">
        Find a brand or model
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Brand</span>
          <select
            className="mt-1.5 w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-red-700 focus:outline-none"
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

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Model</span>
          <select
            className="mt-1.5 w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-red-700 focus:outline-none"
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

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Year / Generation</span>
          <input
            className="mt-1.5 w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-red-700 focus:outline-none"
            onChange={(event) => setYear(event.target.value)}
            placeholder="e.g. 2007, Gen IV"
            value={year}
          />
        </label>

        <div className="flex items-end">
          <Link
            className="inline-flex w-full justify-center bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 transition-colors"
            href={destination}
          >
            Search
          </Link>
        </div>
      </div>

      {filteredIssues.length > 0 ? (
        <div className="mt-5 border-t border-neutral-200 pt-4 grid gap-0">
          {filteredIssues.map((issue, index) => {
            const model = models.find((item) => item.id === issue.modelId);
            const brand = brands.find((item) => item.id === issue.brandId);

            if (!model || !brand) return null;

            return (
              <Link
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 px-1 hover:bg-neutral-50 transition-colors ${index > 0 ? "border-t border-neutral-100" : ""}`}
                href={`/${lang}/${brand.id}/${model.id}/${issue.id}`}
                key={issue.id}
              >
                <span className="text-xs text-neutral-500 shrink-0">
                  {brand.name} · {model.name} · {model.years}
                </span>
                <span className="font-medium text-sm text-neutral-900">
                  {localizedValue(issue.title, lang)}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
