import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDocumentClient } from "@/lib/dynamodb";
import { handleApiError } from "@/lib/http";
import { getOrCreateUserId, withUserSession } from "@/lib/session";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const userId = getOrCreateUserId(request);
    const configured = getDocumentClient();
    if (!configured) {
      return withUserSession(NextResponse.json({ user: { id: userId, name: "", email: "" }, mode: "demo" }), userId);
    }
    const result = await configured.client.send(new GetCommand({
      TableName: configured.tableName,
      Key: { pk: `USER#${userId}`, sk: "PROFILE" },
    }));
    return withUserSession(NextResponse.json({
      user: result.Item ?? { id: userId, name: "", email: "" },
      mode: "dynamodb",
    }), userId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const profile = profileSchema.parse(await request.json());
    const userId = getOrCreateUserId(request);
    const configured = getDocumentClient();
    const user = { id: userId, ...profile, updatedAt: new Date().toISOString() };
    if (configured) {
      await configured.client.send(new PutCommand({
        TableName: configured.tableName,
        Item: { pk: `USER#${userId}`, sk: "PROFILE", ...user, entityType: "USER" },
      }));
    }
    return withUserSession(NextResponse.json({ user, mode: configured ? "dynamodb" : "demo" }), userId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getOrCreateUserId(request);
    const configured = getDocumentClient();
    if (configured) {
      await Promise.all(["PROFILE", "CART", "WISHLIST"].map((sk) =>
        configured.client.send(new DeleteCommand({
          TableName: configured.tableName,
          Key: { pk: `USER#${userId}`, sk },
        })),
      ));
    }
    const response = NextResponse.json({ deleted: true, mode: configured ? "dynamodb" : "demo" });
    response.cookies.set("form-field-session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
