import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { getDocumentClient } from "@/lib/dynamodb";
import { handleApiError } from "@/lib/http";
import { products } from "@/lib/products";
import type { Product } from "@/lib/types";

const productSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,128}$/),
  slug: z.string().regex(/^[a-z0-9-]{1,128}$/),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(4000),
  price: z.number().positive().max(100000),
  category: z.enum(["Ceramics", "Lighting", "Furniture", "Objects"]),
  image: z.string().url().refine((value) => new URL(value).protocol === "https:"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  badge: z.string().trim().max(60).optional(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0).max(1000000),
  inStock: z.boolean(),
}).strict();

function getCatalogTable(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const configured = getDocumentClient();
  return configured ?? NextResponse.json({ error: "Catalog writes require a configured DynamoDB table." }, { status: 503 });
}

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const category = request.nextUrl.searchParams.get("category");
    const configured = getDocumentClient();
    let items: Product[] = products;

    if (configured) {
      const result = await configured.client.send(new QueryCommand({
        TableName: configured.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": "PRODUCTS" },
      }));
      items = (result.Items ?? []) as Product[];
    }

    const filtered = items.filter((product) =>
      (!category || category === "All" || product.category === category) &&
      (!search || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search)),
    );
    return NextResponse.json({ products: filtered, source: configured ? "dynamodb" : "demo" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = getCatalogTable(request);
    if (access instanceof NextResponse) return access;
    const product = productSchema.parse(await request.json());
    const key = { pk: `PRODUCT#${product.id}`, sk: "DETAILS" };
    const existingProduct = await access.client.send(new GetCommand({ TableName: access.tableName, Key: key }));
    if (existingProduct.Item) return NextResponse.json({ error: "That product ID is already in use." }, { status: 409 });

    const existingSlug = await access.client.send(new QueryCommand({
      TableName: access.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
      ExpressionAttributeValues: { ":pk": "PRODUCTS", ":sk": `SLUG#${product.slug}` },
    }));
    if (existingSlug.Items?.length) return NextResponse.json({ error: "That product slug is already in use." }, { status: 409 });

    await access.client.send(new PutCommand({
      TableName: access.tableName,
      Item: {
        ...key,
        GSI1PK: "PRODUCTS",
        GSI1SK: `SLUG#${product.slug}`,
        entityType: "PRODUCT",
        ...product,
        updatedAt: new Date().toISOString(),
      },
      ConditionExpression: "attribute_not_exists(pk)",
    }));
    return NextResponse.json({ product, mode: "dynamodb" }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = getCatalogTable(request);
    if (access instanceof NextResponse) return access;
    const product = productSchema.parse(await request.json());
    const key = { pk: `PRODUCT#${product.id}`, sk: "DETAILS" };
    const existing = await access.client.send(new GetCommand({ TableName: access.tableName, Key: key }));
    if (!existing.Item) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const slugMatch = await access.client.send(new QueryCommand({
      TableName: access.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
      ExpressionAttributeValues: { ":pk": "PRODUCTS", ":sk": `SLUG#${product.slug}` },
    }));
    if (slugMatch.Items?.some((item) => item.id !== product.id)) {
      return NextResponse.json({ error: "That product slug is already in use." }, { status: 409 });
    }
    await access.client.send(new PutCommand({
      TableName: access.tableName,
      Item: {
        ...key,
        GSI1PK: "PRODUCTS",
        GSI1SK: `SLUG#${product.slug}`,
        entityType: "PRODUCT",
        ...product,
        updatedAt: new Date().toISOString(),
      },
    }));
    return NextResponse.json({ product, mode: "dynamodb" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = getCatalogTable(request);
    if (access instanceof NextResponse) return access;
    const id = z.string().regex(/^[a-z0-9-]{1,128}$/).parse(request.nextUrl.searchParams.get("id"));
    const key = { pk: `PRODUCT#${id}`, sk: "DETAILS" };
    const existing = await access.client.send(new GetCommand({ TableName: access.tableName, Key: key }));
    if (!existing.Item) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    await access.client.send(new DeleteCommand({ TableName: access.tableName, Key: key }));
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
