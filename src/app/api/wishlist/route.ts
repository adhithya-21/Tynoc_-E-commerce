import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDocumentClient } from "@/lib/dynamodb";
import { handleApiError } from "@/lib/http";
import { getOrCreateUserId, withUserSession } from "@/lib/session";

const toggleSchema = z.object({
  productId: z.string().min(1).max(128),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const userId = getOrCreateUserId(request);
    const configured = getDocumentClient();
    if (!configured) return withUserSession(NextResponse.json({ productIds: [], mode: "demo" }), userId);

    const response = await configured.client.send(new GetCommand({
      TableName: configured.tableName,
      Key: { pk: `USER#${userId}`, sk: "WISHLIST" },
    }));
    return withUserSession(NextResponse.json({ productIds: response.Item?.productIds ?? [], mode: "dynamodb" }), userId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = toggleSchema.parse(await request.json());
    const userId = getOrCreateUserId(request);
    const configured = getDocumentClient();
    if (!configured) return withUserSession(NextResponse.json({ ok: true, mode: "demo" }), userId);

    const product = await configured.client.send(new GetCommand({
      TableName: configured.tableName,
      Key: { pk: `PRODUCT#${input.productId}`, sk: "DETAILS" },
    }));
    if (!product.Item) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const key = { pk: `USER#${userId}`, sk: "WISHLIST" };
    const result = await configured.client.send(new GetCommand({ TableName: configured.tableName, Key: key }));
    const current = (result.Item?.productIds ?? []) as string[];
    const productIds = current.includes(input.productId)
      ? current.filter((id) => id !== input.productId)
      : [...current, input.productId];
    await configured.client.send(new PutCommand({
      TableName: configured.tableName,
      Item: { ...key, productIds, updatedAt: new Date().toISOString() },
    }));
    return withUserSession(NextResponse.json({ ok: true, productIds, mode: "dynamodb" }), userId);
  } catch (error) {
    return handleApiError(error);
  }
}
