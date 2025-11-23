export function basicSqlSafetyCheck(sql: string) {
  const upper = sql.toUpperCase();
  const forbidden = ["DROP ", "TRUNCATE ", "ALTER ", "DELETE ", "UPDATE ", "INSERT "];

  if (forbidden.some((kw) => upper.includes(kw))) {
    throw new Error("Dangerous SQL detected (DDL/DML not allowed by default).");
  }
}

export function ensureTablesExist(sql: string, schemaText: string) {
  // Template-level: เบื้องต้นให้ user พึ่ง safety ที่ schema + prompt ก่อน
  // ถ้าจะเอาจริง ค่อย parse SQL เพิ่ม
  return true;
}

