import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminSessionFromRequest,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

export async function GET(request: NextRequest) {
  const token = getAdminSessionFromRequest(request);

  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
