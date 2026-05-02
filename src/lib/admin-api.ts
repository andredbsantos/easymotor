import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminSessionFromRequest,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import {
  deleteJsonRecord,
  listJsonRecords,
  upsertJsonRecord,
} from "@/lib/json-content";
import type { CollectionName } from "@/lib/types";

export function verifyAdminRequest(request: NextRequest) {
  const token = getAdminSessionFromRequest(request);

  return verifyAdminSessionToken(token);
}

export function forbidden() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function listRecords(collectionName: CollectionName) {
  const items = await listJsonRecords(collectionName);
  return NextResponse.json({ items });
}

export async function upsertRecord(
  collectionName: CollectionName,
  request: NextRequest,
) {
  const body = await request.json();
  const record = await upsertJsonRecord(collectionName, body);
  return NextResponse.json({ item: record });
}

export async function deleteRecord(
  collectionName: CollectionName,
  request: NextRequest,
) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await deleteJsonRecord(collectionName, id);

  return NextResponse.json({ ok: true });
}

export function adminCollectionRoute(collectionName: CollectionName) {
  return {
    async GET(request: NextRequest) {
      const admin = verifyAdminRequest(request);
      return admin ? listRecords(collectionName) : forbidden();
    },
    async POST(request: NextRequest) {
      const admin = verifyAdminRequest(request);
      return admin ? upsertRecord(collectionName, request) : forbidden();
    },
    async PUT(request: NextRequest) {
      const admin = verifyAdminRequest(request);
      return admin ? upsertRecord(collectionName, request) : forbidden();
    },
    async DELETE(request: NextRequest) {
      const admin = verifyAdminRequest(request);
      return admin ? deleteRecord(collectionName, request) : forbidden();
    },
  };
}
