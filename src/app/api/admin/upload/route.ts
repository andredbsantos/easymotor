import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminSessionFromRequest,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
}

export async function POST(request: NextRequest) {
  const token = getAdminSessionFromRequest(request);

  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filename = `${Date.now()}-${safeFileName(file.name)}`;
  const dest = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(dest, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
