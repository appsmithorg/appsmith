import type {
  DatasourceColumns,
  DatasourceStructure,
  DatasourceTable,
} from "entities/Datasource";

/**
 * Extract table/collection names referenced in a query string by matching against known names.
 * Supports SQL (word-boundary matching, schema-qualified names) and NoSQL patterns
 * (db.collection.method(), JSON key-value references like `"from": "collection"`).
 */
export function extractReferencedTableNames(
  query: string,
  allTableNames: string[],
): Set<string> {
  const referenced = new Set<string>();

  if (!query || allTableNames.length === 0) return referenced;

  const queryLower = query.toLowerCase();

  for (const tableName of allTableNames) {
    const nameLower = tableName.toLowerCase();
    const escaped = nameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // SQL: whole-word match (handles schema-qualified names like public.users)
    const sqlPattern = new RegExp(
      `(?:^|[\\s,.(])${escaped}(?:$|[\\s,.);\`])`,
      "i",
    );

    if (sqlPattern.test(queryLower)) {
      referenced.add(tableName);
      continue;
    }

    // NoSQL: db.collectionName.method() or db.getCollection("name")
    const mongoMethodPattern = new RegExp(
      `db\\.${escaped}\\s*\\.`,
      "i",
    );

    if (mongoMethodPattern.test(queryLower)) {
      referenced.add(tableName);
      continue;
    }

    // NoSQL: collection name as a JSON string value (e.g. "from": "users", "collection": "orders")
    const jsonValuePattern = new RegExp(
      `["']\\s*${escaped}\\s*["']`,
      "i",
    );

    if (jsonValuePattern.test(queryLower)) {
      referenced.add(tableName);
    }
  }

  return referenced;
}

/**
 * Serialize a single table into a compact DDL-like line.
 * Format: TABLE name (col1 TYPE PK, col2 TYPE FK->ref_table.ref_col, ...)
 */
export function serializeTable(table: DatasourceTable): string {
  const pkColumns = new Set<string>();
  const fkMap = new Map<string, string>();

  for (const key of table.keys ?? []) {
    const cols = key.columnNames;

    if (!cols?.length) continue;

    if (key.type === "primary key") {
      for (const col of cols) {
        pkColumns.add(col);
      }
    } else if (key.type === "foreign key" && key.fromColumns?.length) {
      for (let i = 0; i < cols.length; i++) {
        const refCol =
          key.fromColumns[i] || key.fromColumns[0] || key.name || "";

        fkMap.set(cols[i], refCol);
      }
    }
  }

  const columns = (table.columns ?? []).map((col: DatasourceColumns) => {
    let entry = `${col.name} ${col.type}`;

    if (pkColumns.has(col.name)) entry += " PK";

    if (fkMap.has(col.name)) entry += ` FK->${fkMap.get(col.name)}`;

    return entry;
  });

  return `TABLE ${table.name} (${columns.join(", ")})`;
}

/**
 * Get table names that are referenced by foreign keys from the given set of tables.
 * fromColumns use "table.column" format, so we extract the table name before the dot.
 */
function getFKReferencedTableNames(
  tables: DatasourceTable[],
  referencedNames: Set<string>,
): Set<string> {
  const fkTables = new Set<string>();

  for (const table of tables) {
    if (!referencedNames.has(table.name)) continue;

    for (const key of table.keys ?? []) {
      if (key.type !== "foreign key") continue;

      for (const fromCol of key.fromColumns ?? []) {
        const dotIdx = fromCol.indexOf(".");

        if (dotIdx > 0) {
          fkTables.add(fromCol.substring(0, dotIdx));
        }
      }
    }
  }

  return fkTables;
}

/**
 * Serialize a datasource schema into a compact string for LLM context.
 *
 * Uses a tiered budget strategy:
 * 1. If full schema fits within budget, return it all.
 * 2. If over budget, serialize tables referenced in the current query (plus FK-related tables)
 *    in full, and list remaining tables as names only. Works for both SQL and NoSQL queries.
 * 3. If still over budget, hard-truncate and append a truncation notice.
 *
 * @param structure - The datasource structure from Redux
 * @param currentSql - The current query in the editor (SQL, MongoDB, etc.)
 * @param budget - Maximum character budget (default 10000)
 * @returns Serialized schema string, or undefined if no schema available
 */
export function serializeDatasourceSchema(
  structure: DatasourceStructure | undefined,
  currentSql: string,
  budget = 10000,
): string | undefined {
  if (!structure?.tables || structure.tables.length === 0) {
    return undefined;
  }

  const tables = structure.tables;
  const totalCount = tables.length;
  const header = `Database has ${totalCount} table${totalCount === 1 ? "" : "s"}.\n\n`;

  // Tier 1: Try full schema
  const fullLines = tables.map(serializeTable);
  const fullSchema = header + fullLines.join("\n");

  if (fullSchema.length <= budget) {
    return fullSchema;
  }

  // Tier 2: Prioritize SQL-referenced tables and their FK-related tables
  const allTableNames = tables.map((t) => t.name);
  const referencedNames = extractReferencedTableNames(
    currentSql,
    allTableNames,
  );

  for (const fkName of getFKReferencedTableNames(tables, referencedNames)) {
    referencedNames.add(fkName);
  }

  const priorityTables: DatasourceTable[] = [];
  const otherTableNames: string[] = [];

  for (const table of tables) {
    if (referencedNames.has(table.name)) {
      priorityTables.push(table);
    } else {
      otherTableNames.push(table.name);
    }
  }

  // Build tier-2 output
  const priorityLines = priorityTables.map(serializeTable);
  let result = header + priorityLines.join("\n");

  if (otherTableNames.length > 0) {
    result += `\n\nOther tables: ${otherTableNames.join(", ")}`;
  }

  if (result.length <= budget) {
    return result;
  }

  // Tier 3: Hard-truncate
  const truncationNotice = `\n[Schema truncated - ${priorityTables.length}/${totalCount} tables included in full]`;
  const availableSpace = budget - truncationNotice.length;

  if (availableSpace > header.length) {
    return result.substring(0, availableSpace) + truncationNotice;
  }

  return result.substring(0, budget);
}
