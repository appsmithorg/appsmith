import { z } from "zod";
import { RAW_EXPRESSION, storedId } from "./schema.js";

// M4-T2 create_mongo_query — a STRUCTURED MongoDB query builder, the NoSQL analog of create_query. The agent never
// authors a raw Mongo command string or raw `{{ }}` bindings. The compiler emits the Mongo plugin's `formData`
// command (FIND / INSERT / UPDATE / DELETE) from validated identifiers, embeds every LITERAL value as a compile-time
// JSON.stringify token (which cannot break out of its JSON position), and emits every WIDGET reference as a checked
// `{{ Widget.path }}` binding. `smartSubstitution` is forced ON, so at runtime the Mongo plugin parameterizes each
// binding — string values are JSON-encoded (DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue) BEFORE
// substitution, the Mongo equivalent of a SQL prepared statement. This bounds injection (identifiers are
// allow-listed and quoted; values are parameterized) and preserves the "agents never author raw expressions"
// invariant.
//
// Filter OPERATORS are a closed enum (`op`) that the compiler maps to the Mongo operator token (`$ne`, `$gt`, …) —
// the same pattern the SQL builder uses for its `op` enum. Agent-supplied field names still cannot contain `$`, so the
// only `$`-prefixed keys in an emitted body are compiler-owned. DATE values are a `{ date: '<ISO 8601>' }` literal
// (regex-validated, JSON-encoded) or a widget reference tagged `as: 'date'`; both are emitted inside a compiler-owned
// `{ "$date": … }` wrapper, which the Mongo plugin's Document.parse reads as extended JSON and stores as a BSON date.

// A Mongo collection name: a plain identifier. No quote/backslash/brace/`$`/dot, so it is safe to embed as a bare
// JSON string value and cannot carry structure.
const MONGO_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const mongoCollection = z
  .string()
  .min(1)
  .max(128)
  .regex(MONGO_IDENTIFIER, "must be a plain collection identifier");

// A Mongo field name: a plain identifier or a dotted path (Mongo dot-notation). The charset excludes `"` `\` `{` `}`
// `$` so a field name can neither break out of its double-quoted JSON key nor inject an operator (e.g. `$where`) or a
// new document key.
const mongoField = z
  .string()
  .min(1)
  .max(128)
  .regex(
    /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/,
    "must be a field name or dotted path (plain identifiers)",
  );

// Binding (query/widget) identifier + property path — the same vocabulary the SQL builder uses.
const bindingIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");
const propertyPath = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z_][A-Za-z0-9_.]*$/, "must be a dotted identifier path");

// A scalar literal that cannot contain expression/template syntax (mirrors the SQL builder's literalScalar).
// U+2028/U+2029 are included for the same reason schema.ts documents: JSON.stringify does NOT escape them,
// so a value carrying one can break out of the emitted string literal on an older JS engine.
const literalScalar = z.union([
  z
    .string()
    .max(1000)
    .refine((value) => !RAW_EXPRESSION.test(value), "no template syntax"),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

// An ISO 8601 date or date-time (calendar date, optional time with Z or a numeric offset). The charset is digits,
// `-` `:` `.` `T` `Z` `+` only, so a date literal can never carry quotes, braces, or `$`. The calendar fields are
// range-checked explicitly (V8's Date.parse silently rolls 2026-02-30 forward to March), so an impossible date is
// rejected up front rather than stored as a different day.
const ISO_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-](\d{2}):(\d{2}))?)?$/;

function isRealIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);

  if (!match) return false;

  const [, y, mo, d, h, mi, s, oh, om] = match;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth &&
    (h === undefined || Number(h) <= 23) &&
    (mi === undefined || Number(mi) <= 59) &&
    (s === undefined || Number(s) <= 59) &&
    (oh === undefined || Number(oh) <= 14) &&
    (om === undefined || Number(om) <= 59)
  );
}

const dateLiteral = z
  .string()
  .max(40)
  .regex(ISO_DATE, "must be an ISO 8601 date or date-time")
  .refine(isRealIsoDate, "must be a real calendar date");

// Relaxed Extended JSON (`Document.parse` in the Mongo plugin) accepts `{ "$date": … }` only as a full RFC 3339
// date-time with an offset; a calendar date or a time without seconds/offset fails the whole command. Normalise
// what the ISO_DATE grammar admits: date-only → midnight UTC, missing seconds → `:00`, missing offset → `Z`.
export function normalizeIsoDateTime(value: string): string {
  const match = ISO_DATE.exec(value);

  if (!match) throw new Error(`not an ISO 8601 date: ${value}`);

  const [, y, mo, d, h, , s] = match;

  if (h === undefined) return `${y}-${mo}-${d}T00:00:00Z`;

  const seconds = s === undefined ? ":00" : "";
  const timePart = value.slice(value.indexOf("T"));
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(timePart);

  if (hasOffset) {
    if (s !== undefined) return value;

    // Insert the seconds before the offset.
    const offset = timePart.slice(-1) === "Z" ? "Z" : timePart.slice(-6);
    const head = value.slice(0, value.length - offset.length);

    return `${head}${seconds}${offset}`;
  }

  return `${value}${seconds}Z`;
}

// The ONLY place dynamic data enters a Mongo command: a literal (embedded as a compile-time JSON token), a date
// literal (embedded inside a compiler-owned `{ "$date": "<iso>" }` so the plugin stores a BSON date, not a string),
// or a widget reference (emitted as a checked `{{ }}` binding, parameterized at runtime by smart substitution;
// `as: 'date'` wraps the binding in the same `$date` wrapper for datepicker values).
const widgetRef = z
  .object({
    widget: bindingIdentifier,
    property: propertyPath,
    as: z.enum(["date"]).optional(),
  })
  .strict()
  // `as: 'date'` wraps the runtime value in `$date`, which the plugin only accepts as a full date-time with an
  // offset. A DatePicker's `selectedDate` is exactly that (ISO 8601 with offset, whatever its display format);
  // other properties (a text input, the legacy picker's formatted text) are not, and there is no expression
  // position in which to normalise them, so the tag is limited to that property.
  .refine(
    (ref) =>
      ref.as !== "date" ||
      ref.property === "selectedDate" ||
      ref.property.endsWith(".selectedDate"),
    {
      message:
        "as: 'date' is only valid on a DatePicker's selectedDate (an ISO 8601 date-time with offset)",
      path: ["as"],
    },
  );
// A run-time parameter passed by a JS-object function: `Query.run({ title: … })` makes `this.params.title` available
// inside the query. Emitted as the checked binding `{{ this.params.<name> }}` (SAFE_BINDING admits it: `this` is a
// plain identifier and `params.<name>` a dotted path), parameterised by smart substitution like a widget ref. This
// is how a computed value (a normalised list, a converted number, a built document) reaches a Mongo write without
// any expression appearing in the query.
const paramRef = z
  .object({
    param: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "must be a plain identifier"),
    as: z.enum(["date"]).optional(),
  })
  .strict();
const valueRef = z.union([
  z.object({ literal: literalScalar }).strict(),
  z.object({ date: dateLiteral }).strict(),
  widgetRef,
  paramRef,
]);
// `in` / `nin` take a literal LIST (each element a scalar literal) or a widget reference to an array-valued property
// (a multiselect's selectedOptionValues) that smart substitution serializes as a JSON array.
const listValueRef = z.union([
  z.object({ literal: z.array(literalScalar).min(1).max(100) }).strict(),
  widgetRef,
  paramRef,
]);

const fieldValue = z.object({ field: mongoField, value: valueRef }).strict();

// Filter operators: a CLOSED enum mapped by the compiler to the Mongo token. `eq` (the default) emits the plain
// `"field": <value>` form the builder always produced; every other op emits `"field": { "$op": <value> }`.
const filterOp = z.enum([
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "nin",
  "exists",
]);
const MONGO_OPERATORS: Record<
  Exclude<z.infer<typeof filterOp>, "eq">,
  string
> = {
  ne: "$ne",
  gt: "$gt",
  gte: "$gte",
  lt: "$lt",
  lte: "$lte",
  in: "$in",
  nin: "$nin",
  exists: "$exists",
};

const filterClause = z
  .object({
    field: mongoField,
    op: filterOp.optional(),
    value: z.union([valueRef, listValueRef]),
  })
  .strict()
  .superRefine((clause, ctx) => {
    const op = clause.op ?? "eq";
    const isList =
      "literal" in clause.value && Array.isArray(clause.value.literal);
    const isWidget = "widget" in clause.value || "param" in clause.value;

    if (op === "in" || op === "nin") {
      if (!isList && !isWidget) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: `${op} needs a literal list or an array-valued widget reference`,
        });
      }

      // `$in: { "$date": … }` is not a list; refuse at spec time rather than as a plugin error.
      if (
        ("widget" in clause.value || "param" in clause.value) &&
        clause.value.as === "date"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value", "as"],
          message: `as: 'date' is not valid with ${op}`,
        });
      }

      return;
    }

    if (isList) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: `a literal list is only valid with in / nin`,
      });
    }

    if (op === "exists") {
      const isBoolean =
        "literal" in clause.value && typeof clause.value.literal === "boolean";

      if (!isBoolean) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "exists takes { literal: true | false }",
        });
      }
    }
  });

export const mongoQuerySpecSchema = z
  .object({
    name: bindingIdentifier,
    // No workspaceId: the tool resolves the workspace server-authoritatively from applicationId (cross-tenant guard),
    // exactly like create_query.
    applicationId: storedId,
    pageId: storedId,
    datasourceId: storedId,
    collection: mongoCollection,
    operation: z.enum(["FIND", "INSERT", "UPDATE", "DELETE"]),
    // FIND/UPDATE/DELETE: a filter over allow-listed fields; each clause is `{ field, op?, value }` with `op` from the
    // closed enum above (default eq) and each value a bind param (literal, date, or widget). All clauses are AND-ed.
    // On FIND it is optional (empty = all rows); on UPDATE/DELETE it is REQUIRED (min 1) so a mutation is always
    // targeted — never an accidental whole-collection write.
    filter: z.array(filterClause).max(20).optional(),
    sort: z
      .array(
        z
          .object({ field: mongoField, direction: z.enum(["ASC", "DESC"]) })
          .strict(),
      )
      .max(10)
      .optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    // INSERT: one document as validated field -> bind-param pairs.
    document: z.array(fieldValue).min(1).max(100).optional(),
    // UPDATE: the fields to set on matched documents, emitted as a `$set` update (field -> bind-param pairs). Only the
    // named fields change; the compiler owns the `$set` operator, so an agent can never author a raw Mongo operator.
    update: z.array(fieldValue).min(1).max(100).optional(),
    // UPDATE/DELETE: false (default) targets ONE matched document (limit SINGLE); true targets ALL matches (ALL).
    multi: z.boolean().optional(),
  })
  .strict()
  // Each operation admits only its own shaping fields; reject a mismatched field so the agent gets clear feedback
  // instead of a silently-dropped clause. Required CONTENT (document on INSERT, filter/update on UPDATE, filter on
  // DELETE) is guarded in compileMongoQuery — the same schema-permits/compiler-guards split the SQL builder uses.
  .superRefine((spec, ctx) => {
    const reject = (field: string, only: string) =>
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} is only valid on ${only}`,
        path: [field],
      });

    if (spec.operation === "FIND") {
      if (spec.document !== undefined) reject("document", "an INSERT");

      if (spec.update !== undefined) reject("update", "an UPDATE");

      if (spec.multi !== undefined) reject("multi", "an UPDATE or DELETE");
    } else if (spec.operation === "INSERT") {
      for (const f of ["filter", "sort", "limit", "update", "multi"] as const) {
        if (spec[f] !== undefined) reject(f, "a FIND/UPDATE/DELETE");
      }
    } else if (spec.operation === "UPDATE") {
      for (const f of ["sort", "limit", "document"] as const) {
        if (spec[f] !== undefined) reject(f, "a FIND or INSERT");
      }
    } else {
      // DELETE
      for (const f of ["sort", "limit", "document", "update"] as const) {
        if (spec[f] !== undefined) reject(f, "another operation");
      }
    }
  });

export type MongoQuerySpec = z.infer<typeof mongoQuerySpecSchema>;
type ValueRef = z.infer<typeof valueRef>;
type ListValueRef = z.infer<typeof listValueRef>;
type FieldValue = z.infer<typeof fieldValue>;
type FilterClause = z.infer<typeof filterClause>;

const MAX_BODY_BYTES = 8 * 1024;

// Every `{{ ... }}` in a compiled Mongo body must be a compiler-emitted WIDGET binding (an identifier property path).
// Literals are embedded as JSON tokens, never bindings — so, unlike SQL, a `{{ }}` here is ONLY ever a widget path.
const SAFE_BINDING =
  /^\{\{ [A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_.]* \}\}$/;

// Emit a single value into a JSON value position. A literal is JSON-encoded at compile time (quotes/backslashes
// escaped, so it cannot break out); a widget reference is a bare, checked `{{ }}` binding — placed WITHOUT surrounding
// quotes because smart substitution supplies the correct JSON typing/quoting at runtime.
function emitValue(value: ValueRef | ListValueRef): string {
  if ("literal" in value) {
    return JSON.stringify(value.literal);
  }

  // A date literal: the ISO string is regex-validated (digits and date punctuation only), normalised to the full
  // date-time-with-offset form Extended JSON requires, JSON-encoded, then placed inside the compiler-owned `$date`
  // wrapper. Nothing agent-authored can reach the key position.
  if ("date" in value) {
    return `{ ${JSON.stringify("$date")}: ${JSON.stringify(normalizeIsoDateTime(value.date))} }`;
  }

  const binding =
    "param" in value
      ? `{{ this.params.${value.param} }}`
      : `{{ ${value.widget}.${value.property} }}`;

  if (!SAFE_BINDING.test(binding)) {
    throw new Error(`unsafe binding emitted: ${binding}`);
  }

  // `as: 'date'` — the datepicker's ISO string is smart-substituted (JSON-quoted) into the `$date` wrapper, which
  // Document.parse reads as an extended-JSON date; the binding itself is unchanged and still checked above.
  if (value.as === "date") {
    return `{ ${JSON.stringify("$date")}: ${binding} }`;
  }

  return binding;
}

// Emit a JSON object literal `{ "field": <value>, ... }` from validated field/value pairs. Keys are JSON-encoded
// (defense in depth on top of the identifier charset); values go through emitValue.
function emitObject(entries: FieldValue[]): string {
  const parts = entries.map(
    (entry) => `${JSON.stringify(entry.field)}: ${emitValue(entry.value)}`,
  );

  return `{ ${parts.join(", ")} }`;
}

// Emit a filter document. An `eq` clause (the default) is the plain `"field": <value>` form; any other operator wraps
// the value as `"field": { "$op": <value> }`, where the `$op` token comes from the MONGO_OPERATORS table (compiler-
// owned), never from agent text. Two clauses on one field would otherwise emit duplicate JSON keys (Document.parse
// keeps the last one, silently dropping a clause), so operator clauses on the same field are merged into a single
// operator object (`{ "$gte": …, "$lte": … }`); a repeated operator, or an equality clause next to operator clauses,
// cannot be merged and is rejected so no clause is ever silently lost.
function emitFilter(clauses: FilterClause[]): string {
  const byField = new Map<
    string,
    { equality?: string; operators: string[]; seen: Set<string> }
  >();

  for (const clause of clauses) {
    const op = clause.op ?? "eq";
    const value = emitValue(clause.value);
    const bucket = byField.get(clause.field) ?? {
      operators: [],
      seen: new Set<string>(),
    };

    if (bucket.seen.has(op)) {
      throw new Error(
        `filter field "${clause.field}" repeats the operator "${op}"; combine the values into one clause`,
      );
    }

    bucket.seen.add(op);

    if (op === "eq") {
      // A run-time binding in the equality position is emitted as `{ "$eq": <binding> }`, never bare. The browser
      // chooses each parameter's data type and the server trusts it, so a viewer who crafts the execute request
      // can send `{ "$ne": null }` typed as an object for ANY binding — bare `"field": {{ … }}` would then be an
      // operator injection that broadens the filter, while MongoDB compares the operand of `$eq` as a literal
      // value (objects with `$` keys, regexes and MinKey included) [COUNCIL: APP-16052 M3 security]. Literals and
      // `$date` literals stay plain: nothing agent-authored can become an operator there.
      bucket.equality =
        "literal" in clause.value || "date" in clause.value
          ? value
          : `{ ${JSON.stringify("$eq")}: ${value} }`;
    } else {
      bucket.operators.push(`${JSON.stringify(MONGO_OPERATORS[op])}: ${value}`);
    }

    byField.set(clause.field, bucket);
  }

  const parts = [...byField.entries()].map(([field, bucket]) => {
    if (bucket.equality !== undefined && bucket.operators.length > 0) {
      throw new Error(
        `filter field "${field}" mixes an equality clause with operator clauses; drop the plain clause or express it as its own op: 'eq' clause on another field`,
      );
    }

    const rendered =
      bucket.equality !== undefined
        ? bucket.equality
        : `{ ${bucket.operators.join(", ")} }`;

    return `${JSON.stringify(field)}: ${rendered}`;
  });

  return `{ ${parts.join(", ")} }`;
}

// Emit a Mongo `$set` update document `{ "$set": { "field": <value>, ... } }` for an UPDATE. The `$set` operator is
// compiler-owned (agent field names cannot contain `$` — mongoField charset), so a partial set only touches the named
// fields and no agent-authored Mongo operator can appear.
function emitSetUpdate(entries: FieldValue[]): string {
  return `{ ${JSON.stringify("$set")}: ${emitObject(entries)} }`;
}

// Emit a Mongo sort document `{ "field": 1, "field2": -1 }`. Direction comes from a two-value enum (never agent
// text); ASC -> 1, DESC -> -1.
function emitSort(sort: NonNullable<MongoQuerySpec["sort"]>): string {
  const parts = sort.map(
    (entry) =>
      `${JSON.stringify(entry.field)}: ${entry.direction === "ASC" ? 1 : -1}`,
  );

  return `{ ${parts.join(", ")} }`;
}

// Fail-closed defense-in-depth on the emitted body: it may contain single JSON braces, but every DOUBLE-brace pair
// must be a compiler-emitted widget binding, and there can be no `${`/backtick. Mirrors restApi.ts's assertBodySafe.
function assertBodySafe(body: string): void {
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    throw new Error("compiled Mongo query exceeds the size limit");
  }

  if (/\$\{|`/.test(body)) {
    throw new Error("compiled Mongo query contains forbidden template syntax");
  }

  const openings = (body.match(/\{\{/g) ?? []).length;
  const closings = (body.match(/\}\}/g) ?? []).length;
  const bindings = body.match(/\{\{ [^}]* \}\}/g) ?? [];

  if (
    openings !== closings ||
    openings !== bindings.length ||
    !bindings.every((binding) => SAFE_BINDING.test(binding))
  ) {
    throw new Error("compiled Mongo query contains an unsafe binding");
  }
}

export interface CompiledMongoQuery {
  command: "FIND" | "INSERT" | "UPDATE" | "DELETE";
  collection: string;
  find?: { query: string; sort?: string; limit?: string };
  insert?: { documents: string };
  // UPDATE: the match filter, the `$set` update doc, and SINGLE/ALL. DELETE: the match filter and SINGLE/ALL.
  update?: { query: string; update: string; limit: "SINGLE" | "ALL" };
  delete?: { query: string; limit: "SINGLE" | "ALL" };
}

// Compile a structured spec into the Mongo plugin's form-command values. Every emitted JSON fragment is asserted safe
// (no unsafe binding, bounded size) before it is returned.
export function compileMongoQuery(spec: MongoQuerySpec): CompiledMongoQuery {
  if (spec.operation === "FIND") {
    const query =
      spec.filter && spec.filter.length > 0 ? emitFilter(spec.filter) : "{}";

    assertBodySafe(query);

    const find: NonNullable<CompiledMongoQuery["find"]> = { query };

    if (spec.sort && spec.sort.length > 0) {
      const sort = emitSort(spec.sort);

      assertBodySafe(sort);
      find.sort = sort;
    }

    if (spec.limit !== undefined) {
      find.limit = String(spec.limit);
    }

    return { command: "FIND", collection: spec.collection, find };
  }

  if (spec.operation === "UPDATE") {
    if (!spec.filter || spec.filter.length === 0) {
      throw new Error("UPDATE requires a filter");
    }

    if (!spec.update || spec.update.length === 0) {
      throw new Error("UPDATE requires an update");
    }

    const query = emitFilter(spec.filter);
    const update = emitSetUpdate(spec.update);

    assertBodySafe(query);
    assertBodySafe(update);

    return {
      command: "UPDATE",
      collection: spec.collection,
      update: { query, update, limit: spec.multi ? "ALL" : "SINGLE" },
    };
  }

  if (spec.operation === "DELETE") {
    if (!spec.filter || spec.filter.length === 0) {
      throw new Error("DELETE requires a filter");
    }

    const query = emitFilter(spec.filter);

    assertBodySafe(query);

    return {
      command: "DELETE",
      collection: spec.collection,
      delete: { query, limit: spec.multi ? "ALL" : "SINGLE" },
    };
  }

  if (!spec.document || spec.document.length === 0) {
    throw new Error("INSERT requires a document");
  }

  // The Mongo INSERT command expects an array of documents; we emit exactly one.
  const documents = `[${emitObject(spec.document)}]`;

  assertBodySafe(documents);

  return {
    command: "INSERT",
    collection: spec.collection,
    insert: { documents },
  };
}

// Build the ActionDTO for POST /api/v1/actions. Datasource is an EMBEDDED { id } (the server derives workspace/plugin
// from it). The Mongo plugin reads its command from `formData` — each leaf is `{ data: <value> }` (the shape
// setDataValueSafelyInFormData produces) — with smartSubstitution forced ON so widget bindings bind as parameters.
export function buildMongoActionDto(
  spec: MongoQuerySpec,
  compiled: CompiledMongoQuery,
): Record<string, unknown> {
  const formData: Record<string, unknown> = {
    command: { data: compiled.command },
    collection: { data: compiled.collection },
    smartSubstitution: { data: true },
  };

  if (compiled.command === "FIND") {
    const find: Record<string, unknown> = {
      query: { data: compiled.find!.query },
    };

    if (compiled.find!.sort !== undefined) {
      find.sort = { data: compiled.find!.sort };
    }

    if (compiled.find!.limit !== undefined) {
      find.limit = { data: compiled.find!.limit };
    }

    formData.find = find;
  } else if (compiled.command === "INSERT") {
    formData.insert = { documents: { data: compiled.insert!.documents } };
  } else if (compiled.command === "UPDATE") {
    // updateMany carries the match query, the $set update doc, and SINGLE/ALL — all smart-substituted (parameterized).
    formData.updateMany = {
      query: { data: compiled.update!.query },
      update: { data: compiled.update!.update },
      limit: { data: compiled.update!.limit },
    };
  } else {
    // DELETE
    formData.delete = {
      query: { data: compiled.delete!.query },
      limit: { data: compiled.delete!.limit },
    };
  }

  // A query that reads `this.params` only makes sense when a JS function calls it `with` values. Run any other way
  // (page load, the editor's Run button, a bare `Q.run()`) every missing param reaches Mongo as a bare `null`,
  // which on a non-_id field matches every document that lacks the field (a `multi: true` update or delete would
  // then hit all of them) and in a `$set` silently writes null. So such a query must stay MANUAL. The create
  // request cannot carry that guarantee: the server forces MANUAL on every create anyway and drops
  // `userSetOnLoad` (it is not in the request JSON view), then auto-switches the query to run on page load the
  // moment a widget binds its data unless `userSetOnLoad` is true. The create_mongo_query handler therefore pins
  // the behaviour AFTER creation through `PUT /api/v1/actions/runBehaviour/{id}?behaviour=MANUAL` (the route the
  // editor's own dropdown uses, which sets `userSetOnLoad`); the fields below only keep the DTO honest about the
  // intent [COUNCIL: APP-16052 M3 architecture].
  const usesParams = specUsesParams(spec);

  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    // A FIND is a data fetch: run it on page load so a bound widget populates without a manual trigger. INSERT,
    // UPDATE, and DELETE mutate the collection and are user-triggered, so they stay manual.
    executeOnLoad: compiled.command === "FIND" && !usesParams,
    ...(usesParams ? { runBehaviour: "MANUAL" } : {}),
    actionConfiguration: { formData },
  };
}

// True when any value in the spec is a `{ param }` reference (filter, $set entries, insert documents, in/nin lists).
export function specUsesParams(spec: MongoQuerySpec): boolean {
  const stack: unknown[] = [spec];

  while (stack.length > 0) {
    const node = stack.pop();

    if (node === null || typeof node !== "object") continue;

    if (!Array.isArray(node) && "param" in node) return true;

    stack.push(...(Array.isArray(node) ? node : Object.values(node)));
  }

  return false;
}
