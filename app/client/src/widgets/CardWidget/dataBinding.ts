/**
 * Helpers for the two flows that bind a query to a Card:
 *
 * - one-click binding ("Connect data"), which knows the real column names the
 *   user mapped and so can bind exact fields;
 * - sniping mode ("Display on UI" -> pick a widget), which only receives a
 *   binding string and has to resolve the fields at runtime.
 *
 * Both produce optional-chained expressions on purpose. Binding happens before
 * the query has run, so `data` is undefined at that moment, and it can also
 * come back as an empty array or a bare object. Without `?.` the generated
 * bindings throw and the card shows an error the instant it is bound.
 */

/**
 * Turns a binding like `{{Query1.data}}` into the expression for the single
 * record a Card displays — `Query1.data?.[0]`. Returns null when the value is
 * not a binding, so callers can leave it untouched rather than corrupt it.
 */
export function getRecordExpression(binding: unknown): string | null {
  const trimmed = typeof binding === "string" ? binding.trim() : "";

  if (!trimmed.startsWith("{{") || !trimmed.endsWith("}}")) return null;

  const inner = trimmed.slice(2, -2).trim();

  return inner ? `${inner}?.[0]` : null;
}

/**
 * True when a column name can be safely embedded in a binding. A name
 * containing the closing delimiter would terminate the `{{ }}` expression
 * early no matter how it is quoted, producing a broken binding.
 */
export function isBindableColumnName(column: unknown): column is string {
  return (
    typeof column === "string" && column.length > 0 && !column.includes("}}")
  );
}

/**
 * Binds a known column off the record, e.g. `{{Query1.data?.[0]?.["name"]}}`.
 *
 * Bracket notation rather than dot: column names come from the datasource and
 * routinely contain spaces or hyphens — Google Sheets headers ("First Name")
 * especially, and quoted SQL identifiers too — which dot notation cannot
 * express. JSON.stringify quotes and escapes the name correctly.
 */
export function buildFieldBinding(record: string, column: string): string {
  return `{{${record}?.[${JSON.stringify(column)}]}}`;
}

/**
 * Used when the column names are unknown (sniping mode). Resolves the common
 * names at runtime and falls back to the first string field, so binding any
 * shape of record still shows something rather than an empty card.
 */
export function buildGuessedTitleBinding(record: string): string {
  return (
    `{{${record}?.title ?? ${record}?.name ?? ` +
    `Object.values(${record} ?? {}).find((value) => typeof value === "string") ?? ""}}`
  );
}

/** Subtitle equivalent; an empty subtitle is a normal, unremarkable state. */
export function buildGuessedSubtitleBinding(record: string): string {
  return `{{${record}?.subtitle ?? ${record}?.description ?? ""}}`;
}
