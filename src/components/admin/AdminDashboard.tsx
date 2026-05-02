"use client";

import { marked } from "marked";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type Brand,
  type CollectionName,
  type Issue,
  type Language,
  type Model,
  languages,
} from "@/lib/types";

type AdminRecord = Brand | Model | Issue;

const collections: CollectionName[] = ["brands", "models", "issues"];

const blankRecords: Record<CollectionName, AdminRecord> = {
  brands: {
    id: "",
    name: "",
    seoDescription: { en: "", es: "", pt: "" },
    image: "",
  },
  models: {
    id: "",
    brandId: "",
    name: "",
    years: "",
    seoTitle: { en: "", es: "", pt: "" },
  },
  issues: {
    id: "",
    brandId: "",
    modelId: "",
    status: "investigating",
    title: { en: "", es: "", pt: "" },
    contentMarkdown: { en: "", es: "", pt: "" },
    image: "",
  },
};

function cloneBlank(collection: CollectionName) {
  return structuredClone(blankRecords[collection]);
}

const fetchAdmin: typeof fetch = (input, init) =>
  fetch(input, { ...init, credentials: "include" });

export function AdminDashboard() {
  const router = useRouter();
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [collection, setCollection] = useState<CollectionName>("brands");
  const [items, setItems] = useState<Record<CollectionName, AdminRecord[]>>({
    brands: [],
    models: [],
    issues: [],
  });
  const [record, setRecord] = useState<AdminRecord>(() => cloneBlank("brands"));
  const [lang, setLang] = useState<Language>("en");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const markdownPreview = useMemo(() => {
    if (collection !== "issues") {
      return "";
    }

    const issue = record as Issue;
    return marked.parse(issue.contentMarkdown[lang], { async: false });
  }, [collection, lang, record]);

  const refreshAll = useCallback(async () => {
    const nextItems: Record<CollectionName, AdminRecord[]> = {
      brands: [],
      models: [],
      issues: [],
    };

    for (const targetCollection of collections) {
      const response = await fetchAdmin(`/api/admin/${targetCollection}`);

      if (response.status === 401) {
        setSessionOk(false);
        return;
      }

      if (response.ok) {
        const data = (await response.json()) as { items: AdminRecord[] };
        nextItems[targetCollection] = data.items;
      }
    }

    setItems(nextItems);
  }, []);

  useEffect(() => {
    void (async () => {
      const response = await fetchAdmin("/api/admin/session");

      if (!response.ok) {
        setSessionOk(false);
        return;
      }

      setSessionOk(true);
      await refreshAll();
    })();
  }, [refreshAll]);

  async function api(targetCollection: CollectionName, init: RequestInit = {}) {
    return fetchAdmin(`/api/admin/${targetCollection}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  }

  function updateField(field: string, value: string) {
    setRecord((current) => ({ ...current, [field]: value }) as AdminRecord);
  }

  function updateLocalized(field: string, value: string) {
    setRecord((current) => {
      const localized = current[field as keyof AdminRecord] as unknown as Record<
        Language,
        string
      >;

      return {
        ...current,
        [field]: {
          ...localized,
          [lang]: value,
        },
      } as AdminRecord;
    });
  }

  async function saveRecord() {
    setMessage("");
    const response = await api(collection, {
      body: JSON.stringify(record),
      method: "POST",
    });

    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (!response.ok) {
      setMessage(await response.text());
      return;
    }

    setMessage("Saved.");
    await refreshAll();
  }

  async function deleteRecord(id: string) {
    setMessage("");
    const response = await fetchAdmin(`/api/admin/${collection}?id=${id}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (!response.ok) {
      setMessage(await response.text());
      return;
    }

    setMessage("Deleted.");
    setRecord(cloneBlank(collection));
    await refreshAll();
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetchAdmin("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        setMessage(await response.text());
        return;
      }

      const data = (await response.json()) as { url?: string };
      if (data.url) {
        updateField("image", data.url);
        await navigator.clipboard?.writeText(data.url);
        setMessage("Image uploaded and link copied.");
      }
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    await fetchAdmin("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (sessionOk === null) {
    return <main className="p-8">Checking admin session...</main>;
  }

  if (!sessionOk) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-3xl font-bold">Admin access required</h1>
        <Link className="mt-6 inline-block underline" href="/admin/login">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Backoffice
          </p>
          <h1 className="text-4xl font-bold">Easymotor JSON editor</h1>
        </div>
        <button
          className="rounded-xl border border-zinc-300 px-4 py-2 dark:border-zinc-700"
          onClick={() => void logout()}
          type="button"
        >
          Sign out
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {collections.map((name) => (
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              collection === name
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            }`}
            key={name}
            onClick={() => {
              setCollection(name);
              setRecord(cloneBlank(name));
            }}
            type="button"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-5 flex flex-wrap gap-2">
            {languages.map((code) => (
              <button
                className={`rounded-full px-3 py-1 text-sm ${
                  lang === code
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    : "bg-zinc-100 dark:bg-zinc-900"
                }`}
                key={code}
                onClick={() => setLang(code)}
                type="button"
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <RecordForm
            collection={collection}
            lang={lang}
            onLocalizedChange={updateLocalized}
            onUpload={uploadImage}
            onValueChange={updateField}
            record={record}
            uploading={uploading}
          />

          {collection === "issues" ? (
            <div className="mt-6 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-3 text-sm font-semibold">Markdown preview</p>
              <div
                className="prose prose-zinc max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: markdownPreview }}
              />
            </div>
          ) : null}

          {message ? <p className="mt-4 text-sm">{message}</p> : null}
          <div className="mt-6 flex gap-3">
            <button
              className="rounded-xl bg-zinc-950 px-5 py-3 font-semibold text-white dark:bg-white dark:text-zinc-950"
              onClick={() => void saveRecord()}
              type="button"
            >
              Save {collection.slice(0, -1)}
            </button>
            <button
              className="rounded-xl border border-zinc-300 px-5 py-3 dark:border-zinc-700"
              onClick={() => setRecord(cloneBlank(collection))}
              type="button"
            >
              New
            </button>
          </div>
        </section>

        <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-xl font-semibold">Existing {collection}</h2>
          <div className="grid gap-3">
            {items[collection].map((item) => (
              <div
                className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                key={item.id}
              >
                <p className="font-semibold">{item.id}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-900"
                    onClick={() => setRecord(structuredClone(item))}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
                    onClick={() => void deleteRecord(item.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

function TextInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 dark:border-zinc-700"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function RecordForm({
  collection,
  lang,
  onLocalizedChange,
  onUpload,
  onValueChange,
  record,
  uploading,
}: {
  collection: CollectionName;
  lang: Language;
  onLocalizedChange: (field: string, value: string) => void;
  onUpload: (file: File) => void;
  onValueChange: (field: string, value: string) => void;
  record: AdminRecord;
  uploading: boolean;
}) {
  return (
    <div className="grid gap-4">
      <TextInput
        label="ID / slug"
        onChange={(value) => onValueChange("id", value)}
        value={record.id}
      />

      {collection === "brands" ? (
        <BrandFields
          brand={record as Brand}
          lang={lang}
          onLocalizedChange={onLocalizedChange}
          onUpload={onUpload}
          onValueChange={onValueChange}
          uploading={uploading}
        />
      ) : null}

      {collection === "models" ? (
        <ModelFields
          model={record as Model}
          lang={lang}
          onLocalizedChange={onLocalizedChange}
          onValueChange={onValueChange}
        />
      ) : null}

      {collection === "issues" ? (
        <IssueFields
          issue={record as Issue}
          lang={lang}
          onLocalizedChange={onLocalizedChange}
          onUpload={onUpload}
          onValueChange={onValueChange}
          uploading={uploading}
        />
      ) : null}
    </div>
  );
}

function BrandFields({
  brand,
  lang,
  onLocalizedChange,
  onUpload,
  onValueChange,
  uploading,
}: {
  brand: Brand;
  lang: Language;
  onLocalizedChange: (field: string, value: string) => void;
  onUpload: (file: File) => void;
  onValueChange: (field: string, value: string) => void;
  uploading: boolean;
}) {
  return (
    <>
      <TextInput
        label="Name"
        onChange={(value) => onValueChange("name", value)}
        value={brand.name}
      />
      <LocalizedTextarea
        label={`SEO description (${lang.toUpperCase()})`}
        onChange={(value) => onLocalizedChange("seoDescription", value)}
        value={brand.seoDescription[lang]}
      />
      <ImageFields
        image={brand.image}
        onUpload={onUpload}
        onValueChange={onValueChange}
        uploading={uploading}
      />
    </>
  );
}

function ModelFields({
  model,
  lang,
  onLocalizedChange,
  onValueChange,
}: {
  model: Model;
  lang: Language;
  onLocalizedChange: (field: string, value: string) => void;
  onValueChange: (field: string, value: string) => void;
}) {
  return (
    <>
      <TextInput
        label="Brand ID"
        onChange={(value) => onValueChange("brandId", value)}
        value={model.brandId}
      />
      <TextInput
        label="Name"
        onChange={(value) => onValueChange("name", value)}
        value={model.name}
      />
      <TextInput
        label="Years"
        onChange={(value) => onValueChange("years", value)}
        value={model.years}
      />
      <LocalizedTextarea
        label={`SEO title (${lang.toUpperCase()})`}
        onChange={(value) => onLocalizedChange("seoTitle", value)}
        value={model.seoTitle[lang]}
      />
    </>
  );
}

function IssueFields({
  issue,
  lang,
  onLocalizedChange,
  onUpload,
  onValueChange,
  uploading,
}: {
  issue: Issue;
  lang: Language;
  onLocalizedChange: (field: string, value: string) => void;
  onUpload: (file: File) => void;
  onValueChange: (field: string, value: string) => void;
  uploading: boolean;
}) {
  return (
    <>
      <TextInput
        label="Brand ID"
        onChange={(value) => onValueChange("brandId", value)}
        value={issue.brandId}
      />
      <TextInput
        label="Model ID"
        onChange={(value) => onValueChange("modelId", value)}
        value={issue.modelId}
      />
      <label className="block text-sm font-medium">
        Status
        <select
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 dark:border-zinc-700"
          onChange={(event) => onValueChange("status", event.target.value)}
          value={issue.status}
        >
          <option value="fixed">Fixed</option>
          <option value="warning">Warning</option>
          <option value="investigating">Investigating</option>
        </select>
      </label>
      <LocalizedTextarea
        label={`Title (${lang.toUpperCase()})`}
        onChange={(value) => onLocalizedChange("title", value)}
        value={issue.title[lang]}
      />
      <LocalizedTextarea
        label={`Content Markdown (${lang.toUpperCase()})`}
        onChange={(value) => onLocalizedChange("contentMarkdown", value)}
        rows={10}
        value={issue.contentMarkdown[lang]}
      />
      <ImageFields
        image={issue.image}
        onUpload={onUpload}
        onValueChange={onValueChange}
        uploading={uploading}
      />
    </>
  );
}

function LocalizedTextarea({
  label,
  onChange,
  rows = 4,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 font-mono text-sm dark:border-zinc-700"
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
      />
    </label>
  );
}

function ImageFields({
  image,
  onUpload,
  onValueChange,
  uploading,
}: {
  image: string;
  onUpload: (file: File) => void;
  onValueChange: (field: string, value: string) => void;
  uploading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <TextInput
        label="Image URL"
        onChange={(value) => onValueChange("image", value)}
        value={image}
      />
      <label className="mt-4 block text-sm font-medium">
        Upload image to local JSON site
        <input
          className="mt-2 block w-full text-sm"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onUpload(file);
            }
          }}
          type="file"
        />
      </label>
      <button
        className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900"
        onClick={() => navigator.clipboard?.writeText(image)}
        type="button"
      >
        Copy image link
      </button>
    </div>
  );
}
