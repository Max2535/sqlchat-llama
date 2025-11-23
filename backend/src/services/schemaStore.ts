export type Column = { name: string; type: string };
export type TableSchema = Record<string, Column[]>;

let cachedSchema: TableSchema | null = null;

export function setSchema(schema: TableSchema) {
  cachedSchema = schema;
}

export function getSchema(): TableSchema | null {
  return cachedSchema;
}

export function summarizeSchema(schema: TableSchema): string {
  return Object.entries(schema)
    .map(
      ([table, cols]) =>
        `${table}(${cols.map((c) => c.name + " " + c.type).join(", ")})`
    )
    .join("\n");
}
