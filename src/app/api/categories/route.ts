import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { getDocumentClient } from "@/lib/dynamodb";
import { handleApiError } from "@/lib/http";
import { categories } from "@/lib/products";

const categorySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/),
  name: z.string().trim().min(1).max(80),
  image: z.string().url().refine((value) => new URL(value).protocol === "https:"),
  count: z.string().trim().min(1).max(40),
}).strict();

function getCategoryTable(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const configured = getDocumentClient();
  return configured ?? NextResponse.json({ error: "Category writes require a configured DynamoDB table." }, { status: 503 });
}

export async function GET() {
  try {
    const configured = getDocumentClient();
    if (!configured) return NextResponse.json({ categories, source: "demo" });

    const response = await configured.client.send(new QueryCommand({
      TableName: configured.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "CATEGORIES" },
    }));
    return NextResponse.json({ categories: response.Items ?? [], source: "dynamodb" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = getCategoryTable(request);
    if (access instanceof NextResponse) return access;
    const category = categorySchema.parse(await request.json());
    const key = { pk: `CATEGORY#${category.id}`, sk: "DETAILS" };
    const existing = await access.client.send(new GetCommand({ TableName: access.tableName, Key: key }));
    if (existing.Item) return NextResponse.json({ error: "That category ID is already in use." }, { status: 409 });

    await access.client.send(new PutCommand({
      TableName: access.tableName,
      Item: {
        ...key,
        GSI1PK: "CATEGORIES",
        GSI1SK: `CATEGORY#${category.id}`,
        entityType: "CATEGORY",
        ...category,
        updatedAt: new Date().toISOString(),
      },
      ConditionExpression: "attribute_not_exists(pk)",
    }));
    return NextResponse.json({ category, mode: "dynamodb" }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = getCategoryTable(request);
    if (access instanceof NextResponse) return access;
    const category = categorySchema.parse(await request.json());
    const key = { pk: `CATEGORY#${category.id}`, sk: "DETAILS" };
    const existing = await access.client.send(new GetCommand({ TableName: access.tableName, Key: key }));
    if (!existing.Item) return NextResponse.json({ error: "Category not found." }, { status: 404 });

    await access.client.send(new PutCommand({
      TableName: access.tableName,
      Item: {
        ...key,
        GSI1PK: "CATEGORIES",
        GSI1SK: `CATEGORY#${category.id}`,
        entityType: "CATEGORY",
        ...category,
        updatedAt: new Date().toISOString(),
      },
    }));
    return NextResponse.json({ category, mode: "dynamodb" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = getCategoryTable(request);
    if (access instanceof NextResponse) return access;
    const id = z.string().regex(/^[a-z0-9-]{1,80}$/).parse(request.nextUrl.searchParams.get("id"));
    const key = { pk: `CATEGORY#${id}`, sk: "DETAILS" };
    const existing = await access.client.send(new GetCommand({ TableName: access.tableName, Key: key }));
    if (!existing.Item) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    await access.client.send(new DeleteCommand({ TableName: access.tableName, Key: key }));
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
