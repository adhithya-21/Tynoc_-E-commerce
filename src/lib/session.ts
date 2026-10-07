import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "form-field-session";

export function getOrCreateUserId(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();
}

export function withUserSession(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
