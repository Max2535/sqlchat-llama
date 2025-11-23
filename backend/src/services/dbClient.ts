import sql from "mssql";
import { config } from "../config";

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config.mssql as any);
  }
  return pool;
}

export async function runQuery(query: string) {
  const pool = await getPool();
  const result = await pool.request().query(query);
  return result.recordset;
}

