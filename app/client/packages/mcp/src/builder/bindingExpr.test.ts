import { createHash } from "node:crypto";
import {
  bindingExprProblem,
  bindingExprSchema,
  compileBindingExpr,
  compileDateBinding,
} from "./bindingExpr.js";
import {
  compileExpr,
  exprSchema,
  FN_ARITY,
  FN_NAMES,
  type Expr,
  type Fn,
} from "./jsExpr.js";

function expr(input: unknown): Expr {
  const parsed = exprSchema.safeParse(input);

  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));

  return parsed.data;
}

// A copy of the client's getDynamicStringSegments (app/client/src/utils/DynamicBindingUtils.ts): it splits a
// property value into text and `{{ }}` parts by counting braces, without knowing about JS strings.
function segments(dynamicString: string): string[] {
  let stringSegments: string[] = [];
  const start = dynamicString.indexOf("{{");

  if (start === -1) return [dynamicString];

  const first = dynamicString.substring(0, start);

  if (first) stringSegments.push(first);

  let rest = dynamicString.substring(start);
  let sum = 0;

  for (let i = 0; i <= rest.length - 1; i++) {
    const char = rest[i];
    const prevChar = rest[i - 1];

    if (char === "{") {
      sum++;
    } else if (char === "}") {
      sum--;

      if (prevChar === "}" && sum === 0) {
        stringSegments.push(rest.substring(0, i + 1));
        rest = rest.substring(i + 1);

        if (rest) {
          stringSegments = stringSegments.concat(segments(rest));
          break;
        }
      }
    }
  }

  if (sum !== 0 && dynamicString !== "") return [dynamicString];

  return stringSegments;
}

// One argument list per function that satisfies its arity and literal rules, with object and array nodes inside
// so their braces and brackets are counted too.
const NESTED = { object: { a: { array: [1, { object: { b: "x" } }] } } };
const SAMPLE_ARGS: Record<Fn, unknown[]> = {
  trim: [NESTED],
  lower: ["a"],
  upper: ["a"],
  length: [NESTED],
  concat: ["a", NESTED],
  startsWith: ["a", "b"],
  endsWith: ["a", "b"],
  includes: [{ array: [NESTED] }, 1],
  split: ["a,b", { sep: "commaOrNewline" }],
  stripPrefix: ["ab", "a"],
  stripSuffix: ["ab", "b"],
  replaceAll: ["ab", "a", "c"],
  number: ["1"],
  string: [NESTED],
  boolean: [NESTED],
  isEmpty: [NESTED],
  round: [1.5, 1],
  abs: [-1],
  min: [1, 2],
  max: [1, 2],
  date: ["2026-10-31"],
  now: [],
  isoString: ["2026-10-31"],
  isValidDate: ["x"],
  unique: [{ array: [1, 1] }],
  join: [{ array: [NESTED] }, ","],
  first: [{ array: [NESTED] }],
  last: [{ array: [NESTED] }],
  map: [{ array: [NESTED] }, { object: { v: { item: true } } }],
  filter: [{ array: [NESTED] }, { item: true }],
  some: [{ array: [NESTED] }, { item: true }],
  every: [{ array: [NESTED] }, { item: true }],
  find: [{ array: [NESTED] }, { item: true }],
  get: [NESTED, "a"],
  coalesce: [null, NESTED],
  sortBy: [{ array: [NESTED] }, "a", "desc"],
  slice: [{ array: [NESTED] }, 0, 1],
  sum: [{ array: [1, 2] }],
  avg: [{ array: [1, 2] }],
  groupBy: [{ array: [NESTED] }, "a", { sum: "b" }],
  dateBucket: ["2026-10-31", "week"],
  addDays: ["2026-10-31", 1],
  addMonths: ["2026-10-31", 1],
  addYears: ["2026-10-31", 1],
  startOfDay: ["2026-10-31"],
  diffDays: ["2026-10-31", "2026-11-01"],
  isoDate: ["2026-10-31"],
};

describe("binding expressions stay one {{ }} binding (APP-16381)", () => {
  it("covers every function", () => {
    expect(Object.keys(SAMPLE_ARGS).sort()).toEqual([...FN_NAMES].sort());

    for (const fn of FN_NAMES) {
      const [min, max] = FN_ARITY[fn];

      expect(SAMPLE_ARGS[fn].length).toBeGreaterThanOrEqual(min);
      expect(SAMPLE_ARGS[fn].length).toBeLessThanOrEqual(max);
    }
  });

  it.each(FN_NAMES)("fn %s compiles to a single, balanced binding", (fn) => {
    const tree = expr({ fn, args: SAMPLE_ARGS[fn] });

    expect(bindingExprProblem(tree)).toBeUndefined();

    for (const binding of [
      compileBindingExpr(tree),
      compileDateBinding(tree),
      `{{ Boolean(${compileExpr(tree)}) }}`,
    ]) {
      expect(segments(binding)).toEqual([binding]);
      // Nothing inside the body opens or closes a binding of its own.
      expect(binding.slice(2, -2)).not.toMatch(/\{\{|\}\}/);
    }
  });

  it("covers every leaf, op and node", () => {
    const tree = expr({
      if: {
        op: "and",
        args: [
          { widget: "W", property: "a.b" },
          { table: "T", column: "end date", row: "triggered" },
          { query: "Q", field: "rows" },
          { store: "k" },
          { user: "email" },
          { op: "not", args: [{ op: "neg", args: [1] }] },
        ],
      },
      then: { array: [NESTED, { object: { x: NESTED } }] },
      else: null,
    });
    const binding = compileBindingExpr(tree);

    expect(bindingExprProblem(tree)).toBeUndefined();
    expect(segments(binding)).toEqual([binding]);
  });

  it("refuses an unbalanced brace in any string, including fn tails", () => {
    for (const input of [
      "{",
      { fn: "concat", args: ["a", "}"] },
      { fn: "replaceAll", args: ["a", "a", "{x"] },
      { object: { k: { array: ["}"] } } },
    ]) {
      expect(bindingExprProblem(expr(input))).toMatch(
        /must not contain \{ or \}/,
      );
    }
  });

  it("refuses a single quote only in an event (trigger) argument", () => {
    const tree = expr({ fn: "concat", args: ["it's", "x"] });

    expect(bindingExprProblem(tree)).toBeUndefined();
    expect(bindingExprProblem(tree, { trigger: true })).toMatch(/single quote/);
  });

  it("refuses then and toJSON object keys at any depth", () => {
    for (const key of ["then", "toJSON"]) {
      expect(
        bindingExprProblem(
          expr({ array: [{ object: { ok: { object: { [key]: 1 } } } }] }),
        ),
      ).toMatch(/is not allowed as an object key/);
    }
  });

  it("refuses a tree that compiles too long", () => {
    const long = "x".repeat(900);
    const tree = expr({
      array: Array.from({ length: 30 }, () => long),
    });

    expect(bindingExprProblem(tree)).toMatch(/more than 20000 characters/);
  });

  it("parses the expression only after a depth check, and returns a typed tree", () => {
    expect(bindingExprSchema.safeParse({ expr: { user: "name" } })).toEqual({
      success: true,
      data: { expr: { user: "name" } },
    });
    expect(
      bindingExprSchema.safeParse({ expr: { user: "roles" } }).success,
    ).toBe(false);
    expect(bindingExprSchema.safeParse({ expr: 1, extra: 1 }).success).toBe(
      false,
    );
  });
});

// The COMPATIBILITY RULE in jsExpr.ts: an MCP-authored JS object is recognised only when its definition recompiles
// byte for byte. This digest pins the templates that existed before APP-16381; a change here needs a SPEC_VERSION
// bump and an upgrade path, not a new digest.
describe("existing jsExpr templates are unchanged", () => {
  const BEFORE_APP_16381 = FN_NAMES.filter(
    (fn) =>
      ![
        "addDays",
        "addMonths",
        "addYears",
        "startOfDay",
        "diffDays",
        "isoDate",
      ].includes(fn),
  );

  it("keeps the same emitted text", () => {
    const text = [
      ...BEFORE_APP_16381.map((fn) =>
        compileExpr(expr({ fn, args: SAMPLE_ARGS[fn] })),
      ),
      compileExpr(expr({ table: "T", column: "c" })),
      compileExpr(expr({ widget: "W", property: "a" })),
      compileExpr(expr({ query: "Q", field: "f" })),
      compileExpr(expr({ store: "k" })),
    ].join("\n");

    expect(createHash("sha256").update(text).digest("hex")).toBe(
      "d2877e127a660e0c1ca462a08c797e9971c236ec00406983682e2fe40de851e9",
    );
  });
});

describe("list work inside a per-item callback (APP-16381 performance review)", () => {
  const rows = { query: "Q" };

  it("refuses a whole-list function over query data inside map or filter", () => {
    for (const inner of [
      { fn: "sortBy", args: [rows, "a", "asc"] },
      { fn: "filter", args: [rows, { item: true }] },
      { fn: "sum", args: [rows] },
    ]) {
      expect(
        bindingExprProblem(expr({ fn: "map", args: [rows, inner] })),
      ).toMatch(/runs once per row/);
    }
  });

  it("allows list functions over the current item, and flat list functions", () => {
    expect(
      bindingExprProblem(
        expr({
          fn: "map",
          args: [
            rows,
            {
              fn: "filter",
              args: [{ fn: "get", args: [{ item: true }, "tags"] }, true],
            },
          ],
        }),
      ),
    ).toBeUndefined();
    expect(
      bindingExprProblem(
        expr({
          fn: "sum",
          args: [{ fn: "map", args: [rows, { item: true }] }],
        }),
      ),
    ).toBeUndefined();
  });
});
