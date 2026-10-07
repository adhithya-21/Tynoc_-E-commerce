import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const tableName = process.env.DYNAMODB_TABLE_NAME;
const region = process.env.AWS_REGION ?? "us-east-1";
const sourceUrl = process.env.SEED_SOURCE_URL ?? "http://localhost:3000";

if (!tableName) {
  throw new Error("Set DYNAMODB_TABLE_NAME before running the catalog seed script.");
}

async function readSeed(path, key) {
  const response = await fetch(`${sourceUrl}${path}`);
  if (!response.ok) throw new Error(`Could not fetch ${path} (${response.status}). Start the app in demo mode first.`);
  const body = await response.json();
  if (!Array.isArray(body[key])) throw new Error(`${path} did not return a ${key} array.`);
  return body[key];
}

async function seed() {
  const [products, categories] = await Promise.all([
    readSeed("/api/products", "products"),
    readSeed("/api/categories", "categories"),
  ]);
  const now = new Date().toISOString();
  const items = [
    ...products.map((product) => ({
      pk: `PRODUCT#${product.id}`,
      sk: "DETAILS",
      GSI1PK: "PRODUCTS",
      GSI1SK: `SLUG#${product.slug}`,
      entityType: "PRODUCT",
      ...product,
      updatedAt: now,
    })),
    ...categories.map((category) => {
      const id = category.id ?? category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return {
        pk: `CATEGORY#${id}`,
        sk: "DETAILS",
        GSI1PK: "CATEGORIES",
        GSI1SK: `CATEGORY#${id}`,
        entityType: "CATEGORY",
        id,
        ...category,
        updatedAt: now,
      };
    }),
  ];
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    region,
    ...(process.env.DYNAMODB_ENDPOINT
      ? { endpoint: process.env.DYNAMODB_ENDPOINT, credentials: { accessKeyId: "local", secretAccessKey: "local" } }
      : {}),
  }));

  for (let start = 0; start < items.length; start += 25) {
    let pending = items.slice(start, start + 25).map((Item) => ({ PutRequest: { Item } }));
    for (let attempt = 0; pending.length > 0 && attempt < 5; attempt += 1) {
      const result = await client.send(new BatchWriteCommand({ RequestItems: { [tableName]: pending } }));
      pending = result.UnprocessedItems?.[tableName] ?? [];
      if (pending.length > 0) await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
    if (pending.length > 0) throw new Error(`DynamoDB did not accept all seed records in batch ${start / 25 + 1}.`);
  }

  console.info(`Seeded ${products.length} products and ${categories.length} categories into ${tableName}.`);
  client.destroy();
}

seed().catch((error) => {
  console.error("Catalog seeding failed:", error);
  process.exitCode = 1;
});
