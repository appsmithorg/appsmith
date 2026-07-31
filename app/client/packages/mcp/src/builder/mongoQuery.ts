import { z } from "zod";

// M4-T2 create_mongo_query — a STRUCTURED MongoDB query builder, the NoSQL analog of create_query. The agent never
// authors a raw Mongo command string or raw `{{ }}` bindings. The compiler emits the Mongo plugin's `formData`
// command (FIND / INSERT) from validated identifiers, embeds every LITERAL value as a compile-time JSON.stringify
// token (which cannot break out of its JSON position), and emits every WIDGET reference as a checked
// `{{ Widget.path }}` binding. `smartSubstitution` is forced ON, so at runtime the Mongo plugin parameterizes each
// binding — string values are JSON-encoded (DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue) BEFORE
// substitution, the Mongo equivalent of a SQL prepared statement. This bounds injection (identifiers are
// allow-listed and quoted; values are parameterized) and preserves the "agents never author raw expressions"
// invariant.

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
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`|\u2028|\u2029/;
const literalScalar = z.union([
  z
    .string()
    .max(1000)
    .refine((value) => !RAW_EXPRESSION.test(value), "no template syntax"),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

// The ONLY place dynamic data enters a Mongo command: a literal (embedded as a compile-time JSON token) or a widget
// reference (emitted as a checked `{{ }}` binding, parameterized at runtime by smart substitution).
const valueRef = z.union([
  z.object({ literal: literalScalar }).strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

const fieldValue = z.object({ field: mongoField, value: valueRef }).strict();

export const mongoQuerySpecSchema = z
  .object({
    name: bindingIdentifier,
    // No workspaceId: the tool resolves the workspace server-authoritatively from applicationId (cross-tenant guard),
    // exactly like create_query.
    applicationId: z.string().min(1).max(128),
    pageId: z.string().min(1).max(128),
    datasourceId: z.string().min(1).max(128),
    collection: mongoCollection,
    operation: z.enum(["FIND", "INSERT", "UPDATE", "DELETE"]),
    // FIND/UPDATE/DELETE: an equality filter over allow-listed fields; each value is a bind param (literal or widget).
    // All clauses are AND-ed. (Range/operator filters are a deliberate future extension — equality keeps the shape
    // provably safe.) On FIND it is optional (empty = all rows); on UPDATE/DELETE it is REQUIRED (min 1) so a mutation
    // is always targeted — never an accidental whole-collection write.
    filter: z.array(fieldValue).max(20).optional(),
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
type FieldValue = z.infer<typeof fieldValue>;

const MAX_BODY_BYTES = 8 * 1024;

// Every `{{ ... }}` in a compiled Mongo body must be a compiler-emitted WIDGET binding (an identifier property path).
// Literals are embedded as JSON tokens, never bindings — so, unlike SQL, a `{{ }}` here is ONLY ever a widget path.
const SAFE_BINDING =
  /^\{\{ [A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_.]* \}\}$/;

// Emit a single value into a JSON value position. A literal is JSON-encoded at compile time (quotes/backslashes
// escaped, so it cannot break out); a widget reference is a bare, checked `{{ }}` binding — placed WITHOUT surrounding
// quotes because smart substitution supplies the correct JSON typing/quoting at runtime.
function emitValue(value: ValueRef): string {
  if ("literal" in value) {
    return JSON.stringify(value.literal);
  }

  const binding = `{{ ${value.widget}.${value.property} }}`;

  if (!SAFE_BINDING.test(binding)) {
    throw new Error(`unsafe binding emitted: ${binding}`);
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
      spec.filter && spec.filter.length > 0 ? emitObject(spec.filter) : "{}";

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

    const query = emitObject(spec.filter);
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

    const query = emitObject(spec.filter);

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

  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    // A FIND is a data fetch: run it on page load so a bound widget populates without a manual trigger. INSERT,
    // UPDATE, and DELETE mutate the collection and are user-triggered, so they stay manual.
    executeOnLoad: compiled.command === "FIND",
    actionConfiguration: { formData },
  };
}
