type Column = { name: string; type: string };
type TableSchema = Record<string, Column[]>;

export function parseDDL(ddl: string): TableSchema {
  const tables: TableSchema = {};
  const blocks = ddl.split(/CREATE\s+TABLE/i).slice(1); // ตัดส่วนก่อนหน้าออก

  for (const block of blocks) {
    const headerMatch = block.match(/^\s*([A-Za-z0-9_\[\]]+)\s*\(([\s\S]+?)\);/m);
    if (!headerMatch) continue;

    const tableNameRaw = headerMatch[1];
    const columnsBlock = headerMatch[2];

    const tableName = tableNameRaw.replace(/\[|\]/g, "");
    const lines = columnsBlock.split(/\r?\n/).map((l) => l.trim());

    const cols: Column[] = [];

    for (const line of lines) {
      if (!line || line.startsWith("PRIMARY KEY") || line.startsWith("CONSTRAINT"))
        continue;
      const clean = line.replace(/,$/, "");
      const parts = clean.split(/\s+/);
      const colNameRaw = parts[0];
      const colType = parts[1] || "UNKNOWN";
      const colName = colNameRaw.replace(/\[|\]/g, "");
      cols.push({ name: colName, type: colType });
    }

    tables[tableName] = cols;
  }

  return tables;
}

