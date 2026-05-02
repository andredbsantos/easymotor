# Easymotor feed ingestion

Run the importer with a JSON or CSV file:

```bash
npm run ingest -- ./feed.json
```

The script accepts either:

- A flat array where every record has `collection` or `type` set to `brands`, `models`, or `issues`.
- A JSON object with `brands`, `models`, and `issues` arrays.
- A CSV file with a `collection` column.
- **Gemini-style export**: a JSON array of `{ "brand", "model", "issues": string[] }`
  objects (like `data/gemini-feed.json`). The script slugifies IDs, splits
  `Model (Years)` into name + years when possible, and turns each issue line
  `Title: body` into Markdown. English copy is mirrored into ES/PT fields so
  you can translate later in the admin UI.

For localized fields, use nested JSON objects or flat CSV columns such as
`title_en`, `title_es`, `title_pt`, `contentMarkdown_en`,
`contentMarkdown_es`, and `contentMarkdown_pt`.

The importer writes normalized content to `data/content.json`. The public pages
and admin dashboard read that file as the source of truth.
