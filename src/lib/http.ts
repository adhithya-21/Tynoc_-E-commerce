import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", details: error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  console.error("API request failed:", error);
  return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
}
