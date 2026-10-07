import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export function requireAdmin(request: NextRequest) {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  const suppliedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!configuredToken) {
    return NextResponse.json({ error: "Catalog administration is not configured." }, { status: 503 });
  }

  const expected = Buffer.from(configuredToken);
  const supplied = Buffer.from(suppliedToken);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: "Administrator authentication is required." }, { status: 401 });
  }
  return null;
}
