/**
 * Mapping from editor mode strings to human-readable labels.
 * Includes both SQL and JSON/NoSQL mode identifiers.
 */
const MODE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  "text/x-sql": "SQL",
  sql: "SQL",
  "text/x-pgsql": "PostgreSQL",
  "text/x-mysql": "MySQL",
  graphql: "GraphQL",
  json: "JSON",
  "application/json": "JSON",
};

export function getModeLabel(mode: string | undefined): string {
  if (!mode) return "Code";

  return MODE_LABELS[mode] || mode;
}
