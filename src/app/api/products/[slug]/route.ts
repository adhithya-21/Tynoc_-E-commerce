import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { getDocumentClient } from "@/lib/dynamodb";
import { products } from "@/lib/products";
import { handleApiError } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const configured = getDocumentClient();
    const product = configured
      ? (await configured.client.send(new QueryCommand({
        TableName: configured.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
        ExpressionAttributeValues: { ":pk": "PRODUCTS", ":sk": `SLUG#${slug}` },
      }))).Items?.[0]
      : products.find((item) => item.slug === slug);

    return product
      ? NextResponse.json({ product })
      : NextResponse.json({ error: "Product not found." }, { status: 404 });
  } catch (error) {
    return handleApiError(error);
  }
}
