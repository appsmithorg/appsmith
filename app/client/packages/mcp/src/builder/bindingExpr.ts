import { z } from "zod";
import {
  compileExpr,
  exceedsJsonDepth,
  exprSchema,
  ITEM_FNS,
  MAX_DEFINITION_JSON_DEPTH,
  validateExpr,
} from "./jsExpr.js";
import type { Expr } from "./jsExpr.js";

// A BINDING EXPRESSION (APP-16381): a tree of the closed JS-object expression grammar (jsExpr.ts), compiled into a
// widget property binding `{{ … }}` or a wire_event call argument. It is how an agent states a dynamic default, a
// date limit or a condition ("New contract is chosen and the date is less than a year out") without writing code.
// Every emitted character is still owned by compileExpr. On top of the grammar's own rules:
//
//   - no `param`, `var` or `constant` leaf: a binding has no parameters, locals or object constants;
//   - no `call`: it is awaited, and a widget binding is evaluated synchronously;
//   - no string literal holds `{` or `}`, at any depth. Appsmith splits `{{ }}` by counting braces
//     (getDynamicStringSegments), so an unbalanced brace inside a quoted string would end the binding early. The
//     compiler's own templates are brace-balanced (bindingExpr.test.ts checks every one);
//   - every widget a `widget` or `table` leaf names must exist on the page (checked by the caller with the
//     page's widget map, through bindingExprWidgets).

// The tree is typed `unknown` on the schema and parsed here, after a JSON depth check. Two reasons: patch_widgets
// and wire_event register their schemas as tool input, so the SDK would otherwise parse a recursive z.lazy schema
// before any depth cap ran (a deeply nested payload could overflow the stack), and the published tool JSON Schema
// stays non-recursive, which some clients need. The JS-object tools guard their definitions the same way.
export const bindingExprSchema = z
  .object({ expr: z.unknown() })
  .strict()
  .transform((value, ctx): { expr: Expr } => {
    if (exceedsJsonDepth(value.expr, MAX_DEFINITION_JSON_DEPTH)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `a binding expression nests deeper than ${MAX_DEFINITION_JSON_DEPTH} levels`,
      });

      return z.NEVER;
    }

    const parsed = exprSchema.safeParse(value.expr);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ["expr", ...issue.path] });
      }

      return z.NEVER;
    }

    return { expr: parsed.data };
  });

export interface BindingExpr {
  expr: Expr;
}

const NO_LOCALS = {
  params: new Set<string>(),
  vars: new Set<string>(),
  constants: new Set<string>(),
  functions: new Set<string>(),
  allowItem: false,
};

// Object keys a binding expression may not use: `then` makes an object awaitable (an await calls it) and `toJSON`
// is called by JSON.stringify. They are not Object.prototype names, so memberName lets them through.
const IMPLICIT_CALL_KEYS: ReadonlySet<string> = new Set(["then", "toJSON"]);

// The longest compiled binding body. Every value is re-evaluated on each change it depends on.
export const BINDING_EXPR_MAX_CHARS = 20_000;

export interface BindingExprOptions {
  // An event (trigger) argument: string literals also refuse `'`, because the modal-graph scan reads the persisted
  // trigger text and a quoted `closeModal('X')` inside a string would read as a real edge (as events.ts M6).
  trigger?: boolean;
}

// Walks every node and string of the tree, including fn arguments that are not Exprs ({ sep } and the groupBy
// aggregate are plain objects; their strings are visited too). An `{ object }` node's record is data, not a node:
// its keys are checked as object keys and only its values are walked.
function visit(
  value: unknown,
  onNode: (node: Record<string, unknown>) => string | undefined,
  options: BindingExprOptions = {},
): string | undefined {
  const stack: unknown[] = [value];

  while (stack.length > 0) {
    const current = stack.pop();

    if (typeof current === "string") {
      if (/[{}]/.test(current)) {
        return "a string in a binding expression must not contain { or } (the binding would end early)";
      }

      if (options.trigger && current.includes("'")) {
        return "a string in an event argument must not contain a single quote";
      }

      continue;
    }

    if (typeof current !== "object" || current === null) continue;

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    const node = current as Record<string, unknown>;
    const problem = onNode(node);

    if (problem) return problem;

    if (
      "object" in node &&
      typeof node.object === "object" &&
      node.object !== null &&
      !Array.isArray(node.object)
    ) {
      const record = node.object as Record<string, unknown>;
      const key = Object.keys(record).find((k) => IMPLICIT_CALL_KEYS.has(k));

      if (key !== undefined) {
        return `"${key}" is not allowed as an object key in a binding expression`;
      }

      stack.push(...Object.values(record));
      continue;
    }

    stack.push(...Object.values(node));
  }

  return undefined;
}

// Returns a problem, or undefined when the tree can be compiled into a widget binding (or, with `trigger`, an event
// argument).
export function bindingExprProblem(
  expr: Expr,
  options: BindingExprOptions = {},
): string | undefined {
  // A caller may hold a value zod has not parsed (a refinement runs even after the parse failed), so the tree is
  // checked against the grammar here too, before it is walked or compiled.
  if (exceedsJsonDepth(expr, MAX_DEFINITION_JSON_DEPTH)) {
    return `a binding expression nests deeper than ${MAX_DEFINITION_JSON_DEPTH} levels`;
  }

  if (!exprSchema.safeParse(expr).success) {
    return "not an expression of the grammar";
  }

  const nested = nestedListProblem(expr, false);

  if (nested) return nested;

  const shape = visit(
    expr,
    (node) => {
      if ("param" in node) return "a binding expression has no { param }";

      if ("var" in node) return "a binding expression has no { var }";

      if ("constant" in node) {
        return "a binding expression has no { constant }";
      }

      if ("call" in node) {
        return "a binding expression cannot { call } a function (it runs asynchronously; wire the call to an event instead)";
      }

      return undefined;
    },
    options,
  );
  const problem = shape ?? validateExpr(expr, NO_LOCALS);

  if (problem) return problem;

  return compileExpr(expr).length > BINDING_EXPR_MAX_CHARS
    ? `a binding expression compiles to more than ${BINDING_EXPR_MAX_CHARS} characters`
    : undefined;
}

// Functions that walk a whole list. Inside a per-item callback (map / filter / some / every / find), one of these over
// anything but the current item runs once per row: n² work, re-run on every change the binding depends on (a
// 2,000-row sortBy inside a map measured 3.5 s in the eval worker). In a binding it is refused unless its list
// comes from `{ item }`; a JS object can still do it, because it runs only when called.
const LIST_FNS: ReadonlySet<string> = new Set([
  ...ITEM_FNS,
  "sortBy",
  "groupBy",
  "unique",
  "sum",
  "avg",
  "slice",
  "join",
  "includes",
]);

// Whether a list argument is the current item or a field of it (`{ item }`, `get(<item-derived>, key)`).
function fromItem(arg: unknown): boolean {
  if (typeof arg !== "object" || arg === null) return false;

  const node = arg as { item?: unknown; fn?: unknown; args?: unknown[] };

  if (node.item === true) return true;

  return (
    node.fn === "get" && Array.isArray(node.args) && fromItem(node.args[0])
  );
}

function nestedListProblem(
  value: unknown,
  inCallback: boolean,
): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const problem = nestedListProblem(entry, inCallback);

      if (problem) return problem;
    }

    return undefined;
  }

  const node = value as Record<string, unknown>;

  if (typeof node.fn === "string" && Array.isArray(node.args)) {
    if (inCallback && LIST_FNS.has(node.fn) && !fromItem(node.args[0])) {
      return `fn ${node.fn} over a whole list inside a per-item callback runs once per row; in a binding, its list must come from { item } (move the logic to a JS object instead)`;
    }

    const perItem = ITEM_FNS.has(node.fn as never);

    for (let index = 0; index < node.args.length; index += 1) {
      const problem = nestedListProblem(
        node.args[index],
        inCallback || (perItem && index === 1),
      );

      if (problem) return problem;
    }

    return undefined;
  }

  const children =
    "object" in node && typeof node.object === "object" && node.object !== null
      ? Object.values(node.object as Record<string, unknown>)
      : Object.values(node);

  return nestedListProblem(children, inCallback);
}

// The queries a tree reads (`query` leaves). The caller refuses a name that is not a query of the application.
export function bindingExprQueries(expr: Expr): string[] {
  const names = new Set<string>();

  visit(expr, (node) => {
    if (typeof node.query === "string") names.add(node.query);

    return undefined;
  });

  return [...names];
}

// The widget reads of a tree: each `widget` leaf with its property path, and each `table` leaf with the row property
// it reads. The caller refuses a widget that is not on the page, a table leaf on a widget that is not a table, and
// a widget reading the property its own binding sets (an evaluation cycle).
export interface BindingExprRead {
  widget: string;
  property: string;
  table: boolean;
}

export function bindingExprReads(expr: Expr): BindingExprRead[] {
  const reads: BindingExprRead[] = [];

  visit(expr, (leaf) => {
    if (typeof leaf.widget === "string" && typeof leaf.property === "string") {
      reads.push({
        widget: leaf.widget,
        property: leaf.property,
        table: false,
      });
    }

    if (typeof leaf.table === "string" && typeof leaf.column === "string") {
      reads.push({
        widget: leaf.table,
        property: leaf.row === "triggered" ? "triggeredRow" : "selectedRow",
        table: true,
      });
    }

    return undefined;
  });

  return reads;
}

// The JavaScript of a checked tree, without the `{{ }}`. Callers check bindingExprProblem first.
export function compileBindingExprBody(expr: Expr): string {
  return compileExpr(expr);
}

// `{{ <expr> }}` for a checked tree.
export function compileBindingExpr(expr: Expr): string {
  return `{{ ${compileExpr(expr)} }}`;
}

// A date picker's minDate / maxDate / defaultDate. The date picker's own check (DATE_ISO_STRING in the client's
// validations.ts) accepts a Date or any date text and stores it as local ISO text, but reads a number as invalid.
// So a number (epoch milliseconds) becomes a Date, and a missing or invalid value becomes "", which the date picker
// reads as no limit or no default.
export function compileDateBinding(expr: Expr): string {
  return `{{ ((v) => { if (v == null || v === "" || typeof v === "boolean") { return ""; } const d = typeof v === "number" ? new Date(v) : v; return Number.isNaN(new Date(d instanceof Date ? d.getTime() : d).getTime()) ? "" : d; })(${compileExpr(expr)}) }}`;
}
