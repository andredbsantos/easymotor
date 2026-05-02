import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Brand, CollectionName, Issue, Model } from "@/lib/types";
import { languages } from "@/lib/types";
import { parseCollectionRecord } from "@/lib/validation";

type ContentStore = {
  brands: Brand[];
  models: Model[];
  issues: Issue[];
};

type GeminiRow = {
  brand: string;
  model: string;
  issues: string[];
};

const contentPath = path.join(process.cwd(), "data", "content.json");
const seedPath = path.join(process.cwd(), "data", "gemini-feed.json");

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function localizedTriple(en: string) {
  return Object.fromEntries(languages.map((lang) => [lang, en])) as {
    en: string;
    es: string;
    pt: string;
  };
}

function parseModelDisplay(modelRaw: string): { name: string; years: string } {
  const match = modelRaw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);

  if (match) {
    return { name: match[1].trim(), years: match[2].trim() };
  }

  return { name: modelRaw.trim(), years: "Various" };
}

function splitIssueLine(line: string): { title: string; body: string } {
  const idx = line.indexOf(": ");

  if (idx === -1) {
    const trimmed = line.trim();
    return { title: trimmed.slice(0, 120) || "Issue", body: trimmed };
  }

  return {
    title: line.slice(0, idx).trim() || "Issue",
    body: line.slice(idx + 2).trim(),
  };
}

function isGeminiRow(value: unknown): value is GeminiRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.brand === "string" &&
    typeof row.model === "string" &&
    Array.isArray(row.issues) &&
    row.issues.every((item) => typeof item === "string")
  );
}

function normalizeGeminiRows(rows: GeminiRow[]): ContentStore {
  const brands = new Map<string, Brand>();
  const models = new Map<string, Model>();
  const issues: Issue[] = [];

  for (const row of rows) {
    const brandId = slugify(row.brand);
    const { name: modelName, years } = parseModelDisplay(row.model);
    const modelId = `${brandId}-${slugify(row.model)}`;

    if (!brands.has(brandId)) {
      brands.set(brandId, {
        id: brandId,
        name: row.brand.trim(),
        seoDescription: localizedTriple(
          `Known issues, fixes, and troubleshooting for ${row.brand.trim()} vehicles.`,
        ),
        image: "",
      });
    }

    if (!models.has(modelId)) {
      models.set(modelId, {
        id: modelId,
        brandId,
        name: modelName,
        years,
        seoTitle: localizedTriple(
          `Known issues and fixes for ${row.brand.trim()} ${modelName} ${years}.`,
        ),
      });
    }

    row.issues.forEach((line, index) => {
      const { title, body } = splitIssueLine(line);
      const issueSlug = slugify(title);

      issues.push({
        id: `${modelId}-${issueSlug || "issue"}-${index}`,
        brandId,
        modelId,
        status: "investigating",
        title: localizedTriple(title),
        contentMarkdown: localizedTriple(
          body
            ? `## ${title}\n\n${body}\n\n### Vehicle\n\n${row.brand.trim()} ${modelName} ${years}`
            : `## ${title}\n\n### Vehicle\n\n${row.brand.trim()} ${modelName} ${years}`,
        ),
        image: "",
      });
    });
  }

  return {
    brands: [...brands.values()].sort((a, b) => a.name.localeCompare(b.name)),
    models: [...models.values()].sort((a, b) => a.name.localeCompare(b.name)),
    issues: issues.sort((a, b) => a.id.localeCompare(b.id)),
  };
}

function parseContentStore(value: unknown): ContentStore {
  const raw = value as Partial<ContentStore>;

  return {
    brands: (raw.brands || []).map(
      (item) => parseCollectionRecord("brands", item) as Brand,
    ),
    models: (raw.models || []).map(
      (item) => parseCollectionRecord("models", item) as Model,
    ),
    issues: (raw.issues || []).map(
      (item) => parseCollectionRecord("issues", item) as Issue,
    ),
  };
}

async function readJsonFile(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

export async function readContentStore(): Promise<ContentStore> {
  try {
    return parseContentStore(await readJsonFile(contentPath));
  } catch (error) {
    const missingContentFile =
      error instanceof Error && "code" in error && error.code === "ENOENT";

    if (!missingContentFile) {
      throw error;
    }
  }

  const seed = await readJsonFile(seedPath);

  if (Array.isArray(seed) && seed.every(isGeminiRow)) {
    return normalizeGeminiRows(seed);
  }

  return parseContentStore(seed);
}

export async function writeContentStore(content: ContentStore) {
  const sorted: ContentStore = {
    brands: [...content.brands].sort((a, b) => a.id.localeCompare(b.id)),
    models: [...content.models].sort((a, b) => a.id.localeCompare(b.id)),
    issues: [...content.issues].sort((a, b) => a.id.localeCompare(b.id)),
  };

  await writeFile(contentPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

export async function listJsonRecords(collectionName: CollectionName) {
  const content = await readContentStore();
  return content[collectionName];
}

export async function upsertJsonRecord(
  collectionName: CollectionName,
  value: unknown,
) {
  const content = await readContentStore();
  const record = parseCollectionRecord(collectionName, value) as
    | Brand
    | Model
    | Issue;
  const records = content[collectionName] as Array<Brand | Model | Issue>;
  const index = records.findIndex((item) => item.id === record.id);

  if (index === -1) {
    records.push(record);
  } else {
    records[index] = record;
  }

  await writeContentStore(content);
  return record;
}

export async function deleteJsonRecord(
  collectionName: CollectionName,
  id: string,
) {
  const content = await readContentStore();
  const records = content[collectionName] as Array<Brand | Model | Issue>;
  const nextRecords = records.filter((item) => item.id !== id);

  if (collectionName === "brands") {
    content.brands = nextRecords as Brand[];
    content.models = content.models.filter((model) => model.brandId !== id);
    content.issues = content.issues.filter((issue) => issue.brandId !== id);
  } else if (collectionName === "models") {
    content.models = nextRecords as Model[];
    content.issues = content.issues.filter((issue) => issue.modelId !== id);
  } else {
    content.issues = nextRecords as Issue[];
  }

  await writeContentStore(content);
}
