import "server-only";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let documentClient: DynamoDBDocumentClient | undefined;

export function getDocumentClient() {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) return null;

  if (!documentClient) {
    documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({
      region: process.env.AWS_REGION ?? "us-east-1",
      ...(process.env.DYNAMODB_ENDPOINT
        ? { endpoint: process.env.DYNAMODB_ENDPOINT, credentials: { accessKeyId: "local", secretAccessKey: "local" } }
        : {}),
    }));
  }
  return { client: documentClient, tableName };
}
