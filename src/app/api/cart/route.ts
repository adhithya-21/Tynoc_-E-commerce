import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDocumentClient } from "@/lib/dynamodb";
import { handleApiError } from "@/lib/http";
import { getOrCreateUserId, withUserSession } from "@/lib/session";

const mutationSchema = z.object({
  productId: z.string().min(1).max(128),
  quantity: z.number().int().min(0).max(99).optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const userId = getOrCreateUserId(request);
    const configured = getDocumentClient();
    if (!configured) return withUserSession(NextResponse.json({ items: [], mode: "demo" }), userId);

    const response = await configured.client.send(new GetCommand({
      TableName: configured.tableName,
      Key: { pk: `USER#${userId}`, sk: "CART" },
    }));
    return withUserSession(NextResponse.json({ items: response.Item?.items ?? [], mode: "dynamodb" }), userId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = mutationSchema.parse(await request.json());
    if (input.quantity === undefined || input.quantity < 1) {
      return NextResponse.json({ error: "A quantity of at least 1 is required." }, { status: 400 });
    }
    const configured = getDocumentClient();
    if (configured) {
      const product = await configured.client.send(new GetCommand({
        TableName: configured.tableName,
        Key: { pk: `PRODUCT#${input.productId}`, sk: "DETAILS" },
      }));
      if (!product.Item) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    const userId = getOrCreateUserId(request);
    if (!configured) return withUserSession(NextResponse.json({ ok: true, mode: "demo" }, { status: 201 }), userId);

    const key = { pk: `USER#${userId}`, sk: "CART" };
    const existing = await configured.client.send(new GetCommand({ TableName: configured.tableName, Key: key }));
    const items = (existing.Item?.items ?? []) as Array<{ productId: string; quantity: number }>;
    const updatedItems = items.some((item) => item.productId === input.productId)
      ? items.map((item) => item.productId === input.productId
        ? { ...item, quantity: Math.min(99, item.quantity + input.quantity!) }
        : item)
      : [...items, { productId: input.productId, quantity: input.quantity! }];
    await configured.client.send(new PutCommand({
      TableName: configured.tableName,
      Item: { ...key, items: updatedItems, updatedAt: new Date().toISOString() },
    }));
    return withUserSession(NextResponse.json({ ok: true, mode: "dynamodb" }, { status: 201 }), userId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const input = mutationSchema.parse(await request.json());
    if (input.quantity === undefined) {
      return NextResponse.json({ error: "Quantity is required." }, { status: 400 });
    }
    const userId = getOrCreateUserId(request);
    const configured = getDocumentClient();
    if (!configured) return withUserSession(NextResponse.json({ ok: true, mode: "demo" }), userId);

    const product = await configured.client.send(new GetCommand({
      TableName: configured.tableName,
      Key: { pk: `PRODUCT#${input.productId}`, sk: "DETAILS" },
    }));
    if (!product.Item) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const key = { pk: `USER#${userId}`, sk: "CART" };
    const result = await configured.client.send(new GetCommand({ TableName: configured.tableName, Key: key }));
    const items = (result.Item?.items ?? []) as Array<{ productId: string; quantity: number }>;
    const updatedItems = input.quantity === 0
      ? items.filter((item) => item.productId !== input.productId)
      : items.map((item) => item.productId === input.productId ? { ...item, quantity: input.quantity } : item);
    await configured.client.send(new PutCommand({
      TableName: configured.tableName,
      Item: { ...key, items: updatedItems, updatedAt: new Date().toISOString() },
    }));
    return withUserSession(NextResponse.json({ ok: true, items: updatedItems, mode: "dynamodb" }), userId);
  } catch (error) {
    return handleApiError(error);
  }
}
