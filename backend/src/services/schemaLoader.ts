import { getPool } from "./dbClient";
import { TableSchema } from "./schemaStore";

export async function loadSchemaFromDb(): Promise<TableSchema> {
  const pool = await getPool();

  // Load table names
  const tablesRes = await pool.request().query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
  `);

  const schema: TableSchema = {};

  for (const row of tablesRes.recordset) {
    const table = row.TABLE_NAME;

    const columnsRes = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);

    schema[table] = columnsRes.recordset.map((col: any) => ({
      name: col.COLUMN_NAME,
      type: col.DATA_TYPE
    }));
  }

  return schema;
}
