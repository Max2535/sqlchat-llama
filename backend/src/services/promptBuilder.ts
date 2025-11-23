import { getSchema, summarizeSchema } from "./schemaStore";

export function buildSystemPrompt() {
  const schema = getSchema();
  if (!schema) throw new Error("Schema not loaded");

  const schemaSummary = summarizeSchema(schema);

  return `
You are an expert SQL assistant for Microsoft SQL Server.
Use the following schema ONLY:

${schemaSummary}

Rules:
- Use only tables/columns from the schema.
- Never hallucinate columns.
- Default SQL = SELECT.
- Use TOP 100 for large result sets.
- Output JSON only:
{
  "sql": "...",
  "analysis": "..."
}
`.trim();
}
