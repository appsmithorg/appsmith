import {
  compileExpr,
  compileSteps,
  type Expr,
  type ExprContext,
  exceedsJsonDepth,
  exprSchema,
  type Fn,
  MAX_DEFINITION_JSON_DEPTH,
  FN_NAMES,
  type Op,
  OPS,
  type Step,
  stepSchema,
  stepsProblem,
  validateExpr,
} from "./jsExpr.js";

const ctx = (over: Partial<ExprContext> = {}): ExprContext => ({
  params: new Set(),
  vars: new Set(),
  constants: new Set(),
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
    expect(source).toContain('.map((item) => String(item ?? "").trim())');
    expect(source).toContain(".filter((item) => (!((v) =>");
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
