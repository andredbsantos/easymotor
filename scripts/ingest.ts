import { config as loadEnv } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import {
  type Brand,
  type CollectionName,
  type Issue,
  type IssueStatus,
  type Model,
  languages,
} from "../src/lib/types";
import { parseCollectionRecord } from "../src/lib/validation";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

type FeedRecord = {
  collection?: CollectionName;
  type?: CollectionName;
  id: string;
  [key: string]: unknown;
};

type GeminiRow = {
  brand: string;
  model: string;
  issues: string[];
};

const collectionNames: CollectionName[] = ["brands", "models", "issues"];
const outputPath = path.join(process.cwd(), "data", "content.json");

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
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

  const title = line.slice(0, idx).trim() || "Issue";
  const body = line.slice(idx + 2).trim();

  return { title, body };
}

function localizedTriple(en: string) {
  return Object.fromEntries(languages.map((lang) => [lang, en])) as {
    en: string;
    es: string;
    pt: string;
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

function expandGeminiRows(rows: GeminiRow[]): FeedRecord[] {
  const out: FeedRecord[] = [];
  const seenBrands = new Set<string>();
  const seenModels = new Set<string>();

  for (const row of rows) {
    const brandId = slugify(row.brand);
    const { name: modelName, years } = parseModelDisplay(row.model);
    const modelId = `${brandId}-${slugify(row.model)}`;

    if (!seenBrands.has(brandId)) {
      seenBrands.add(brandId);
      out.push({
        collection: "brands",
        id: brandId,
        name: row.brand.trim(),
        seoDescription: localizedTriple(
          `Known issues, fixes, and troubleshooting for ${row.brand.trim()} vehicles.`,
        ),
        image: "",
      });
    }

    if (!seenModels.has(modelId)) {
      seenModels.add(modelId);
      const seoLine = `Known issues and fixes for ${row.brand.trim()} ${modelName}.`;
      out.push({
        collection: "models",
        id: modelId,
        brandId,
        name: modelName,
        years,
        seoTitle: localizedTriple(seoLine),
      });
    }

    row.issues.forEach((line, index) => {
      const { title, body } = splitIssueLine(line);
      const issueSlug = slugify(title);
      const issueId = `${modelId}-${issueSlug || "issue"}-${index}`;

      out.push({
        collection: "issues",
        id: issueId,
        brandId,
        modelId,
        status: "investigating" satisfies IssueStatus,
        title: localizedTriple(title),
        contentMarkdown: localizedTriple(
          body ? `## ${title}\n\n${body}` : `## ${title}\n`,
        ),
        image: "",
      });
    });
  }

  return out;
}

function localizedFromFlat(record: FeedRecord, field: string) {
  const existing = record[field];

  if (existing && typeof existing === "object") {
    return existing;
  }

  return Object.fromEntries(
    languages.map((lang) => [lang, String(record[`${field}_${lang}`] || "")]),
  );
}

function normalizeRecord(record: FeedRecord) {
  const collection = record.collection || record.type;

  if (!collection || !collectionNames.includes(collection)) {
    throw new Error(`Record ${record.id} is missing a valid collection/type.`);
  }

  if (collection === "brands") {
    return {
      collection,
      data: parseCollectionRecord("brands", {
        id: record.id,
        name: record.name,
        seoDescription: localizedFromFlat(record, "seoDescription"),
        image: record.image || "",
      }),
    };
  }

  if (collection === "models") {
    return {
      collection,
      data: parseCollectionRecord("models", {
        id: record.id,
        brandId: record.brandId,
        name: record.name,
        years: record.years,
        seoTitle: localizedFromFlat(record, "seoTitle"),
      }),
    };
  }

  return {
    collection,
    data: parseCollectionRecord("issues", {
      id: record.id,
      brandId: record.brandId,
      modelId: record.modelId,
      status: (record.status || "investigating") as IssueStatus,
      title: localizedFromFlat(record, "title"),
      contentMarkdown: localizedFromFlat(record, "contentMarkdown"),
      image: record.image || "",
    }),
  };
}

async function loadFeed(filePath: string): Promise<FeedRecord[]> {
  const raw = await readFile(filePath, "utf8");
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".csv") {
    return parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as FeedRecord[];
  }

  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed) && parsed.length > 0 && isGeminiRow(parsed[0])) {
    return expandGeminiRows(parsed);
  }

  if (Array.isArray(parsed)) {
    return parsed as FeedRecord[];
  }

  const objectFeed = parsed as Record<string, FeedRecord[]>;

  return collectionNames.flatMap((collection) =>
    (objectFeed[collection] || []).map((record) => ({ ...record, collection })),
  );
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error("Usage: npm run ingest -- ./path/to/feed.json");
  }

  const feed = await loadFeed(filePath);
  const content = {
    brands: [] as Brand[],
    models: [] as Model[],
    issues: [] as Issue[],
  };

  for (const record of feed) {
    const normalized = normalizeRecord(record);
    const records = content[normalized.collection];

    records.push(normalized.data as never);
  }

  await writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${content.brands.length} brands, ${content.models.length} models, and ${content.issues.length} issues to ${outputPath}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
