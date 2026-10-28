import { execFileSync } from "node:child_process";
import {
  CALL_DEPTH_LIMIT,
  compileExpr,
  compileSteps,
  type Expr,
  type ExprContext,
  exceedsJsonDepth,
  exprSchema,
  type Fn,
  MAX_DEFINITION_JSON_DEPTH,
  FN_NAMES,
  GROUP_BY_MAX_GROUPS,
  type Op,
  OPS,
  type Step,
  stepSchema,
  stepsProblem,
  validateExpr,
} from "./jsExpr.js";
import { JS_OBJECT_GUIDE_EXAMPLES } from "./jsObjectGuide.js";

const ctx = (over: Partial<ExprContext> = {}): ExprContext => ({
  params: new Set(),
  vars: new Set(),
  constants: new Set(),
  functions: new Set(),
  allowItem: false,
  ...over,
});

function expr(input: unknown): Expr {
  const parsed = exprSchema.safeParse(input);

  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));

  return parsed.data;
}

// The compiler-owned guard every `run … with` passes its parameters through (see compileSteps).
const GUARD =
  '(($p) => { for (const $k of Object.keys($p)) { if ($p[$k] === undefined) { throw new Error("missing query parameter: " + $k); } } return $p; })';

function steps(input: unknown): Step[] {
  const parsed = stepSchema.array().safeParse(input);

  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));

  return parsed.data;
}

describe("jsExpr — the Banner editor examples compile from structure alone", () => {
  it("splitLines: split on commas/newlines, trim, drop blanks, dedupe", () => {
    // splitLines(value) { return [...new Set((value || "").split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean))]; }
    const tree = expr({
      fn: "unique",
      args: [
        {
          fn: "filter",
          args: [
            {
              fn: "map",
              args: [
                {
                  fn: "split",
                  args: [{ param: "value" }, { sep: "commaOrNewline" }],
                },
                { fn: "trim", args: [{ item: true }] },
              ],
            },
            { op: "not", args: [{ fn: "isEmpty", args: [{ item: true }] }] },
          ],
        },
      ],
    });

    expect(
      validateExpr(tree, ctx({ params: new Set(["value"]) })),
    ).toBeUndefined();

    const source = compileExpr(tree);

    expect(source).toContain('String(value ?? "").split(/[\\r\\n,]+/)');
    expect(source).toContain('.map((item) => (String(item ?? "").trim()))');
    expect(source).toContain(".filter((item) => ((!((v) =>");
    expect(source.startsWith("[...new Set(")).toBe(true);
    // The compiled expression really produces the page's expected unique array.
    const fn = new Function("value", `return ${source};`) as (
      v: string,
    ) => string[];

    expect(fn("a1, b2\nb2,, a1\r\n c3 ")).toEqual(["a1", "b2", "c3"]);
    expect(fn("")).toEqual([]);
  });

  it("splitDomains: strip a leading @, lowercase, dedupe after normalising", () => {
    const tree = expr({
      fn: "unique",
      args: [
        {
          fn: "filter",
          args: [
            {
              fn: "map",
              args: [
                {
                  fn: "split",
                  args: [{ param: "value" }, { sep: "commaOrNewline" }],
                },
                {
                  fn: "lower",
                  args: [
                    {
                      fn: "stripPrefix",
                      args: [{ fn: "trim", args: [{ item: true }] }, "@"],
                    },
                  ],
                },
              ],
            },
            { op: "not", args: [{ fn: "isEmpty", args: [{ item: true }] }] },
          ],
        },
      ],
    });
    const source = compileExpr(tree);

    expect(
      validateExpr(tree, ctx({ params: new Set(["value"]) })),
    ).toBeUndefined();
    expect(source).toContain(
      's.startsWith(p) ? s.slice(p.length) : s)(String(String(item ?? "").trim() ?? ""), "@")',
    );
    // The compiled expression really produces ["acme.com"] for the page's example input.
    const fn = new Function("value", `return ${source};`) as (
      v: string,
    ) => string[];

    expect(fn("@Acme.com, acme.com")).toEqual(["acme.com"]);
  });

  it("related-field validation and date comparison as statements", () => {
    const body = steps([
      {
        if: {
          op: "ne",
          args: [
            {
              fn: "isEmpty",
              args: [
                {
                  fn: "trim",
                  args: [{ widget: "inpCtaLabel", property: "text" }],
                },
              ],
            },
            {
              fn: "isEmpty",
              args: [
                {
                  fn: "trim",
                  args: [{ widget: "inpCtaUrl", property: "text" }],
                },
              ],
            },
          ],
        },
        then: [{ throw: "Provide both CTA fields or leave both blank." }],
      },
      {
        let: "startsAt",
        value: { widget: "dtStartsAt", property: "selectedDate" },
      },
      {
        let: "endsAt",
        value: { widget: "dtEndsAt", property: "selectedDate" },
      },
      {
        if: {
          op: "and",
          args: [
            {
              op: "not",
              args: [{ fn: "isEmpty", args: [{ var: "startsAt" }] }],
            },
            { op: "not", args: [{ fn: "isEmpty", args: [{ var: "endsAt" }] }] },
            {
              op: "lte",
              args: [
                { fn: "date", args: [{ var: "endsAt" }] },
                { fn: "date", args: [{ var: "startsAt" }] },
              ],
            },
          ],
        },
        then: [{ throw: "End time must be later than start time." }],
      },
    ]);

    expect(stepsProblem(body, ctx())).toBeUndefined();
    expect(compileSteps(body).join(" ")).toBe(
      'if ((((v) => v == null || v === "" || (Array.isArray(v) && v.length === 0))(String(inpCtaLabel.text ?? "").trim()) !== ((v) => v == null || v === "" || (Array.isArray(v) && v.length === 0))(String(inpCtaUrl.text ?? "").trim()))) { throw new Error("Provide both CTA fields or leave both blank."); } ' +
        "let startsAt = dtStartsAt.selectedDate; let endsAt = dtEndsAt.selectedDate; " +
        'if (((!((v) => v == null || v === "" || (Array.isArray(v) && v.length === 0))(startsAt)) && (!((v) => v == null || v === "" || (Array.isArray(v) && v.length === 0))(endsAt)) && (new Date(endsAt) <= new Date(startsAt)))) { throw new Error("End time must be later than start time."); }',
    );
  });

  it("save orchestration: validate, normalise, choose insert vs update, pass params, refresh, return", () => {
    const body = steps([
      {
        let: "title",
        value: { fn: "trim", args: [{ widget: "inpTitle", property: "text" }] },
      },
      {
        if: { fn: "isEmpty", args: [{ var: "title" }] },
        then: [{ throw: "Title is required." }],
      },
      {
        let: "doc",
        value: {
          object: {
            title: { var: "title" },
            priority: {
              fn: "number",
              args: [{ widget: "inpPriority", property: "text" }],
            },
            edition: { widget: "msEdition", property: "selectedOptionValues" },
            startsAt: {
              fn: "isoString",
              args: [{ widget: "dtStartsAt", property: "selectedDate" }],
            },
            updatedBy: { store: "currentUser" },
            updatedAt: { fn: "isoString", args: [{ fn: "now", args: [] }] },
          },
        },
      },
      {
        let: "selectedId",
        value: { widget: "tblBanners", property: "selectedRow.id" },
      },
      {
        if: { fn: "isEmpty", args: [{ var: "selectedId" }] },
        then: [{ run: "InsertBanner", with: { doc: { var: "doc" } } }],
        else: [
          {
            run: "UpdateBanner",
            with: { id: { var: "selectedId" }, doc: { var: "doc" } },
            into: "updated",
          },
        ],
      },
      { run: "GetBanners" },
      { showAlert: "Saved", style: "success" },
      { return: { object: { saved: true, id: { var: "selectedId" } } } },
    ]);

    expect(stepsProblem(body, ctx())).toBeUndefined();

    const source = compileSteps(body).join(" ");

    expect(source).toContain('let title = String(inpTitle.text ?? "").trim();');
    expect(source).toContain(
      "let doc = { title: title, priority: Number(inpPriority.text), edition: msEdition.selectedOptionValues, startsAt: new Date(dtStartsAt.selectedDate).toISOString(), updatedBy: appsmith.store.currentUser, updatedAt: new Date(new Date()).toISOString() };",
    );
    expect(source).toContain(
      `{ await InsertBanner.run(${GUARD}({ doc: doc })); } else { let updated = await UpdateBanner.run(${GUARD}({ id: selectedId, doc: doc })); }`,
    );
    expect(source).toContain("await GetBanners.run();");
    expect(source).toContain('showAlert("Saved", "success");');
    expect(source).toContain("return { saved: true, id: selectedId };");
  });
});

describe("jsExpr — nothing agent-authored reaches an evaluated position", () => {
  const badExprs: [string, unknown][] = [
    ["binding in a literal", "{{ appsmith.user.email }}"],
    ["template literal", "${process.env}"],
    ["backtick", "`x`"],
    ["line separator", "a b"],
    ["raw code in fn", { fn: "eval", args: ["1+1"] }],
    ["unknown op", { op: "call", args: [1] }],
    ["member path as param", { param: "window.location" }],
    ["dotted var", { var: "a.b" }],
    ["widget name with space", { widget: "Input 1", property: "text" }],
    ["widget property with bracket", { widget: "Input1", property: "text[0]" }],
    ["query field with call", { query: "Q", field: "data()" }],
    ["extra key on a leaf", { param: "x", value: 1 }],
    ["object key with quote", { object: { 'a"b': 1 } }],
    ["reserved param name", { param: "this" }],
    ["store key prototype", { store: "__proto__" }],
    // Council M2 security proofs: nothing may reach a function reference or a method receiver.
    ["host global as widget", { widget: "globalThis", property: "eval" }],
    ["this as widget", { widget: "this", property: "save" }],
    ["arguments as widget", { widget: "arguments", property: "callee" }],
    ["platform fn as widget", { widget: "navigateTo", property: "call" }],
    ["host global as query", { query: "fetch" }],
    [
      "prototype walk in path",
      { widget: "Input1", property: "text.constructor.constructor" },
    ],
    ["__proto__ in path", { widget: "Input1", property: "__proto__.x" }],
    ["method segment in path", { query: "Q", field: "run" }],
    ["doubled dot in path", { widget: "Input1", property: "text..x" }],
    ["trailing dot in path", { widget: "Input1", property: "text." }],
    // Built with JSON.parse: a `{ __proto__: 1 }` source literal sets the prototype instead of creating the key.
    ["__proto__ object key", JSON.parse('{"object":{"__proto__":1}}')],
    ["constructor object key", { object: { constructor: 1 } }],
    ["local named after compiler callee", { var: "showAlert" }],
    ["local named after builtin", { param: "String" }],
    ["local named after keyword", { param: "class" }],
  ];

  it.each(badExprs)("rejects %s", (_label, input) => {
    expect(exprSchema.safeParse(input).success).toBe(false);
  });

  it("enforces arity, scoping, item placement and literal-only tails", () => {
    const params = new Set(["value"]);

    expect(validateExpr(expr({ fn: "trim", args: [] }), ctx())).toMatch(
      /takes 1/,
    );
    expect(validateExpr(expr({ op: "sub", args: [1] }), ctx())).toMatch(
      /takes 2/,
    );
    expect(validateExpr(expr({ param: "nope" }), ctx({ params }))).toMatch(
      /unknown param/,
    );
    expect(validateExpr(expr({ var: "x" }), ctx())).toMatch(
      /before it is declared/,
    );
    expect(validateExpr(expr({ constant: "limit" }), ctx())).toMatch(
      /unknown constant/,
    );
    expect(validateExpr(expr({ item: true }), ctx())).toMatch(
      /only valid inside/,
    );
    expect(
      validateExpr(expr({ fn: "trim", args: [{ sep: "comma" }] }), ctx()),
    ).toMatch(/only valid as the second argument of split/);
    expect(
      validateExpr(
        expr({
          fn: "stripPrefix",
          args: [{ param: "value" }, { param: "value" }],
        }),
        ctx({ params }),
      ),
    ).toMatch(/must be a string literal/);
    expect(
      validateExpr(
        expr({ fn: "get", args: [{ param: "value" }, "a b"] }),
        ctx({ params }),
      ),
    ).toMatch(/plain, non-prototype identifier/);
    expect(
      validateExpr(
        expr({
          fn: "split",
          args: [{ param: "value" }, "a very long separator"],
        }),
        ctx({ params }),
      ),
    ).toMatch(/at most 10/);
    // { item } is fine inside a per-item function.
    expect(
      validateExpr(
        expr({
          fn: "map",
          args: [{ param: "value" }, { fn: "trim", args: [{ item: true }] }],
        }),
        ctx({ params }),
      ),
    ).toBeUndefined();
  });

  it("bounds depth and node count", () => {
    let deep: unknown = 1;

    for (let i = 0; i < 14; i += 1) deep = { op: "neg", args: [deep] };

    expect(validateExpr(expr(deep), ctx())).toMatch(/deeper than/);

    const wide = {
      op: "add",
      args: Array.from({ length: 8 }, () => ({
        op: "add",
        args: Array.from({ length: 8 }, () => ({ op: "add", args: [1, 2, 3] })),
      })),
    };

    expect(validateExpr(expr(wide), ctx())).toMatch(/exceeds/);
  });

  it("threads let / into / forEach scopes in order and refuses redeclaration", () => {
    expect(
      stepsProblem(
        steps([
          { let: "a", value: 1 },
          { let: "a", value: 2 },
        ]),
        ctx(),
      ),
    ).toMatch(/already declared/);
    expect(stepsProblem(steps([{ set: "a", value: 1 }]), ctx())).toMatch(
      /declared with let/,
    );
    expect(
      stepsProblem(
        steps([{ return: { var: "rows" } }, { run: "Q", into: "rows" }]),
        ctx(),
      ),
    ).toMatch(/before it is declared/);
    expect(
      stepsProblem(
        steps([
          { run: "Q", into: "rows" },
          {
            forEach: { var: "rows" },
            as: "row",
            do: [{ storeValue: "last", value: { var: "row" } }],
          },
          { return: { var: "row" } },
        ]),
        ctx(),
      ),
    ).toMatch(/"row" is used before/);
    expect(stepSchema.safeParse({ throw: "{{ x }}" }).success).toBe(false);
    expect(stepSchema.safeParse({ run: "Q.run(); evil()" }).success).toBe(
      false,
    );
    expect(
      stepSchema.safeParse({ resetWidget: "Input1'); evil('" }).success,
    ).toBe(false);
  });

  it("emits JSON-encoded literals so quotes and backslashes cannot escape", () => {
    expect(compileExpr(expr('he said "hi" \\ and'))).toBe(
      '"he said \\"hi\\" \\\\ and"',
    );
    expect(compileSteps(steps([{ throw: 'a "quoted" message' }]))).toEqual([
      'throw new Error("a \\"quoted\\" message");',
    ]);
  });
});

describe("jsExpr — receiver and shadowing guards (council M2 security)", () => {
  const ARR = "((v) => Array.isArray(v) ? v : [])";

  it("never calls a method on an agent expression: array functions take a coerced real array", () => {
    // The proof: an object whose `includes` member is a function reference. With the receiver guard the object
    // is coerced to [] and Array.prototype.includes runs, so the referenced function is never invoked.
    const source = compileExpr(
      expr({
        fn: "includes",
        args: [
          { object: { includes: { widget: "Host", property: "probe" } } },
          "agent-arg",
        ],
      }),
    );

    expect(source).toBe(
      `${ARR}({ includes: Host.probe }).includes("agent-arg")`,
    );

    const calls: unknown[] = [];
    const Host = { probe: (...args: unknown[]) => calls.push(args) };

    expect(new Function("Host", `return ${source};`)(Host)).toBe(false);
    expect(calls).toEqual([]);

    for (const fn of [
      "join",
      "map",
      "filter",
      "some",
      "every",
      "find",
      "unique",
      "first",
      "last",
    ]) {
      const args =
        fn === "join"
          ? [{ param: "v" }, ","]
          : fn === "unique" || fn === "first" || fn === "last"
            ? [{ param: "v" }]
            : [{ param: "v" }, { item: true }];

      expect(compileExpr(expr({ fn, args } as never))).toContain(`${ARR}(v)`);
    }
  });

  it("rounds on a primitive receiver with a literal precision only", () => {
    expect(compileExpr(expr({ fn: "round", args: [{ param: "v" }, 2] }))).toBe(
      "Number(Number(v).toFixed(2))",
    );
    expect(
      validateExpr(
        expr({ fn: "round", args: [{ param: "v" }, { param: "v" }] }),
        ctx({ params: new Set(["v"]) }),
      ),
    ).toMatch(/precision must be an integer literal/);
    expect(
      validateExpr(
        expr({ fn: "round", args: [{ param: "v" }, 99] }),
        ctx({ params: new Set(["v"]) }),
      ),
    ).toMatch(/precision must be an integer literal/);
  });

  it("refuses a local that shadows a compiler-emitted callee or a referenced entity", () => {
    // `let showAlert = Host.probe; showAlert("hello")` would call an agent-chosen function.
    expect(
      stepSchema.safeParse({
        let: "showAlert",
        value: { widget: "Host", property: "probe" },
      }).success,
    ).toBe(false);
    expect(stepSchema.safeParse({ run: "Q", into: "storeValue" }).success).toBe(
      false,
    );
    expect(
      stepSchema.safeParse({
        forEach: { param: "v" },
        as: "resetWidget",
        do: [{ return: 1 }],
      }).success,
    ).toBe(false);
    expect(stepSchema.safeParse({ run: "globalThis" }).success).toBe(false);
    expect(stepSchema.safeParse({ resetWidget: "eval" }).success).toBe(false);
    // `let Q = { run: <fn ref> }` followed by `run: "Q"` would call the local's run.
    expect(
      stepsProblem(
        steps([{ let: "Q", value: { object: { x: 1 } } }, { run: "Q" }]),
        ctx(),
      ),
    ).toMatch(/both a local name and a query to run/);
    expect(
      stepsProblem(
        steps([
          { let: "Input1", value: 1 },
          { return: { widget: "Input1", property: "text" } },
        ]),
        ctx(),
      ),
    ).toMatch(/both a local name and a widget\/query reference/);
    expect(
      validateExpr(
        expr({ fn: "get", args: [{ param: "v" }, "__proto__"] }),
        ctx({ params: new Set(["v"]) }),
      ),
    ).toMatch(/non-prototype identifier/);
  });

  it("locates a problem by statement path", () => {
    expect(
      stepsProblem(
        steps([
          { let: "a", value: 1 },
          {
            if: { var: "a" },
            then: [{ return: 1 }, { return: { var: "nope" } }],
          },
        ]),
        ctx(),
      ),
    ).toMatch(/^steps\[1\]\.then\[1\]: "nope" is used before/);
  });

  it("splits on linear-time separators", () => {
    expect(
      compileExpr(
        expr({ fn: "split", args: [{ param: "v" }, { sep: "comma" }] }),
      ),
    ).toBe('String(v ?? "").split(",")');
    expect(
      compileExpr(
        expr({ fn: "split", args: [{ param: "v" }, { sep: "pipe" }] }),
      ),
    ).toBe('String(v ?? "").split("|")');
  });
});

describe("jsExpr — every fn and op compiles to valid JS that computes the expected value", () => {
  // One sample per arity bound. `v` is the only free variable; array/object inputs are grammar nodes. Executing
  // the emitted text is the assertion that the template is valid JS and does what its name says.
  const FN_CASES: Record<Fn, [unknown[], unknown][]> = {
    trim: [[[" a "], "a"]],
    lower: [[["A"], "a"]],
    upper: [[["a"], "A"]],
    length: [[["abc"], 3]],
    concat: [
      [["a", "b"], "ab"],
      [["a", "b", "c", "d", "e", "f", "g", "h"], "abcdefgh"],
    ],
    startsWith: [[["abc", "a"], true]],
    endsWith: [[["abc", "c"], true]],
    includes: [[[{ array: [1, 2] }, 2], true]],
    split: [
      [
        ["a,b", ","],
        ["a", "b"],
      ],
      [
        ["a, b", { sep: "comma" }],
        ["a", " b"],
      ],
    ],
    stripPrefix: [[["abc", "a"], "bc"]],
    stripSuffix: [[["abc", "c"], "ab"]],
    replaceAll: [[["a-b-c", "-", "+"], "a+b+c"]],
    number: [[["3"], 3]],
    string: [[[3], "3"]],
    boolean: [[[1], true]],
    isEmpty: [[[""], true]],
    round: [
      [[1.5], 2],
      [[1.234, 2], 1.23],
    ],
    abs: [[[-1], 1]],
    min: [
      [[1, 2], 1],
      [[8, 7, 6, 5, 4, 3, 2, 1], 1],
    ],
    max: [
      [[1, 2], 2],
      [[1, 2, 3, 4, 5, 6, 7, 8], 8],
    ],
    date: [[["2026-01-01T00:00:00Z"], new Date("2026-01-01T00:00:00Z")]],
    now: [[[], expect.any(Date)]],
    isoString: [[["2026-01-01T00:00:00Z"], "2026-01-01T00:00:00.000Z"]],
    isValidDate: [[["nope"], false]],
    unique: [[[{ array: [1, 1, 2] }], [1, 2]]],
    join: [[[{ array: [1, 2] }, "-"], "1-2"]],
    first: [[[{ array: [1, 2] }], 1]],
    last: [[[{ array: [1, 2] }], 2]],
    map: [
      [
        [{ array: [1, 2] }, { op: "add", args: [{ item: true }, 1] }],
        [2, 3],
      ],
    ],
    filter: [
      [[{ array: [1, 2] }, { op: "gt", args: [{ item: true }, 1] }], [2]],
    ],
    some: [
      [[{ array: [1, 2] }, { op: "gt", args: [{ item: true }, 1] }], true],
    ],
    every: [
      [[{ array: [1, 2] }, { op: "gt", args: [{ item: true }, 1] }], false],
    ],
    find: [[[{ array: [1, 2] }, { op: "gt", args: [{ item: true }, 1] }], 2]],
    get: [[[{ object: { a: 1 } }, "a"], 1]],
    coalesce: [
      [[null, 1], 1],
      [[null, null, null, 1], 1],
    ],
    sortBy: [
      [
        [{ array: [{ object: { n: 2 } }, { object: { n: 1 } }] }, "n", "asc"],
        [{ n: 1 }, { n: 2 }],
      ],
      [
        [{ array: [{ object: { n: 1 } }, { object: { n: 2 } }] }, "n", "desc"],
        [{ n: 2 }, { n: 1 }],
      ],
    ],
    slice: [
      [
        [{ array: [1, 2, 3, 4] }, 1, 3],
        [2, 3],
      ],
      [
        [{ array: [1, 2, 3, 4] }, -2],
        [3, 4],
      ],
    ],
    sum: [[[{ array: [1, "2", null, "", true, "x"] }], 3]],
    avg: [
      [[{ array: [1, 2, null] }], 1.5],
      [[{ array: [] }], null],
    ],
    groupBy: [
      [
        [
          {
            array: [
              { object: { s: "a", n: 1 } },
              { object: { s: "b", n: 2 } },
              { object: { s: "a", n: 3 } },
            ],
          },
          "s",
          { count: true },
        ],
        [
          { key: "a", value: 2 },
          { key: "b", value: 1 },
        ],
      ],
      [
        [
          {
            array: [
              { object: { s: "a", n: 1 } },
              { object: { s: "a", n: "3" } },
            ],
          },
          "s",
          { sum: "n" },
        ],
        [{ key: "a", value: 4 }],
      ],
      [
        [
          { array: [{ object: { s: "a", n: 1 } }, { object: { s: "a" } }] },
          "s",
          { avg: "n" },
        ],
        [{ key: "a", value: 1 }],
      ],
    ],
    dateBucket: [
      // 2026-10-28 is a Wednesday; its ISO week starts on Monday the 26th.
      [["2026-10-28T23:30:00Z", "day"], "2026-10-28"],
      [["2026-10-28T12:00:00Z", "week"], "2026-10-26"],
      [["2026-10-28T12:00:00Z", "month"], "2026-10-01"],
      [["not a date", "day"], null],
    ],
  };
  const OP_CASES: Record<Op, [unknown[], unknown]> = {
    add: [[1, 2], 3],
    sub: [[1, 2], -1],
    mul: [[2, 3], 6],
    div: [[1, 2], 0.5],
    mod: [[5, 2], 1],
    neg: [[1], -1],
    eq: [[1, 1], true],
    ne: [[1, 1], false],
    gt: [[2, 1], true],
    gte: [[2, 2], true],
    lt: [[2, 1], false],
    lte: [[2, 1], false],
    and: [[true, false], false],
    or: [[true, false], true],
    not: [[true], false],
  };

  const run = (source: string): unknown => new Function(`return ${source};`)();

  it("covers the whole vocabulary", () => {
    expect(Object.keys(FN_CASES).sort()).toEqual([...FN_NAMES].sort());
    expect(Object.keys(OP_CASES).sort()).toEqual([...OPS].sort());
  });

  it.each(Object.entries(FN_CASES))("fn %s", (fn, cases) => {
    for (const [args, expected] of cases) {
      const tree = expr({ fn, args });

      expect(validateExpr(tree, ctx())).toBeUndefined();
      expect(run(compileExpr(tree))).toEqual(expected);
    }
  });

  it.each(Object.entries(OP_CASES))("op %s", (op, [args, expected]) => {
    const tree = expr({ op, args });

    expect(validateExpr(tree, ctx())).toBeUndefined();
    expect(run(compileExpr(tree))).toEqual(expected);
  });

  it("compiles set / forEach / storeValue / resetWidget statements", () => {
    const body = steps([
      { let: "total", value: 0 },
      {
        forEach: { widget: "Table1", property: "selectedRows" },
        as: "row",
        do: [
          {
            set: "total",
            value: {
              op: "add",
              args: [
                { var: "total" },
                { fn: "get", args: [{ var: "row" }, "amount"] },
              ],
            },
          },
        ],
      },
      { storeValue: "lastTotal", value: { var: "total" } },
      { resetWidget: "inpAmount" },
    ]);

    expect(stepsProblem(body, ctx())).toBeUndefined();
    expect(compileSteps(body)).toEqual([
      "let total = 0;",
      'for (let row of ((v) => Array.isArray(v) ? v : [])(Table1.selectedRows)) { total = (total + (row)?.["amount"]); }',
      'await storeValue("lastTotal", total, false);',
      'await resetWidget("inpAmount", true);',
    ]);
  });
});

describe("jsExpr — milestone 3: table columns, failure branches, modal and navigation steps, params guard", () => {
  it("reads a selected-row column whose name is not an identifier through a JSON-encoded member", () => {
    const tree = expr({ table: "tblOrders", column: "instance ids" });

    expect(compileExpr(tree)).toBe('tblOrders.selectedRow["instance ids"]');
    expect(
      exprSchema.safeParse({ table: "tblOrders", column: 'x"]; evil(); ["' })
        .success,
    ).toBe(false);
    expect(
      exprSchema.safeParse({ table: "globalThis", column: "eval" }).success,
    ).toBe(false);
    expect(
      exprSchema.safeParse({ table: "tblOrders", column: "constructor" })
        .success,
    ).toBe(false);
    expect(
      exprSchema.safeParse({ table: "tblOrders", column: "__proto__" }).success,
    ).toBe(false);
    expect(
      stepsProblem(
        steps([
          { let: "tblOrders", value: 1 },
          { return: { table: "tblOrders", column: "id" } },
        ]),
        ctx(),
      ),
    ).toMatch(/both a local name and a widget\/query reference/);
  });

  it("compiles run … onError as a compiler-owned try/catch whose error is never exposed", () => {
    const body = steps([
      {
        run: "SaveOrder",
        with: { id: { param: "id" } },
        into: "saved",
        onError: [
          { showAlert: "Could not save", style: "error" },
          { return: false },
        ],
      },
      { return: { var: "saved" } },
    ]);

    expect(
      stepsProblem(body, ctx({ params: new Set(["id"]) })),
    ).toBeUndefined();
    expect(compileSteps(body)).toEqual([
      `let saved; { const $a = ${GUARD}({ id: id }); try { saved = await SaveOrder.run($a); } catch ($e) { showAlert("Could not save", "error"); return false; } }`,
      "return saved;",
    ]);
    // The failure branch cannot read the result local (the run did not complete) nor declare it twice.
    expect(
      stepsProblem(
        steps([{ run: "Q", into: "r", onError: [{ return: { var: "r" } }] }]),
        ctx(),
      ),
    ).toMatch(/steps\[0\]\.onError\[0\]: "r" is used before/);
    expect(stepSchema.safeParse({ run: "Q", onError: [] }).success).toBe(false);
  });

  it("APP-16324 F11: compiles a navigate step with URL parameters from expressions", () => {
    expect(
      compileSteps(
        steps([
          {
            navigate: "Ticket Details",
            params: {
              id: { table: "Table1", column: "zid" },
              tab: "open",
            },
          },
        ]),
      ),
    ).toEqual([
      'await navigateTo("Ticket Details", { id: Table1.selectedRow["zid"], tab: "open" }, "SAME_WINDOW");',
    ]);
    expect(
      stepSchema.safeParse({
        navigate: "Ticket Details",
        params: { constructor: "x" },
      }).success,
    ).toBe(false);
    expect(
      stepSchema.safeParse({
        navigate: "Ticket Details",
        params: Object.fromEntries(
          Array.from({ length: 11 }, (_, i) => [`p${i}`, i]),
        ),
      }).success,
    ).toBe(false);
    expect(
      stepSchema.safeParse({
        navigate: "Ticket Details",
        params: Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [`p${i}`, i]),
        ),
      }).success,
    ).toBe(true);
    // A parameter expression is scope-checked like any other value.
    expect(
      stepsProblem(
        steps([
          { navigate: "Ticket Details", params: { id: { var: "missing" } } },
        ]),
        ctx(),
      ),
    ).toMatch(/missing/);
  });

  it("compiles showModal / closeModal / navigate steps from validated names", () => {
    expect(
      compileSteps(
        steps([
          { showModal: "mdlEdit" },
          { closeModal: "mdlEdit" },
          { navigate: "Order Details" },
        ]),
      ),
    ).toEqual([
      'showModal("mdlEdit");',
      'closeModal("mdlEdit");',
      'await navigateTo("Order Details", {}, "SAME_WINDOW");',
    ]);
    expect(
      stepSchema.safeParse({ navigate: "Page'); evil(); ('" }).success,
    ).toBe(false);
    // Pages created by create_page may carry hyphens; navigate must accept them.
    expect(stepSchema.safeParse({ navigate: "Order-Details" }).success).toBe(
      true,
    );
    expect(stepSchema.safeParse({ showModal: "eval" }).success).toBe(false);
  });

  it("guards run … with against undefined parameters at run time", async () => {
    const [line] = compileSteps(
      steps([{ run: "Q", with: { id: { param: "id" } } }]),
    );
    const calls: unknown[] = [];
    const fn = new Function(
      "Q",
      "id",
      `return (async () => { ${line} })();`,
    ) as (q: unknown, id: unknown) => Promise<void>;
    const Q = { run: async (p: unknown) => calls.push(p) };

    return fn(Q, "abc")
      .then(() => expect(calls).toEqual([{ id: "abc" }]))
      .then(async () => fn(Q, undefined))
      .then(
        () => {
          throw new Error("expected the guard to throw");
        },
        (error: Error) =>
          expect(error.message).toBe("missing query parameter: id"),
      );
  });

  it("refuses a definition that nests deeper than the JSON depth cap before the schema runs", () => {
    let deep: unknown = 1;

    for (let i = 0; i < MAX_DEFINITION_JSON_DEPTH + 5; i += 1)
      deep = { op: "neg", args: [deep] };

    expect(exceedsJsonDepth(deep, MAX_DEFINITION_JSON_DEPTH)).toBe(true);
    expect(
      exceedsJsonDepth(
        { functions: [{ name: "f", steps: [{ return: 1 }] }] },
        MAX_DEFINITION_JSON_DEPTH,
      ),
    ).toBe(false);
  });
});

describe("jsExpr — run … onError executes the recovery branch (council M3 QA)", () => {
  it("runs the recovery steps when the query rejects, with the result local still undefined", async () => {
    const [line, tail] = compileSteps(
      steps([
        {
          run: "SaveOrder",
          with: { id: { param: "id" } },
          into: "saved",
          onError: [
            { storeValue: "failed", value: true },
            { showAlert: "Could not save", style: "error" },
          ],
        },
        { return: { var: "saved" } },
      ]),
    );
    const store: Record<string, unknown> = {};
    const alerts: unknown[] = [];
    const run = new Function(
      "SaveOrder",
      "storeValue",
      "showAlert",
      "id",
      `return (async () => { ${line} ${tail} })();`,
    ) as (...args: unknown[]) => Promise<unknown>;
    const storeValue = async (key: string, value: unknown) => {
      store[key] = value;
    };
    const showAlert = (message: string, style: string) =>
      alerts.push([message, style]);

    // Rejecting query: recovery runs, the result local is still undefined, the function does not throw.
    await expect(
      run(
        {
          run: async () => {
            throw new Error("boom");
          },
        },
        storeValue,
        showAlert,
        "abc",
      ),
    ).resolves.toBeUndefined();
    expect(store).toEqual({ failed: true });
    expect(alerts).toEqual([["Could not save", "error"]]);

    // Resolving query: no recovery, the result is returned.
    await expect(
      run({ run: async () => ({ ok: 1 }) }, storeValue, showAlert, "abc"),
    ).resolves.toEqual({ ok: 1 });
    expect(alerts).toHaveLength(1);

    // A missing parameter is an authoring bug: it throws BEFORE the try, so onError does not mask it.
    await expect(
      run({ run: async () => ({ ok: 1 }) }, storeValue, showAlert, undefined),
    ).rejects.toThrow("missing query parameter: id");
    expect(alerts).toHaveLength(1);
  });
});

describe("jsExpr — milestone 4 (corpus-driven): call a sibling or another object's function", () => {
  const fns = new Set(["helper", "save"]);

  it("compiles sibling and cross-object calls as awaited, validated callees", () => {
    expect(
      compileExpr(expr({ call: "helper", args: [{ param: "v" }, 1] })),
    ).toMatch(
      /^\(await \(async \(\) => \{ if \(\(this\.mcpCallDepth \?\? 0\) >= 32\) .*this\.mcpCallDepth = \(this\.mcpCallDepth \?\? 0\) \+ 1; try \{ return await this\.helper\(v, 1\); \} finally \{ this\.mcpCallDepth -= 1; \} \}\)\(\)\)$/,
    );
    expect(
      compileExpr(expr({ call: { object: "Utils", function: "count" } })),
    ).toMatch(/return await Utils\.count\(\); \} finally/);
    expect(
      compileSteps(
        steps([
          { call: "helper", args: [{ var: "x" }], into: "r" },
          { call: { object: "Utils", function: "count" } },
        ]),
      ),
    ).toEqual([
      expect.stringMatching(
        /^let r = \(await \(async \(\) => \{ .*return await this\.helper\(x\);.* \}\)\(\)\);$/,
      ),
      expect.stringMatching(
        /^\(await \(async \(\) => \{ .*return await Utils\.count\(\);.* \}\)\(\)\);$/,
      ),
    ]);
  });

  it("refuses an unknown sibling, a host object, a shadowing local, and a call inside a per-item callback", () => {
    expect(
      validateExpr(expr({ call: "nope" }), ctx({ functions: fns })),
    ).toMatch(/unknown function "nope"/);
    expect(
      validateExpr(expr({ call: "helper" }), ctx({ functions: fns })),
    ).toBeUndefined();
    expect(
      validateExpr(
        expr({ call: "helper" }),
        ctx({ functions: fns, self: "helper" }),
      ),
    ).toMatch(/may not call itself/);
    expect(
      exprSchema.safeParse({ call: { object: "globalThis", function: "eval" } })
        .success,
    ).toBe(false);
    expect(
      exprSchema.safeParse({
        call: { object: "Utils", function: "constructor" },
      }).success,
    ).toBe(false);
    expect(exprSchema.safeParse({ call: "__proto__" }).success).toBe(false);
    expect(
      exprSchema.safeParse({ call: "helper", args: new Array(9).fill(1) })
        .success,
    ).toBe(false);
    expect(
      stepsProblem(
        steps([
          { let: "Utils", value: 1 },
          { call: { object: "Utils", function: "count" } },
        ]),
        ctx({ functions: fns }),
      ),
    ).toMatch(/both a local name and a JS object to call/);
    expect(
      validateExpr(
        expr({
          fn: "map",
          args: [{ param: "rows" }, { call: "helper", args: [{ item: true }] }],
        }),
        ctx({ params: new Set(["rows"]), functions: fns }),
      ),
    ).toMatch(/call is not allowed inside map/);
  });

  it("executes a sibling call with this bound and renders an expression showAlert message", async () => {
    const lines = compileSteps(
      steps([
        { call: "helper", args: [{ param: "v" }], into: "r" },
        {
          showAlert: { fn: "concat", args: ["Got ", { var: "r" }] },
          style: "success",
        },
        { return: { var: "r" } },
      ]),
    );
    const alerts: unknown[] = [];
    const run = new Function(
      "showAlert",
      "v",
      `return (async function () { ${lines.join(" ")} }).call(this);`,
    ) as (this: unknown, showAlert: unknown, v: unknown) => Promise<unknown>;
    const self = { helper: async (x: string) => x.toUpperCase() };

    await expect(
      run.call(self, (m: string, s: string) => alerts.push([m, s]), "abc"),
    ).resolves.toBe("ABC");
    expect(alerts).toEqual([["Got ABC", "success"]]);
  });
});

describe("jsExpr — milestone 4 security notes", () => {
  it("keeps the 300-character cap on a literal showAlert message and refuses template syntax in an expression one", () => {
    expect(stepSchema.safeParse({ showAlert: "x".repeat(300) }).success).toBe(
      true,
    );
    expect(stepSchema.safeParse({ showAlert: "x".repeat(301) }).success).toBe(
      false,
    );
    expect(
      stepSchema.safeParse({
        showAlert: { fn: "concat", args: ["a", "{{ x }}"] },
      }).success,
    ).toBe(false);
    expect(
      stepSchema.safeParse({
        showAlert: { fn: "concat", args: ["Saved ", { var: "n" }] },
      }).success,
    ).toBe(true);
  });
});

describe("jsExpr — milestone 4 QA additions", () => {
  it("renders a non-string showAlert message through String()", async () => {
    const lines = compileSteps(steps([{ showAlert: { var: "n" } }]));
    const alerts: unknown[] = [];
    const run = new Function(
      "showAlert",
      "n",
      `return (async () => { ${lines.join(" ")} })();`,
    ) as (s: unknown, n: unknown) => Promise<void>;

    await run((m: string, s: string) => alerts.push([m, s]), 3);
    await run((m: string, s: string) => alerts.push([m, s]), null);
    expect(lines[0]).toBe('showAlert(String(n ?? ""), "info");');
    expect(alerts).toEqual([
      ["3", "info"],
      ["", "info"],
    ]);
  });

  it("allows a call inside a forEach body and inside an onError branch", () => {
    const body = steps([
      {
        forEach: { param: "rows" },
        as: "row",
        do: [{ call: "helper", args: [{ var: "row" }] }],
      },
      {
        run: "Q",
        into: "r",
        onError: [
          { call: { object: "Utils", function: "count" }, into: "n" },
          { return: { var: "n" } },
        ],
      },
    ]);

    expect(
      stepsProblem(
        body,
        ctx({ params: new Set(["rows"]), functions: new Set(["helper"]) }),
      ),
    ).toBeUndefined();
    expect(compileSteps(body).join(" ")).toContain(
      "return await this.helper(row); } finally",
    );
    expect(compileSteps(body).join(" ")).toContain(
      "return await Utils.count(); } finally",
    );
  });
});

describe("jsExpr — CodeRabbit round: templates that were not valid or not linear", () => {
  const run = (source: string): unknown => new Function(`return ${source};`)();

  it("negates a negative literal without emitting a decrement operator", () => {
    const source = compileExpr(expr({ op: "neg", args: [-1] }));

    expect(source).toBe("(-(-1))");
    expect(run(source)).toBe(1);
    expect(
      run(compileExpr(expr({ op: "neg", args: [{ op: "neg", args: [2] }] }))),
    ).toBe(2);
  });

  it("evaluates the length operand once, so nested length calls grow linearly", () => {
    let tree: unknown = { param: "value" };

    for (let i = 0; i < 10; i += 1) tree = { fn: "length", args: [tree] };

    const source = compileExpr(expr(tree));

    expect(source.length).toBeLessThan(1000);
    // The operand appears exactly once: the IIFE parameter carries it through each level.
    expect((source.match(/\bvalue\b/g) ?? []).length).toBe(1);
    expect(
      new Function(
        "v",
        `return ${compileExpr(expr({ fn: "length", args: [{ param: "v" }] }))};`,
      )("abc"),
    ).toBe(3);
    expect(
      new Function(
        "v",
        `return ${compileExpr(expr({ fn: "length", args: [{ param: "v" }] }))};`,
      )(null),
    ).toBe(0);
  });

  it("returns an object literal from a per-item body instead of parsing it as a block", () => {
    const source = compileExpr(
      expr({
        fn: "map",
        args: [
          { param: "rows" },
          {
            object: {
              id: { item: true },
              name: { fn: "upper", args: [{ item: true }] },
            },
          },
        ],
      }),
    );

    expect(source).toContain(".map((item) => ({ id: item, name:");
    expect(new Function("rows", `return ${source};`)(["a", "b"])).toEqual([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
  });
});

describe("jsExpr — runtime call-depth guard at every call site", () => {
  const run = async (source: string, self: Record<string, unknown>) =>
    new Function(
      "Utils",
      `return (async function () { return ${source}; }).call(this);`,
    ).call(self, self.Utils);

  it("increments and restores this.mcpCallDepth around a call, and stops a cycle at the limit", async () => {
    const source = compileExpr(expr({ call: "helper" }));
    let calls = 0;
    // The counter is an undeclared own property: a fresh object starts at undefined (?? 0).
    const self: Record<string, unknown> = {
      helper: async function (this: Record<string, unknown>) {
        calls += 1;

        // A cycle closed through hand-written code: helper calls back into the compiled call site.
        return run(source, this);
      },
    };

    await expect(run(source, self)).rejects.toThrow(
      `JS-object call depth exceeded ${CALL_DEPTH_LIMIT}`,
    );
    expect(calls).toBe(CALL_DEPTH_LIMIT);
    // Self-balancing: every frame that incremented also decremented, so the counter is exactly 0 after a trip and
    // a second run trips at the same depth (a reset-then-throw would have left it negative and weakened the limit).
    expect(self.mcpCallDepth).toBe(0);
    calls = 0;
    await expect(run(source, self)).rejects.toThrow("call depth exceeded");
    expect(calls).toBe(CALL_DEPTH_LIMIT);
    expect(self.mcpCallDepth).toBe(0);

    // A non-cyclic call returns its value and leaves the counter at zero.
    const plain: Record<string, unknown> = { helper: async () => 42 };

    await expect(run(source, plain)).resolves.toBe(42);
    expect(plain.mcpCallDepth).toBe(0);
  });

  it("decrements rather than resets: a nested non-cyclic call leaves the outer frame's count intact", async () => {
    const source = compileExpr(expr({ call: "helper" }));
    const seen: number[] = [];
    const self: Record<string, unknown> = {
      helper: async function (this: Record<string, unknown>) {
        seen.push(this.mcpCallDepth as number);

        // One nested call through the compiled site, then return: the outer frame must still see its own depth
        // afterwards (a `finally` that reset the counter to 0 would satisfy the trip test but not this one).
        if (seen.length === 1) await run(source, this);

        seen.push(this.mcpCallDepth as number);

        return 1;
      },
    };

    await expect(run(source, self)).resolves.toBe(1);
    expect(seen).toEqual([1, 2, 2, 1]);
    expect(self.mcpCallDepth).toBe(0);
  });
});

// APP-16324 F2: row-shaping functions. The design (docs/plans/2026-10-28-mcp-js-row-transforms-design.md) and its
// security review set these cases: prototype-named keys and data, mixed types, invalid dates, empty lists, a large
// sort, and the group cap.
describe("jsExpr — row shaping (sortBy, slice, sum, avg, groupBy, dateBucket)", () => {
  const evaluate = (input: unknown, scope: Record<string, unknown> = {}) => {
    const tree = expr(input);
    const names = Object.keys(scope);

    // Each scope entry stands for a declared local, as a `let` would make it.
    expect(validateExpr(tree, ctx({ vars: new Set(names) }))).toBeUndefined();

    return new Function(...names, `return ${compileExpr(tree)};`)(
      ...names.map((name) => scope[name]),
    );
  };

  const problem = (input: unknown): string | undefined => {
    const parsed = exprSchema.safeParse(input);

    if (!parsed.success) return JSON.stringify(parsed.error.issues);

    return validateExpr(parsed.data, ctx());
  };

  describe("validation", () => {
    it.each([
      ["sortBy", ["__proto__", "constructor", "prototype", "a.b", "1a"]],
      ["groupBy", ["__proto__", "constructor", "prototype", "a-b"]],
    ])("refuses a non-plain or prototype key in %s", (fn, keys) => {
      for (const key of keys) {
        const args =
          fn === "sortBy"
            ? [{ array: [] }, key, "asc"]
            : [{ array: [] }, key, { count: true }];

        expect(problem({ fn, args })).toContain("plain, non-prototype");
      }
    });

    it("refuses a prototype field in groupBy's sum or avg", () => {
      for (const aggregate of [{ sum: "__proto__" }, { avg: "constructor" }]) {
        expect(
          problem({ fn: "groupBy", args: [{ array: [] }, "k", aggregate] }),
        ).toContain("summed or averaged field");
      }
    });

    it("refuses a key, direction or unit that is not a literal", () => {
      expect(
        problem({ fn: "sortBy", args: [{ array: [] }, { var: "k" }, "asc"] }),
      ).toBeDefined();
      expect(
        problem({ fn: "sortBy", args: [{ array: [] }, "k", { var: "d" }] }),
      ).toBeDefined();
      expect(
        problem({
          fn: "groupBy",
          args: [{ array: [] }, { var: "k" }, { count: true }],
        }),
      ).toBeDefined();
      expect(
        problem({ fn: "dateBucket", args: ["2026-01-01", { var: "u" }] }),
      ).toBeDefined();
    });

    it("refuses a direction or unit outside the closed set", () => {
      expect(
        problem({ fn: "sortBy", args: [{ array: [] }, "k", "up"] }),
      ).toContain('"asc" or "desc"');
      expect(
        problem({ fn: "dateBucket", args: ["2026-01-01", "year"] }),
      ).toContain('"day", "week" or "month"');
    });

    it("admits an aggregate only as groupBy's third argument", () => {
      expect(
        problem({ fn: "groupBy", args: [{ array: [] }, "k", { var: "x" }] }),
      ).toContain("argument 3 must be");
      expect(problem({ fn: "sum", args: [{ count: true }] })).toContain(
        "only valid as the third argument of groupBy",
      );
      expect(
        problem({
          fn: "map",
          args: [{ array: [] }, { sum: "n" }],
        }),
      ).toContain("only valid as the third argument of groupBy");
    });
  });

  describe("runtime", () => {
    // A "__proto__" or "constructor" value in the data is only a Map key: it cannot reach Object.prototype.
    it("groups prototype-named data values as ordinary keys", () => {
      const rows = [
        { s: "__proto__" },
        { s: "constructor" },
        { s: "__proto__" },
      ];
      const result = evaluate(
        { fn: "groupBy", args: [{ var: "rows" }, "s", { count: true }] },
        { rows },
      );

      expect(result).toEqual([
        { key: "__proto__", value: 2 },
        { key: "constructor", value: 1 },
      ]);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(Object.getPrototypeOf(result[0])).toBe(Object.prototype);
    });

    it("sorts mixed types by rank, keeps empty values last in both directions, and never sorts the input", () => {
      const when = new Date("2026-01-01T00:00:00Z");
      const rows = [
        { v: "b" },
        { v: null },
        { v: 10 },
        { v: when },
        { v: "a" },
        {},
        { v: 2 },
      ];
      const values = (dir: string) =>
        (
          evaluate(
            { fn: "sortBy", args: [{ var: "rows" }, "v", dir] },
            { rows },
          ) as { v?: unknown }[]
        ).map((row) => row.v);

      expect(values("asc")).toEqual([2, 10, when, "a", "b", null, undefined]);
      expect(values("desc")).toEqual([10, 2, when, "b", "a", null, undefined]);
      expect(rows[0]).toEqual({ v: "b" });
    });

    it("sorts 100,000 rows", () => {
      const rows = Array.from({ length: 100000 }, (_, index) => ({
        n: (index * 7919) % 100000,
        name: `row ${index % 977}`,
      }));
      const byNumber = evaluate(
        { fn: "sortBy", args: [{ var: "rows" }, "n", "asc"] },
        { rows },
      ) as { n: number }[];
      const byText = evaluate(
        { fn: "sortBy", args: [{ var: "rows" }, "name", "desc"] },
        { rows },
      ) as { name: string }[];

      const collator = new Intl.Collator();

      expect(byNumber.map((row) => row.n)).toEqual(
        Array.from({ length: 100000 }, (_, index) => index),
      );
      expect(byText).toHaveLength(100000);
      // Every neighbour pair is in descending locale order.
      expect(
        byText.every(
          (row, index) =>
            index === 0 ||
            collator.compare(byText[index - 1].name, row.name) >= 0,
        ),
      ).toBe(true);
    });

    // Locale order, not code-unit order: "a" sorts with "A", not after "Z".
    it("sorts text with the locale collator, dates against dates, and keeps equal keys in input order", () => {
      const rows = [
        { v: "b", i: 0 },
        { v: "Z", i: 1 },
        { v: "a", i: 2 },
        { v: "b", i: 3 },
      ];
      const sorted = (dir: string) =>
        (
          evaluate(
            { fn: "sortBy", args: [{ var: "rows" }, "v", dir] },
            { rows },
          ) as { i: number }[]
        ).map((row) => row.i);

      expect(sorted("asc")).toEqual([2, 0, 3, 1]);
      expect(sorted("desc")).toEqual([1, 0, 3, 2]);

      const later = new Date("2026-02-01T00:00:00Z");
      const earlier = new Date("2026-01-01T00:00:00Z");

      expect(
        evaluate(
          { fn: "sortBy", args: [{ var: "rows" }, "d", "asc"] },
          { rows: [{ d: later }, { d: earlier }] },
        ),
      ).toEqual([{ d: earlier }, { d: later }]);
    });

    it("skips values that are not numbers inside groupBy sum and avg", () => {
      const rows = [
        { k: "a", n: null },
        { k: "a", n: "" },
        { k: "a", n: true },
        { k: "a", n: [5] },
        { k: "a", n: 4 },
        { k: "b", n: null },
      ];

      expect(
        evaluate(
          { fn: "groupBy", args: [{ var: "rows" }, "k", { sum: "n" }] },
          { rows },
        ),
      ).toEqual([
        { key: "a", value: 4 },
        { key: "b", value: 0 },
      ]);
      expect(
        evaluate(
          { fn: "groupBy", args: [{ var: "rows" }, "k", { avg: "n" }] },
          { rows },
        ),
      ).toEqual([
        { key: "a", value: 4 },
        { key: "b", value: null },
      ]);
    });

    it('keeps null, missing, 1 and "1" keys as separate groups, and groups object keys by identity', () => {
      const shared = { id: 1 };

      expect(
        evaluate(
          { fn: "groupBy", args: [{ var: "rows" }, "k", { count: true }] },
          {
            rows: [
              { k: null },
              {},
              { k: 1 },
              { k: "1" },
              { k: shared },
              { k: { id: 1 } },
              { k: shared },
            ],
          },
        ),
      ).toEqual([
        { key: null, value: 1 },
        { key: undefined, value: 1 },
        { key: 1, value: 1 },
        { key: "1", value: 1 },
        { key: shared, value: 2 },
        { key: { id: 1 }, value: 1 },
      ]);
    });

    // CI runs in UTC, where local and UTC days agree, so the compiled code runs in a child Node process pinned to
    // UTC+14: a template that used local-time methods would bucket by the viewer's day there. (Changing TZ inside the
    // jest worker does not take effect.)
    it("buckets in UTC whatever the viewer's time zone", () => {
      const bucket = (date: string, unit: string): unknown => {
        const source = compileExpr(
          expr({ fn: "dateBucket", args: [date, unit] }),
        );

        return JSON.parse(
          execFileSync(
            process.execPath,
            ["-e", `process.stdout.write(JSON.stringify(${source}))`],
            { env: { ...process.env, TZ: "Pacific/Kiritimati" } },
          ).toString(),
        );
      };

      // Sunday 2026-11-01 23:30 UTC is already Monday afternoon at UTC+14.
      expect(bucket("2026-11-01T23:30:00Z", "week")).toBe("2026-10-26");
      expect(bucket("2026-10-31T23:30:00Z", "month")).toBe("2026-10-01");
      expect(bucket("2026-10-31T23:30:00Z", "day")).toBe("2026-10-31");
    });

    it("returns null for a date whose bucket falls outside the years 0000-9999", () => {
      for (const edge of [-8.64e15, 8.64e15, "+010000-06-15T00:00:00Z"]) {
        for (const unit of ["day", "week", "month"]) {
          expect(
            evaluate(
              { fn: "dateBucket", args: [{ var: "d" }, unit] },
              { d: edge },
            ),
          ).toBeNull();
        }
      }

      expect(
        evaluate({ fn: "dateBucket", args: ["0001-01-03T00:00:00Z", "day"] }),
      ).toBe("0001-01-03");
    });

    it("returns null for an empty avg and 0 for an empty sum, and treats a non-list as empty", () => {
      expect(evaluate({ fn: "avg", args: [{ array: [] }] })).toBeNull();
      expect(evaluate({ fn: "sum", args: [{ array: [] }] })).toBe(0);
      expect(evaluate({ fn: "sum", args: [{ var: "x" }] }, { x: "123" })).toBe(
        0,
      );
      expect(
        evaluate({ fn: "avg", args: [{ var: "x" }] }, { x: [null, "", [5]] }),
      ).toBeNull();
    });

    it("returns null for an invalid date in every unit", () => {
      for (const unit of ["day", "week", "month"]) {
        expect(
          evaluate({ fn: "dateBucket", args: [{ var: "d" }, unit] }, { d: {} }),
        ).toBeNull();
      }
    });

    // new Date(null) and new Date(false) are 1970: a SQL NULL date must not land in a 1970 bucket.
    it("returns null for a missing date instead of a 1970 bucket", () => {
      for (const missing of [null, undefined, "", false, true]) {
        for (const unit of ["day", "week", "month"]) {
          expect(
            evaluate(
              { fn: "dateBucket", args: [{ var: "d" }, unit] },
              { d: missing },
            ),
          ).toBeNull();
        }
      }

      // Epoch milliseconds are still a date.
      expect(
        evaluate({ fn: "dateBucket", args: [{ var: "d" }, "day"] }, { d: 0 }),
      ).toBe("1970-01-01");
    });

    // A tree that never went through zod: the validator itself refuses a mixed or malformed aggregate.
    it("refuses a malformed aggregate even without the zod schema", () => {
      const tree = (aggregate: unknown) =>
        ({
          fn: "groupBy",
          args: [{ array: [] }, "k", aggregate],
        }) as unknown as Expr;

      expect(
        validateExpr(tree({ count: true, sum: "__proto__" }), ctx()),
      ).toContain("exactly one of count, sum or avg");
      expect(validateExpr(tree({ count: 1 }), ctx())).toContain(
        "count must be { count: true }",
      );
      expect(validateExpr(tree({ sum: 5 }), ctx())).toContain(
        "summed or averaged field",
      );
    });

    it("buckets across month and year edges in UTC", () => {
      // Friday 2027-01-01: its ISO week starts on Monday 2026-12-28.
      expect(
        evaluate({ fn: "dateBucket", args: ["2027-01-01T05:00:00Z", "week"] }),
      ).toBe("2026-12-28");
      // A Monday stays on itself.
      expect(
        evaluate({ fn: "dateBucket", args: ["2026-10-26T00:00:00Z", "week"] }),
      ).toBe("2026-10-26");
    });

    it("turns slice bounds into whole numbers, with NaN as 0", () => {
      expect(
        evaluate({ fn: "slice", args: [{ array: [1, 2, 3, 4] }, "x", 2.9] }),
      ).toEqual([1, 2]);
      expect(
        evaluate({ fn: "slice", args: [{ var: "x" }, 0] }, { x: null }),
      ).toEqual([]);
    });

    it(`throws past ${GROUP_BY_MAX_GROUPS} groups instead of cutting the result`, () => {
      const rows = Array.from({ length: GROUP_BY_MAX_GROUPS + 1 }, (_, k) => ({
        k,
      }));

      expect(() =>
        evaluate(
          { fn: "groupBy", args: [{ var: "rows" }, "k", { count: true }] },
          { rows },
        ),
      ).toThrow(`groupBy: more than ${GROUP_BY_MAX_GROUPS} groups`);
      expect(
        evaluate(
          { fn: "groupBy", args: [{ var: "rows" }, "k", { count: true }] },
          { rows: rows.slice(0, GROUP_BY_MAX_GROUPS) },
        ),
      ).toHaveLength(GROUP_BY_MAX_GROUPS);
    });

    // The guide's own worked example, evaluated as agents will copy it (not an inline copy that could drift), with
    // the Tickets query stubbed.
    it("evaluates the guide's weekly-count example over query rows", () => {
      const example = JS_OBJECT_GUIDE_EXAMPLES.find(
        (entry) => entry.title === "A weekly count for a chart",
      );
      const returns = (
        example?.definition.functions[0] as { returns?: unknown } | undefined
      )?.returns;
      const rows = [
        { created_at: "2026-10-28T10:00:00Z" },
        { created_at: "2026-10-20T10:00:00Z" },
        { created_at: "2026-10-27T10:00:00Z" },
        { created_at: "nope" },
        { created_at: null },
      ];
      const series = new Function(
        "Tickets",
        `return ${compileExpr(expr(returns))};`,
      )({ data: rows });

      expect(series).toEqual([
        { key: "2026-10-19", value: 1 },
        { key: "2026-10-26", value: 2 },
        { key: null, value: 2 },
      ]);
    });
  });
});
