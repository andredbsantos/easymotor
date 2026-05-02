import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE = "easymotor_admin_session";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function sessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    "easymotor-dev-session-secret-change-me"
  );
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString(
    "base64url",
  );
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!token?.includes(".")) {
    return false;
  }

  const dot = token.lastIndexOf(".");
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload);

  if (signature.length !== expected.length) {
    return false;
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false;
  }

  try {
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };

    return typeof json.exp === "number" && json.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function getAdminSessionFromRequest(request: NextRequest) {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
}

export function adminSessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";

  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function expectedAdminCredentials() {
  const username = process.env.ADMIN_USERNAME ?? "test";
  const password = process.env.ADMIN_PASSWORD ?? "test123";

  return { username, password };
}
