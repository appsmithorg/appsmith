import { z } from "zod";
import {
  HOST_NAMES,
  PROTOTYPE_PROPERTY_NAMES,
  RAW_EXPRESSION,
  entityPropertyPath,
  pageNameSchema,
  storeKeySchema,
  tableColumnName,
} from "./schema.js";

// A CLOSED, bounded expression and statement grammar for restricted JS-object functions (APP-16052). It exists so
// an agent can express the everyday logic a form needs — split and normalise a pasted list, compare two dates,
// refuse a half-filled pair of fields, pick insert vs update, pass computed values to a query — WITHOUT ever
// authoring JavaScript. The agent supplies a tree; every emitted character is owned by this compiler:
//
//   - leaves are JSON-encoded literals, or identifier/path references validated by regex;
//   - every operator and function is an enum entry mapped to a fixed template with a fixed arity;
//   - there is no call position, member position, or string position an agent value can reach un-encoded;
//   - `{{ }}`, `${`, backticks and U+2028/9 are rejected in every string (mirrors schema.ts safeText);
//   - node count, nesting depth, statement count and parameter count are all capped.
//
// What is deliberately NOT here: arbitrary member access, calling anything but a named query's `.run()`, loops
// other than a bounded `forEach` over an expression, `eval`/`Function`/`fetch`/globals, regular expressions from
// agent text (separators come from a named list), timers, and DOM access. A request outside the vocabulary is a
// vocabulary extension in a reviewed PR, never an escape hatch.

export const JS_IDENTIFIER_SOURCE = "[A-Za-z_][A-Za-z0-9_]*";
const IDENTIFIER = new RegExp(`^${JS_IDENTIFIER_SOURCE}$`);

// The binding-syntax gate is the one schema.ts defines (re-exported for jsObject.ts).
export { RAW_EXPRESSION } from "./schema.js";

// Reserved words can never be a local (param / let / into / forEach) name. Three groups, one list:
//   1. JS keywords and literals — `async function (class) {}` or `let await = …` is a SyntaxError in the worker,
//      which breaks the WHOLE collection, not just the function;
//   2. every identifier the compiler itself emits bare — `showAlert`, `storeValue`, `resetWidget`, `String`,
//      `Math`, `Set`, `item`, … — because `let showAlert = <expr>; showAlert("…")` would redirect the compiler's own
//      call to an agent-chosen function [COUNCIL: APP-16052 M2 security];
//   3. the worker's host globals and Appsmith's platform functions (HOST_NAMES), so a local can never shadow or
//      impersonate one.
const JS_KEYWORDS = [
  "await",
  "async",
  "function",
  "return",
  "const",
  "let",
  "var",
  "if",
  "else",
  "for",
  "of",
  "in",
  "do",
  "while",
  "switch",
  "case",
  "default",
  "break",
  "continue",
  "new",
  "delete",
  "typeof",
  "instanceof",
  "void",
  "class",
  "extends",
  "super",
  "import",
  "export",
  "try",
  "catch",
  "finally",
  "throw",
  "with",
  "yield",
  "static",
  "enum",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
  "debugger",
  "undefined",
  "NaN",
  "Infinity",
  "null",
  "true",
  "false",
];
const RESERVED: ReadonlySet<string> = new Set([
  ...JS_KEYWORDS,
  ...HOST_NAMES,
  ...PROTOTYPE_PROPERTY_NAMES,
  "appsmith",
  "params",
]);

export const identifier = z
  .string()
  .min(1)
  .max(128)
  .regex(IDENTIFIER, "must be a plain identifier");
// Exported so jsObject.ts validates function params with the SAME list (a second, smaller list drifted once).
export const localName = identifier.refine(
  (name) => !RESERVED.has(name),
  "is a reserved word",
);
// A key in an emitted object literal / `with` record, or a JS-object member name: `__proto__: …` in an object
// literal rewrites the created object's prototype, so prototype names are refused here as they are for store keys.
export const memberName = identifier.refine(
  (name) => !PROTOTYPE_PROPERTY_NAMES.has(name),
  "collides with an Object.prototype property name",
);
// Widget/query names — the same charset the query builders use — MINUS the worker's globals and Appsmith's
// platform functions: the name is emitted bare as `<name>.<path>` / `<name>.run()`, so `globalThis`, `eval`,
// `navigateTo`, … must never pass [COUNCIL: APP-16052 M2 security].
const bindingIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore")
  .refine(
    (name) => !HOST_NAMES.has(name),
    "is a host global, not a widget or query name",
  );
// Dot-separated identifiers with prototype / method segments refused (shared with events.ts and editPatch.ts).
const propertyPath = entityPropertyPath;

export const literalSchema = z.union([
  z
    .string()
    .max(1_000)
    .refine(
      (value) => !RAW_EXPRESSION.test(value),
      "must not contain template syntax",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);
export type Literal = z.infer<typeof literalSchema>;

// Named separators for `split`: the regex is compiler-owned; the agent picks a name. Every pattern is linear on
// the input (no `\s*X\s*` shapes, which backtrack quadratically on a run of spaces): agents `trim` per item.
const SEPARATORS = {
  comma: '","',
  newline: "/\\r?\\n/",
  commaOrNewline: "/[\\r\\n,]+/",
  whitespace: "/\\s+/",
  semicolon: '";"',
  pipe: '"|"',
} as const;

export type SeparatorName = keyof typeof SEPARATORS;
export const SEPARATOR_NAMES = Object.freeze(
  Object.keys(SEPARATORS) as [SeparatorName, ...SeparatorName[]],
);
const separatorSchema = z.enum(SEPARATOR_NAMES);

export const EXPR_MAX_NODES = 120;
export const EXPR_MAX_DEPTH = 12;

export const OPS = [
  "add",
  "sub",
  "mul",
  "div",
  "mod",
  "neg",
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "and",
  "or",
  "not",
] as const;

export type Op = (typeof OPS)[number];
// name -> [min arity, max arity]; the validator and the js-objects guide both read this table.
export const OP_ARITY: Readonly<Record<Op, readonly [number, number]>> =
  Object.freeze({
    add: [2, 8],
    sub: [2, 2],
    mul: [2, 8],
    div: [2, 2],
    mod: [2, 2],
    neg: [1, 1],
    eq: [2, 2],
    ne: [2, 2],
    gt: [2, 2],
    gte: [2, 2],
    lt: [2, 2],
    lte: [2, 2],
    and: [2, 8],
    or: [2, 8],
    not: [1, 1],
  });

// name -> [min arity, max arity]. Every function is a fixed template in compileExpr; the arity table is the only
// place a count is allowed to vary.
const FNS = Object.freeze({
  trim: [1, 1],
  lower: [1, 1],
  upper: [1, 1],
  length: [1, 1],
  concat: [2, 8],
  startsWith: [2, 2],
  endsWith: [2, 2],
  includes: [2, 2],
  split: [2, 2],
  stripPrefix: [2, 2],
  stripSuffix: [2, 2],
  replaceAll: [3, 3],
  number: [1, 1],
  string: [1, 1],
  boolean: [1, 1],
  isEmpty: [1, 1],
  round: [1, 2],
  abs: [1, 1],
  min: [2, 8],
  max: [2, 8],
  date: [1, 1],
  now: [0, 0],
  isoString: [1, 1],
  isValidDate: [1, 1],
  unique: [1, 1],
  join: [2, 2],
  first: [1, 1],
  last: [1, 1],
  map: [2, 2],
  filter: [2, 2],
  some: [2, 2],
  every: [2, 2],
  find: [2, 2],
  get: [2, 2],
  coalesce: [2, 4],
  // Row shaping (APP-16324 F2): sort, cut and summarise a list, and bucket dates for a time series.
  sortBy: [3, 3],
  slice: [2, 3],
  sum: [1, 1],
  avg: [1, 1],
  groupBy: [3, 3],
  dateBucket: [2, 2],
} as const);

export type Fn = keyof typeof FNS;
export const FN_NAMES = Object.keys(FNS) as [Fn, ...Fn[]];
// Read-only views of the tables above, so the js-objects guide is rendered from the grammar and cannot drift.
export const FN_ARITY: Readonly<Record<Fn, readonly [number, number]>> = FNS;
// Functions whose second argument is evaluated per element with `{ item }` in scope.
export const ITEM_FNS: ReadonlySet<Fn> = new Set<Fn>([
  "map",
  "filter",
  "some",
  "every",
  "find",
]);
// Functions whose trailing argument(s) must be string literals (they land in a position the compiler quotes).
export const LITERAL_TAIL: Readonly<Partial<Record<Fn, number>>> =
  Object.freeze({
    stripPrefix: 1,
    stripSuffix: 1,
    replaceAll: 2,
    join: 1,
    get: 1,
    sortBy: 2,
    dateBucket: 1,
    // groupBy is not listed: its key (argument 2) must be a literal too, but the tail counts from the end and the
    // last argument is the aggregate. exprProblem checks the key directly.
  });

// sortBy's direction and dateBucket's unit: closed sets, each choosing a fixed template.
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export const DATE_BUCKETS = ["day", "week", "month"] as const;
// The most groups groupBy builds. Past it, the call throws instead of returning a cut list.
export const GROUP_BY_MAX_GROUPS = 10000;

// groupBy's third argument: what each group's `value` is. Admitted only in that position (enforced in exprProblem).
export type GroupAggregate =
  | { count: true }
  | { sum: string }
  | { avg: string };

export type Expr =
  | Literal
  | { param: string }
  | { var: string }
  | { item: true }
  | { widget: string; property: string }
  // A column of a table's selected row, for column names that are not identifiers ("instance ids").
  | { table: string; column: string }
  | { query: string; field?: string }
  | { constant: string }
  | { store: string }
  | { op: Op; args: Expr[] }
  // `{ sep }` is admitted only as split's second argument, and a GroupAggregate only as groupBy's third (enforced in
  // exprProblem).
  | { fn: Fn; args: FnArg[] }
  | { if: Expr; then: Expr; else: Expr }
  | { object: Record<string, Expr> }
  | { array: Expr[] }
  // Call a sibling function of this object (`await this.name(args)`) or a function of another JS object of the
  // application (`await Object.fn(args)`). The corpus analysis put "calls another function" ahead of every other
  // missing construct combined (18% of distinct functions call a sibling; most non-run awaits are cross-object).
  // The callee is never an expression: a validated member name, or a validated object + member pair whose
  // existence the tool checks against the application before writing. Not allowed inside a per-item callback
  // (those are synchronous arrows).
  | { call: string | { object: string; function: string }; args?: Expr[] };

export type FnArg = Expr | { sep: SeparatorName } | GroupAggregate;

// A function argument is an Expr or one of two other shapes. This is split's `{ sep }`.
function isSepArg(arg: FnArg): arg is { sep: SeparatorName } {
  return typeof arg === "object" && arg !== null && "sep" in arg;
}

// The other shape: groupBy's aggregate. It names exactly one of count, sum or avg, so an object mixing them is not an
// aggregate and is refused, even if a caller skipped the zod schema.
function isGroupAggregate(arg: FnArg): arg is GroupAggregate {
  if (typeof arg !== "object" || arg === null || Array.isArray(arg)) {
    return false;
  }

  const keys = Object.keys(arg);

  return (
    keys.length === 1 &&
    (keys[0] === "count" || keys[0] === "sum" || keys[0] === "avg")
  );
}

// An object that names count, sum or avg but is not exactly one of them: a malformed aggregate.
function isMalformedAggregate(arg: FnArg): boolean {
  return (
    typeof arg === "object" &&
    arg !== null &&
    !Array.isArray(arg) &&
    !isGroupAggregate(arg) &&
    ("count" in arg || "sum" in arg || "avg" in arg)
  );
}

export const CALL_MAX_ARGS = 8;
// Runtime guard at every compiled `call` site: a per-object counter (`this.mcpCallDepth`, an undeclared own property
// of the JS object at run time) is incremented before the call and decremented after. The static cycle check
// cannot see editor-authored or drifted objects, so a cycle closed through hand-written code (A.f → Editor.g → A.f)
// would still recurse; the counter stops it at this depth. Parallel invocations share the counter, so the bound is
// generous. [Security follow-up on APP-16052 M5.]
export const CALL_DEPTH_LIMIT = 32;
export const CALL_DEPTH_MEMBER = "mcpCallDepth";
const callTarget = z.union([
  memberName,
  z.object({ object: bindingIdentifier, function: memberName }).strict(),
]);

const sepArg = z.object({ sep: separatorSchema }).strict();
// The field is checked as a plain, non-prototype key in exprProblem, like get's key.
const groupAggregateArg = z.union([
  z.object({ count: z.literal(true) }).strict(),
  z.object({ sum: z.string().max(128) }).strict(),
  z.object({ avg: z.string().max(128) }).strict(),
]);

export const exprSchema: z.ZodType<Expr> = z.lazy(() =>
  z.union([
    literalSchema,
    z.object({ param: localName }).strict(),
    z.object({ var: localName }).strict(),
    z.object({ item: z.literal(true) }).strict(),
    z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
    z.object({ table: bindingIdentifier, column: tableColumnName }).strict(),
    z
      .object({ query: bindingIdentifier, field: propertyPath.optional() })
      .strict(),
    z.object({ constant: memberName }).strict(),
    z.object({ store: storeKeySchema }).strict(),
    z
      .object({ op: z.enum(OPS), args: z.array(exprSchema).min(1).max(8) })
      .strict(),
    z
      .object({
        fn: z.enum(FN_NAMES),
        args: z.array(z.union([exprSchema, sepArg, groupAggregateArg])).max(8),
      })
      .strict(),
    z.object({ if: exprSchema, then: exprSchema, else: exprSchema }).strict(),
    z
      .object({
        object: z
          .record(memberName, exprSchema)
          .refine((o) => Object.keys(o).length <= 40, "at most 40 keys"),
      })
      .strict(),
    z.object({ array: z.array(exprSchema).max(50) }).strict(),
    z
      .object({
        call: callTarget,
        args: z.array(exprSchema).max(CALL_MAX_ARGS).optional(),
      })
      .strict(),
  ]),
);

// --- Statements -------------------------------------------------------------------------------------------------

export const STEPS_MAX = 40;
export const STEP_MAX_DEPTH = 4;
export const PARAMS_MAX = 8;

export type Step =
  | { let: string; value: Expr }
  | { set: string; value: Expr }
  // `onError` runs when the query rejects (a compiler-owned try/catch); the error itself is never exposed.
  | {
      run: string;
      with?: Record<string, Expr>;
      into?: string;
      onError?: Step[];
    }
  | { if: Expr; then: Step[]; else?: Step[] }
  | { forEach: Expr; as: string; do: Step[] }
  | { throw: string }
  | { return: Expr }
  | { showAlert: Expr; style?: "info" | "success" | "warning" | "error" }
  | { storeValue: string; value: Expr }
  | { resetWidget: string }
  | { showModal: string }
  | { closeModal: string }
  // Open a page, optionally with URL query parameters (`?id=...`), each a bounded expression.
  | { navigate: string; params?: Record<string, Expr> }
  // Call a sibling or another object's function for its effect, optionally keeping the result in a local.
  | {
      call: string | { object: string; function: string };
      args?: Expr[];
      into?: string;
    };

const safeMessage = z
  .string()
  .min(1)
  .max(300)
  .refine((v) => !RAW_EXPRESSION.test(v), "must not contain template syntax");

export const stepSchema: z.ZodType<Step> = z.lazy(() =>
  z.union([
    z.object({ let: localName, value: exprSchema }).strict(),
    z.object({ set: localName, value: exprSchema }).strict(),
    z
      .object({
        run: bindingIdentifier,
        with: z
          .record(memberName, exprSchema)
          .refine((o) => Object.keys(o).length <= 40, "at most 40 params")
          .optional(),
        into: localName.optional(),
        onError: z.array(stepSchema).min(1).max(STEPS_MAX).optional(),
      })
      .strict(),
    z
      .object({
        if: exprSchema,
        then: z.array(stepSchema).min(1).max(STEPS_MAX),
        else: z.array(stepSchema).min(1).max(STEPS_MAX).optional(),
      })
      .strict(),
    z
      .object({
        forEach: exprSchema,
        as: localName,
        do: z.array(stepSchema).min(1).max(STEPS_MAX),
      })
      .strict(),
    z.object({ throw: safeMessage }).strict(),
    z.object({ return: exprSchema }).strict(),
    z
      .object({
        // A literal message, or an expression rendered through String(...) at run time (the corpus shows a
        // computed message in 4% of distinct functions; the text is displayed, never evaluated).
        // A string is a message literal (safeMessage's 300-char cap applies); anything else is an expression.
        showAlert: z.union([
          safeMessage,
          exprSchema.refine((e) => typeof e !== "string", "message too long"),
        ]),
        style: z.enum(["info", "success", "warning", "error"]).optional(),
      })
      .strict(),
    z.object({ storeValue: storeKeySchema, value: exprSchema }).strict(),
    z.object({ resetWidget: bindingIdentifier }).strict(),
    z.object({ showModal: bindingIdentifier }).strict(),
    z.object({ closeModal: bindingIdentifier }).strict(),
    z
      .object({
        navigate: pageNameSchema,
        // Keys are emitted as unquoted object-literal keys, so they use memberName (no Object.prototype names).
        params: z
          .record(memberName, exprSchema)
          .refine(
            (o) => Object.keys(o).length <= 10,
            "at most 10 navigate params",
          )
          .optional(),
      })
      .strict(),
    z
      .object({
        call: callTarget,
        args: z.array(exprSchema).max(CALL_MAX_ARGS).optional(),
        into: localName.optional(),
      })
      .strict(),
  ]),
);

// --- Validation beyond the schema: arity, scoping, `item` placement, bounds ----------------------------------------

export interface ExprContext {
  params: Set<string>;
  vars: Set<string>;
  constants: Set<string>;
  // Names of this object's functions: a sibling `call` must target one of them.
  functions: Set<string>;
  // The function being validated: a direct self-call is refused (the grammar has no other unbounded construct;
  // mutual recursion across siblings or objects is not detected).
  self?: string;
  allowItem: boolean;
}

function isLiteral(expr: Expr): expr is Literal {
  return expr === null || typeof expr !== "object";
}

// A key that lands in `x?.[key]` (get, sortBy, groupBy): a plain identifier and never a prototype name, so a read
// can never reach Object.prototype.
function isPlainKey(key: string): boolean {
  return (
    IDENTIFIER.test(key) &&
    !PROTOTYPE_PROPERTY_NAMES.has(key) &&
    key !== "prototype"
  );
}

function countNodes(expr: Expr): number {
  if (isLiteral(expr)) return 1;

  if ("call" in expr) {
    return (
      1 + (expr.args ?? []).reduce((sum: number, a) => sum + countNodes(a), 0)
    );
  }

  if ("op" in expr || "fn" in expr) {
    return (
      1 +
      (expr.args as FnArg[]).reduce(
        (sum: number, arg) =>
          sum +
          (isSepArg(arg) || isGroupAggregate(arg)
            ? 1
            : countNodes(arg as Expr)),
        0,
      )
    );
  }

  if ("if" in expr) {
    return (
      1 + countNodes(expr.if) + countNodes(expr.then) + countNodes(expr.else)
    );
  }

  if ("object" in expr) {
    return (
      1 +
      Object.values(expr.object).reduce(
        (sum: number, value) => sum + countNodes(value),
        0,
      )
    );
  }

  if ("array" in expr) {
    return 1 + expr.array.reduce((sum: number, v) => sum + countNodes(v), 0);
  }

  return 1;
}

// Returns a problem description, or undefined when the expression is well-formed in this context.
export function exprProblem(
  expr: Expr,
  ctx: ExprContext,
  depth = 1,
): string | undefined {
  if (depth > EXPR_MAX_DEPTH)
    return `expression nests deeper than ${EXPR_MAX_DEPTH}`;

  if (isLiteral(expr)) return undefined;

  if ("call" in expr) {
    // The emitted call is awaited, and per-item callbacks are synchronous arrows.
    if (ctx.allowItem) {
      return "call is not allowed inside map / filter / some / every / find";
    }

    if (typeof expr.call === "string" && !ctx.functions.has(expr.call)) {
      return `unknown function "${expr.call}" on this object`;
    }

    if (typeof expr.call === "string" && expr.call === ctx.self) {
      return `"${expr.call}" may not call itself`;
    }

    if (typeof expr.call !== "string") {
      const { object } = expr.call;

      if (ctx.vars.has(object) || ctx.params.has(object)) {
        return `"${object}" is both a local name and a JS object to call`;
      }
    }

    for (const arg of expr.args ?? []) {
      const problem = exprProblem(arg, ctx, depth + 1);

      if (problem) return problem;
    }

    return undefined;
  }

  if ("param" in expr) {
    return ctx.params.has(expr.param)
      ? undefined
      : `unknown param "${expr.param}"`;
  }

  if ("var" in expr) {
    return ctx.vars.has(expr.var)
      ? undefined
      : `"${expr.var}" is used before it is declared with let / into / forEach`;
  }

  if ("item" in expr) {
    return ctx.allowItem
      ? undefined
      : "{ item } is only valid inside map / filter / some / every / find";
  }

  if ("constant" in expr) {
    return ctx.constants.has(expr.constant)
      ? undefined
      : `unknown constant "${expr.constant}"`;
  }

  if ("widget" in expr || "query" in expr || "table" in expr) {
    // A local declared with the same name as a widget or query would be read instead of the entity, so the
    // emitted `Name.path` / `Name.run()` would resolve to agent-shaped data. Refuse the collision outright.
    const name =
      "widget" in expr
        ? expr.widget
        : "table" in expr
          ? expr.table
          : expr.query;

    return ctx.vars.has(name) || ctx.params.has(name)
      ? `"${name}" is both a local name and a widget/query reference`
      : undefined;
  }

  if ("store" in expr) return undefined;

  if ("op" in expr) {
    const [min, max] = OP_ARITY[expr.op];

    if (expr.args.length < min || expr.args.length > max) {
      return `op ${expr.op} takes ${min === max ? min : `${min}-${max}`} argument(s)`;
    }

    for (const arg of expr.args) {
      const problem = exprProblem(arg, ctx, depth + 1);

      if (problem) return problem;
    }

    return undefined;
  }

  if ("fn" in expr) {
    const [min, max] = FNS[expr.fn];
    const args = expr.args as FnArg[];

    if (args.length < min || args.length > max) {
      return `fn ${expr.fn} takes ${min === max ? min : `${min}-${max}`} argument(s)`;
    }

    const literalTail = LITERAL_TAIL[expr.fn] ?? 0;

    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];

      if (isSepArg(arg)) {
        if (expr.fn !== "split" || index !== 1) {
          return "{ sep } is only valid as the second argument of split";
        }

        continue;
      }

      if (isMalformedAggregate(arg)) {
        return "fn groupBy: the aggregate must name exactly one of count, sum or avg";
      }

      if (isGroupAggregate(arg)) {
        if (expr.fn !== "groupBy" || index !== 2) {
          return "{ count }, { sum } or { avg } is only valid as the third argument of groupBy";
        }

        if ("count" in arg) {
          if (arg.count !== true) {
            return "fn groupBy: count must be { count: true }";
          }
        } else {
          const field = "sum" in arg ? arg.sum : arg.avg;

          if (typeof field !== "string" || !isPlainKey(field)) {
            return "fn groupBy: the summed or averaged field must be a plain, non-prototype identifier";
          }
        }

        continue;
      }

      if (expr.fn === "groupBy" && index === 2) {
        return "fn groupBy: argument 3 must be { count: true }, { sum: field } or { avg: field }";
      }

      if (
        (index >= args.length - literalTail ||
          (expr.fn === "groupBy" && index === 1)) &&
        typeof arg !== "string"
      ) {
        return `fn ${expr.fn}: argument ${index + 1} must be a string literal`;
      }

      // The key positions: each lands in `row?.[key]`, so it must be a plain identifier and never a prototype name.
      if (
        index === 1 &&
        (expr.fn === "get" || expr.fn === "sortBy" || expr.fn === "groupBy") &&
        !isPlainKey(arg as string)
      ) {
        return `fn ${expr.fn}: the key must be a plain, non-prototype identifier`;
      }

      if (
        expr.fn === "sortBy" &&
        index === 2 &&
        !(SORT_DIRECTIONS as readonly string[]).includes(arg as string)
      ) {
        return 'fn sortBy: the direction must be "asc" or "desc"';
      }

      if (
        expr.fn === "dateBucket" &&
        index === 1 &&
        !(DATE_BUCKETS as readonly string[]).includes(arg as string)
      ) {
        return 'fn dateBucket: the unit must be "day", "week" or "month"';
      }

      if (
        expr.fn === "round" &&
        index === 1 &&
        !(
          Number.isInteger(arg) &&
          (arg as number) >= 0 &&
          (arg as number) <= 20
        )
      ) {
        return "fn round: the precision must be an integer literal from 0 to 20";
      }

      const perItem = ITEM_FNS.has(expr.fn) && index === 1;
      const problem = exprProblem(
        arg as Expr,
        perItem ? { ...ctx, allowItem: true } : ctx,
        depth + 1,
      );

      if (problem) return problem;
    }

    if (expr.fn === "split") {
      const second = args[1];

      if (
        !(typeof second === "string") &&
        !(typeof second === "object" && second !== null && "sep" in second)
      ) {
        return "fn split: the separator must be a string literal or { sep }";
      }

      if (typeof second === "string" && second.length > 10) {
        return "fn split: a literal separator is at most 10 characters";
      }
    }

    return undefined;
  }

  if ("if" in expr) {
    return (
      exprProblem(expr.if, ctx, depth + 1) ??
      exprProblem(expr.then, ctx, depth + 1) ??
      exprProblem(expr.else, ctx, depth + 1)
    );
  }

  if ("object" in expr) {
    for (const value of Object.values(expr.object)) {
      const problem = exprProblem(value, ctx, depth + 1);

      if (problem) return problem;
    }

    return undefined;
  }

  for (const value of expr.array) {
    const problem = exprProblem(value, ctx, depth + 1);

    if (problem) return problem;
  }

  return undefined;
}

export function validateExpr(expr: Expr, ctx: ExprContext): string | undefined {
  if (countNodes(expr) > EXPR_MAX_NODES) {
    return `expression exceeds ${EXPR_MAX_NODES} nodes`;
  }

  return exprProblem(expr, ctx);
}

// Walks statements in order, threading declared locals through scope so `var` refs are declared-before-use, and
// bounds the total statement count and nesting. Returns a problem (prefixed with the statement's path, e.g.
// `steps[3].then[1]: …`) or undefined. `declared`, when given, receives the locals declared at THIS level (so a
// trailing `returns` expression can see the function's top-level lets).
export function stepsProblem(
  steps: Step[],
  ctx: ExprContext,
  depth = 1,
  counter = { count: 0 },
  declared?: Set<string>,
  path = "steps",
): string | undefined {
  if (depth > STEP_MAX_DEPTH)
    return `${path}: statements nest deeper than ${STEP_MAX_DEPTH}`;

  const vars = declared ?? new Set(ctx.vars);

  if (declared) for (const name of ctx.vars) vars.add(name);

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const at = `${path}[${index}]`;

    counter.count += 1;

    if (counter.count > STEPS_MAX)
      return `${at}: more than ${STEPS_MAX} statements`;

    const local: ExprContext = { ...ctx, vars };
    const problem = stepProblem(step, local, vars, depth, counter, at);

    if (problem) return problem;
  }

  return undefined;
}

// A local may not be declared with a name that is later used as a `run` / `widget` / `query` target: the emitted
// `Name.run()` would resolve to the local instead of the entity.
function declareLocal(
  name: string,
  vars: Set<string>,
  ctx: ExprContext,
): string | undefined {
  if (vars.has(name) || ctx.params.has(name)) {
    return `"${name}" is already declared`;
  }

  vars.add(name);

  return undefined;
}

function stepProblem(
  step: Step,
  local: ExprContext,
  vars: Set<string>,
  depth: number,
  counter: { count: number },
  at: string,
): string | undefined {
  const prefixed = (problem: string | undefined): string | undefined =>
    problem === undefined ? undefined : `${at}: ${problem}`;

  if ("let" in step) {
    if (vars.has(step.let) || local.params.has(step.let)) {
      return `${at}: "${step.let}" is already declared`;
    }

    // Validate the value BEFORE the name is in scope: `let x = { var: "x" }` is a use-before-declare.
    const problem = prefixed(validateExpr(step.value, local));

    if (problem) return problem;

    vars.add(step.let);

    return undefined;
  }

  if ("set" in step) {
    if (!vars.has(step.set))
      return `${at}: "${step.set}" must be declared with let before set`;

    return prefixed(validateExpr(step.value, local));
  }

  if ("run" in step) {
    if (vars.has(step.run) || local.params.has(step.run)) {
      return `${at}: "${step.run}" is both a local name and a query to run`;
    }

    for (const value of Object.values(step.with ?? {})) {
      const problem = prefixed(validateExpr(value, local));

      if (problem) return problem;
    }

    // The failure branch sees the scope as it was before the run: `into` is declared but never assigned there.
    if (step.onError) {
      const problem = stepsProblem(
        step.onError,
        local,
        depth + 1,
        counter,
        undefined,
        `${at}.onError`,
      );

      if (problem) return problem;
    }

    return step.into === undefined
      ? undefined
      : prefixed(declareLocal(step.into, vars, local));
  }

  if ("if" in step) {
    return (
      prefixed(validateExpr(step.if, local)) ??
      stepsProblem(
        step.then,
        local,
        depth + 1,
        counter,
        undefined,
        `${at}.then`,
      ) ??
      (step.else
        ? stepsProblem(
            step.else,
            local,
            depth + 1,
            counter,
            undefined,
            `${at}.else`,
          )
        : undefined)
    );
  }

  if ("forEach" in step) {
    if (vars.has(step.as) || local.params.has(step.as)) {
      return `${at}: "${step.as}" is already declared`;
    }

    const inner = new Set(vars);

    inner.add(step.as);

    return (
      prefixed(validateExpr(step.forEach, local)) ??
      stepsProblem(
        step.do,
        { ...local, vars: inner },
        depth + 1,
        counter,
        undefined,
        `${at}.do`,
      )
    );
  }

  if ("return" in step) return prefixed(validateExpr(step.return, local));

  // A navigate parameter is a value like any other, so it is scope-checked the same way.
  if ("navigate" in step) {
    for (const value of Object.values(step.params ?? {})) {
      const problem = prefixed(validateExpr(value, local));

      if (problem) return problem;
    }

    return undefined;
  }

  if ("call" in step) {
    const problem = prefixed(
      validateExpr({ call: step.call, args: step.args }, local),
    );

    if (problem) return problem;

    return step.into === undefined
      ? undefined
      : prefixed(declareLocal(step.into, vars, local));
  }

  if ("showAlert" in step && typeof step.showAlert !== "string") {
    return prefixed(validateExpr(step.showAlert, local));
  }

  if ("storeValue" in step) return prefixed(validateExpr(step.value, local));

  // throw / showAlert / resetWidget carry validated literals only.
  return undefined;
}

// --- Compiler ------------------------------------------------------------------------------------------------------
// Every template below is fixed text around already-validated parts. Identifiers pass IDENTIFIER / the binding
// charsets (no quote, brace, backtick, `$`), literals pass through JSON.stringify, and property paths are plain
// dotted identifiers. Nothing an agent supplies is interpolated unquoted except those validated identifiers.
//
// RECEIVER RULE: an agent expression is never the `this` of a method call. `(<expr>).includes(x)` would let a
// `{ object: { includes: <function ref> } }` node call an agent-chosen function with an agent-chosen argument, so
// every array method is called on ARRAY_OF(<expr>) — a real array, whose methods cannot be replaced from inside
// the grammar — and every string method on String(<expr>) — a primitive [COUNCIL: APP-16052 M2 security].
//
// COMPATIBILITY RULE: the emitted text IS the recognition contract. jsObject.ts classifies a body as
// compiler-authored only when its embedded definition recompiles byte for byte, so a change to ANY template
// below demotes every existing MCP-authored object to editor-authored (agents lose update access). Change a
// template only with a marker version bump (SPEC_VERSION in jsObject.ts) and an upgrade path.

const q = (value: unknown): string => JSON.stringify(value);
// Coerces an arbitrary value to a real array so array methods are always invoked on a genuine Array.
const ARRAY_OF = "((v) => Array.isArray(v) ? v : [])";
// A value as a number for sum, avg and groupBy: a number as it is, a non-empty string through Number(), and
// anything else NaN, so it is skipped. Plain Number() would count null as 0 and [5] as 5.
const NUMBER_OF =
  '((v) => typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN)';
// A slice bound: a whole number, with NaN as 0. Array.prototype.slice clamps the rest.
const INDEX_OF =
  "((n) => { const v = Math.trunc(Number(n)); return Number.isNaN(v) ? 0 : v; })";

// sortBy: a copy sorted by `row?.[key]`. Values are ranked by type first (numbers, then valid Dates, then strings,
// then everything else, empty values included), so the comparator is always consistent. Only the order within a
// rank follows the direction, so empty values stay last either way. Strings use one Intl.Collator per call.
function compileSortBy(list: string, key: string, direction: string): string {
  const sign = direction === "desc" ? "-" : "";

  return `((rows) => { const collator = new Intl.Collator(); const rank = (v) => typeof v === "number" && !Number.isNaN(v) ? 0 : v instanceof Date && !Number.isNaN(v.getTime()) ? 1 : typeof v === "string" ? 2 : 3; return [...rows].sort((x, y) => { const a = x?.[${key}]; const b = y?.[${key}]; const ra = rank(a); const rb = rank(b); if (ra !== rb) { return ra - rb; } const c = ra === 0 ? a - b : ra === 1 ? a.getTime() - b.getTime() : ra === 2 ? collator.compare(a, b) : 0; return ${sign}c; }); })(${ARRAY_OF}(${list}))`;
}

// groupBy: one `{ key, value }` row per distinct `row?.[key]`, in first-seen order. Groups live in a Map, so a data
// value such as "__proto__" is only a key, and an object key is its own group. Past GROUP_BY_MAX_GROUPS it throws.
function compileGroupBy(
  list: string,
  key: string,
  aggregate: GroupAggregate,
): string {
  const field =
    "sum" in aggregate
      ? aggregate.sum
      : "avg" in aggregate
        ? aggregate.avg
        : undefined;
  // The number helper is bound once per call, not rebuilt for every row.
  const accumulate =
    field === undefined
      ? ""
      : ` const n = num(row?.[${q(field)}]); if (Number.isFinite(n)) { group.total += n; group.n += 1; }`;
  const value =
    "count" in aggregate
      ? "group.count"
      : "sum" in aggregate
        ? "group.total"
        : "group.n === 0 ? null : group.total / group.n";

  return `((rows) => { const num = ${NUMBER_OF}; const groups = new Map(); for (const row of rows) { const k = row?.[${key}]; let group = groups.get(k); if (group === undefined) { if (groups.size >= ${GROUP_BY_MAX_GROUPS}) { throw new Error("groupBy: more than ${GROUP_BY_MAX_GROUPS} groups"); } group = { count: 0, total: 0, n: 0 }; groups.set(k, group); } group.count += 1;${accumulate} } return [...groups].map(([k, group]) => ({ key: k, value: ${value} })); })(${ARRAY_OF}(${list}))`;
}

// dateBucket: the start of the UTC day, ISO week (Monday) or month, as YYYY-MM-DD. A missing or invalid date is null.
// new Date() reads null and false as 1970, so null, undefined, "" and booleans are refused first: a SQL NULL date
// must not land in a 1970 bucket. After the week or month step, a year outside 0000-9999 is null too: toISOString
// writes such a year as "+275760" (breaking the YYYY-MM-DD shape), and getUTCFullYear is NaN for a date the step
// pushed out of range.
function compileDateBucket(date: string, unit: string): string {
  const adjust =
    unit === "month"
      ? " d.setUTCDate(1);"
      : unit === "week"
        ? " d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));"
        : "";

  return `((v) => { if (v == null || v === "" || typeof v === "boolean") { return null; } const d = new Date(v); if (Number.isNaN(d.getTime())) { return null; }${adjust} const year = d.getUTCFullYear(); if (!(year >= 0 && year <= 9999)) { return null; } return d.toISOString().slice(0, 10); })(${date})`;
}

// Refuses to call a query with an undefined parameter (see the run step in compileSteps).
const PARAMS_GUARD =
  '(($p) => { for (const $k of Object.keys($p)) { if ($p[$k] === undefined) { throw new Error("missing query parameter: " + $k); } } return $p; })';

export function compileExpr(expr: Expr): string {
  if (isLiteral(expr)) return q(expr);

  if ("call" in expr) {
    const callee =
      typeof expr.call === "string"
        ? `this.${expr.call}`
        : `${expr.call.object}.${expr.call.function}`;

    const args = (expr.args ?? []).map(compileExpr).join(", ");

    // An arrow IIFE keeps `this` (the JS object) and lets the guard wrap the awaited call as one expression. The
    // counter is checked BEFORE it is incremented and is never reset: every frame that incremented also decrements
    // in its finally, so the counter returns to exactly 0 after a trip (a reset-then-throw would leave it at -LIMIT
    // and weaken every later trip). It is an undeclared own property of `this`, not a declared JS-object variable:
    // a declared member is tracked, persisted and snapshotted per evaluation context, which drifts under overlapping
    // invocations and dispatches an eval cycle per write.
    return `(await (async () => { if ((this.${CALL_DEPTH_MEMBER} ?? 0) >= ${CALL_DEPTH_LIMIT}) { throw new Error("JS-object call depth exceeded ${CALL_DEPTH_LIMIT}: a cycle of calls was stopped"); } this.${CALL_DEPTH_MEMBER} = (this.${CALL_DEPTH_MEMBER} ?? 0) + 1; try { return await ${callee}(${args}); } finally { this.${CALL_DEPTH_MEMBER} -= 1; } })())`;
  }

  if ("param" in expr) return expr.param;

  if ("var" in expr) return expr.var;

  if ("item" in expr) return "item";

  if ("widget" in expr) return `${expr.widget}.${expr.property}`;

  if ("table" in expr) return `${expr.table}.selectedRow[${q(expr.column)}]`;

  if ("query" in expr) {
    return expr.field
      ? `${expr.query}.data?.${expr.field}`
      : `${expr.query}.data`;
  }

  if ("constant" in expr) return `this.${expr.constant}`;

  if ("store" in expr) return `appsmith.store.${expr.store}`;

  if ("op" in expr) {
    const a = expr.args.map(compileExpr);

    switch (expr.op) {
      case "add":
        return `(${a.join(" + ")})`;
      case "mul":
        return `(${a.join(" * ")})`;
      case "sub":
        return `(${a[0]} - ${a[1]})`;
      case "div":
        return `(${a[0]} / ${a[1]})`;
      case "mod":
        return `(${a[0]} % ${a[1]})`;
      case "neg":
        // Parenthesised operand: a negative literal would otherwise emit `--1`, a SyntaxError.
        return `(-(${a[0]}))`;
      case "eq":
        return `(${a[0]} === ${a[1]})`;
      case "ne":
        return `(${a[0]} !== ${a[1]})`;
      case "gt":
        return `(${a[0]} > ${a[1]})`;
      case "gte":
        return `(${a[0]} >= ${a[1]})`;
      case "lt":
        return `(${a[0]} < ${a[1]})`;
      case "lte":
        return `(${a[0]} <= ${a[1]})`;
      case "and":
        return `(${a.join(" && ")})`;
      case "or":
        return `(${a.join(" || ")})`;
      case "not":
        return `(!${a[0]})`;
    }
  }

  if ("fn" in expr) {
    const args = expr.args as FnArg[];
    // A GroupAggregate compiles inside compileGroupBy, so its slot here stays empty.
    const a = args.map((arg) =>
      isSepArg(arg)
        ? SEPARATORS[arg.sep]
        : isGroupAggregate(arg)
          ? ""
          : compileExpr(arg as Expr),
    );

    switch (expr.fn) {
      case "trim":
        return `String(${a[0]} ?? "").trim()`;
      case "lower":
        return `String(${a[0]} ?? "").toLowerCase()`;
      case "upper":
        return `String(${a[0]} ?? "").toUpperCase()`;
      case "length":
        // Operand evaluated once (an IIFE, like isEmpty/last): repeating it doubled the emitted text per nesting level.
        return `((v) => v == null ? 0 : v.length)(${a[0]})`;
      case "concat":
        return `(${a.map((x) => `String(${x} ?? "")`).join(" + ")})`;
      case "startsWith":
        return `String(${a[0]} ?? "").startsWith(${a[1]})`;
      case "endsWith":
        return `String(${a[0]} ?? "").endsWith(${a[1]})`;
      case "includes":
        return `${ARRAY_OF}(${a[0]}).includes(${a[1]})`;
      case "split":
        return `String(${a[0]} ?? "").split(${a[1]})`;
      case "stripPrefix":
        return `((s, p) => s.startsWith(p) ? s.slice(p.length) : s)(String(${a[0]} ?? ""), ${a[1]})`;
      case "stripSuffix":
        return `((s, p) => s.endsWith(p) ? s.slice(0, s.length - p.length) : s)(String(${a[0]} ?? ""), ${a[1]})`;
      case "replaceAll":
        return `String(${a[0]} ?? "").split(${a[1]}).join(${a[2]})`;
      case "number":
        return `Number(${a[0]})`;
      case "string":
        return `String(${a[0]} ?? "")`;
      case "boolean":
        return `Boolean(${a[0]})`;
      case "isEmpty":
        return `((v) => v == null || v === "" || (Array.isArray(v) && v.length === 0))(${a[0]})`;
      case "round":
        // Number(...) makes the receiver a primitive; the precision is a validated integer literal.
        return a.length === 2
          ? `Number(Number(${a[0]}).toFixed(${a[1]}))`
          : `Math.round(${a[0]})`;
      case "abs":
        return `Math.abs(${a[0]})`;
      case "min":
        return `Math.min(${a.join(", ")})`;
      case "max":
        return `Math.max(${a.join(", ")})`;
      case "date":
        return `new Date(${a[0]})`;
      case "now":
        return "new Date()";
      case "isoString":
        return `new Date(${a[0]}).toISOString()`;
      case "isValidDate":
        return `!Number.isNaN(new Date(${a[0]}).getTime())`;
      case "unique":
        return `[...new Set(${ARRAY_OF}(${a[0]}))]`;
      case "join":
        return `${ARRAY_OF}(${a[0]}).join(${a[1]})`;
      case "first":
        return `${ARRAY_OF}(${a[0]})[0]`;
      case "last":
        return `((v) => v[v.length - 1])(${ARRAY_OF}(${a[0]}))`;
      // Per-item bodies are parenthesised: a bare `{ k: v }` after `=>` parses as a block, not an object literal.
      case "map":
        return `${ARRAY_OF}(${a[0]}).map((item) => (${a[1]}))`;
      case "filter":
        return `${ARRAY_OF}(${a[0]}).filter((item) => (${a[1]}))`;
      case "some":
        return `${ARRAY_OF}(${a[0]}).some((item) => (${a[1]}))`;
      case "every":
        return `${ARRAY_OF}(${a[0]}).every((item) => (${a[1]}))`;
      case "find":
        return `${ARRAY_OF}(${a[0]}).find((item) => (${a[1]}))`;
      case "get":
        return `(${a[0]})?.[${a[1]}]`;
      case "coalesce":
        return `(${a.join(" ?? ")})`;
      // The key, direction and unit are validated literals: the key is emitted JSON-quoted, and the direction and
      // unit only choose a template.
      case "sortBy":
        return compileSortBy(a[0], a[1], args[2] as string);
      case "slice":
        return `${ARRAY_OF}(${a[0]}).slice(${INDEX_OF}(${a[1]})${a.length === 3 ? `, ${INDEX_OF}(${a[2]})` : ""})`;
      case "sum":
        return `((list) => { const num = ${NUMBER_OF}; let total = 0; for (const v of list) { const n = num(v); if (Number.isFinite(n)) { total += n; } } return total; })(${ARRAY_OF}(${a[0]}))`;
      case "avg":
        return `((list) => { const num = ${NUMBER_OF}; let total = 0; let count = 0; for (const v of list) { const n = num(v); if (Number.isFinite(n)) { total += n; count += 1; } } return count === 0 ? null : total / count; })(${ARRAY_OF}(${a[0]}))`;
      case "groupBy":
        return compileGroupBy(a[0], a[1], args[2] as GroupAggregate);
      case "dateBucket":
        return compileDateBucket(a[0], args[1] as string);
    }
  }

  if ("if" in expr) {
    return `(${compileExpr(expr.if)} ? ${compileExpr(expr.then)} : ${compileExpr(expr.else)})`;
  }

  if ("object" in expr) {
    const entries = Object.entries(expr.object).map(
      ([key, value]) => `${key}: ${compileExpr(value)}`,
    );

    return `{ ${entries.join(", ")} }`;
  }

  return `[${expr.array.map(compileExpr).join(", ")}]`;
}

export function compileSteps(steps: Step[]): string[] {
  const lines: string[] = [];

  for (const step of steps) {
    if ("let" in step) {
      lines.push(`let ${step.let} = ${compileExpr(step.value)};`);
    } else if ("set" in step) {
      lines.push(`${step.set} = ${compileExpr(step.value)};`);
    } else if ("run" in step) {
      // `with` values pass through a compiler-owned guard that throws on `undefined` (a missing query field, a
      // `get` on an absent key, …) instead of letting the eval worker turn it into a bare `null` that would reach
      // the query — on a non-_id filter that matches every document lacking the field, and in a `$set` it writes
      // null. An explicit `null` literal is the agent's stated intent and passes. `$p` / `$k` cannot collide with
      // agent-supplied names (identifiers admit no `$`).
      const params = step.with
        ? `${PARAMS_GUARD}({ ${Object.entries(step.with)
            .map(([key, value]) => `${key}: ${compileExpr(value)}`)
            .join(", ")} })`
        : "";
      const call = `await ${step.run}.run(${params})`;

      if (step.onError) {
        // The guard runs BEFORE the try so a missing parameter (an authoring bug) is never masked as a query
        // failure; the guarded params live in a block-scoped $a so several runs in one function do not clash.
        // $e / $a cannot collide with any agent-supplied name (identifiers admit no dollar sign); $e is never read.
        const args = step.with ? "$a" : "";
        const attempt = step.into
          ? `${step.into} = await ${step.run}.run(${args});`
          : `await ${step.run}.run(${args});`;
        const recover = compileSteps(step.onError).join(" ");
        const prelude = step.with ? `const $a = ${params}; ` : "";

        lines.push(
          `${step.into ? `let ${step.into}; ` : ""}{ ${prelude}try { ${attempt} } catch ($e) { ${recover} } }`,
        );
      } else {
        lines.push(step.into ? `let ${step.into} = ${call};` : `${call};`);
      }
    } else if ("if" in step) {
      const elsePart = step.else
        ? ` else { ${compileSteps(step.else).join(" ")} }`
        : "";

      lines.push(
        `if (${compileExpr(step.if)}) { ${compileSteps(step.then).join(" ")} }${elsePart}`,
      );
    } else if ("forEach" in step) {
      lines.push(
        `for (let ${step.as} of ${ARRAY_OF}(${compileExpr(step.forEach)})) { ${compileSteps(step.do).join(" ")} }`,
      );
    } else if ("throw" in step) {
      lines.push(`throw new Error(${q(step.throw)});`);
    } else if ("call" in step) {
      const call = compileExpr({ call: step.call, args: step.args });

      lines.push(step.into ? `let ${step.into} = ${call};` : `${call};`);
    } else if ("return" in step) {
      lines.push(`return ${compileExpr(step.return)};`);
    } else if ("showAlert" in step) {
      lines.push(
        `showAlert(${typeof step.showAlert === "string" ? q(step.showAlert) : `String(${compileExpr(step.showAlert)} ?? "")`}, ${q(step.style ?? "info")});`,
      );
    } else if ("storeValue" in step) {
      lines.push(
        `await storeValue(${q(step.storeValue)}, ${compileExpr(step.value)}, false);`,
      );
    } else if ("resetWidget" in step) {
      lines.push(`await resetWidget(${q(step.resetWidget)}, true);`);
    } else if ("showModal" in step) {
      lines.push(`showModal(${q(step.showModal)});`);
    } else if ("closeModal" in step) {
      lines.push(`closeModal(${q(step.closeModal)});`);
    } else {
      const params = Object.entries(step.params ?? {});
      const query =
        params.length === 0
          ? "{}"
          : `{ ${params
              .map(([key, value]) => `${key}: ${compileExpr(value)}`)
              .join(", ")} }`;

      lines.push(
        `await navigateTo(${q(step.navigate)}, ${query}, "SAME_WINDOW");`,
      );
    }
  }

  return lines;
}

// A cheap structural guard run BEFORE the zod schemas: `exprSchema` / `stepSchema` are `z.lazy` unions that recurse
// on every nested node, so a hostile ~1,000-deep tree would overflow the stack before EXPR_MAX_DEPTH is consulted.
export const MAX_DEFINITION_JSON_DEPTH = 64;

export function exceedsJsonDepth(value: unknown, limit: number): boolean {
  const stack: { node: unknown; depth: number }[] = [{ node: value, depth: 0 }];

  while (stack.length > 0) {
    const { depth, node } = stack.pop()!;

    if (node === null || typeof node !== "object") continue;

    if (depth >= limit) return true;

    for (const child of Array.isArray(node) ? node : Object.values(node)) {
      stack.push({ node: child, depth: depth + 1 });
    }
  }

  return false;
}
