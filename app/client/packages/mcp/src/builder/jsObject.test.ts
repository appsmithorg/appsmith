import {
  buildCreateJsObjectRequest,
  buildDeleteJsObjectRequest,
  buildUpdateJsObjectRequest,
  compileJsObject,
  compileJsObjectCode,
  crossObjectCalls,
  createJsObjectSpecSchema,
  deleteJsObjectSpecSchema,
  hasSpecMarker,
  isCompilerAuthoredJsBody,
  jsObjectDefinitionFromBody,
  jsObjectDefinitionSchema,
  updateJsObjectSpecSchema,
} from "./jsObject.js";

const RUN_ONLY_CODE =
  "export default { limit: 25, enabled: true, loadUsers: async function () { await GetUsers.run(); return { loaded: true, count: 25 }; } };";
const MARKER = / \/\* mcp-spec:[A-Za-z0-9+/=]+ \*\/$/;

const revision = "d".repeat(64);
const createSpec = {
  applicationId: "app1",
  pageId: "page1",
  workspaceId: "workspace1",
  pluginId: "jsPlugin1",
  revision,
  name: "UserHelpers",
  constants: { limit: 25, enabled: true },
  functions: [
    {
      name: "loadUsers",
      run: [{ query: "GetUsers" }],
      returns: { loaded: true, count: 25 },
    },
  ],
};

describe("JS object builder", () => {
  it("compiles only the declarative JS-object grammar", () => {
    const spec = createJsObjectSpecSchema.parse(createSpec);

    // The code part is unchanged from the original grammar; the definition rides along as a trailing base64
    // block comment so the object can be read back structurally and recognised exactly.
    expect(compileJsObjectCode(spec)).toBe(RUN_ONLY_CODE);
    expect(compileJsObject(spec)).toMatch(MARKER);
    expect(
      compileJsObject(spec).startsWith(`${RUN_ONLY_CODE} /* mcp-spec:`),
    ).toBe(true);
    // The server REQUIRES applicationId (400 INVALID_PARAMETER without it) and one JSAction per function so the
    // editor lists/runs them — the same shape the web client sends.
    expect(buildCreateJsObjectRequest(spec)).toEqual({
      applicationId: "app1",
      revision,
      method: "POST",
      path: "v1/collections/actions",
      body: {
        name: "UserHelpers",
        pageId: "page1",
        applicationId: "app1",
        workspaceId: "workspace1",
        pluginId: "jsPlugin1",
        pluginType: "JS",
        body: expect.stringMatching(
          /^export default \{ limit: 25, enabled: true, loadUsers: async function \(\) \{ await GetUsers\.run\(\); return \{ loaded: true, count: 25 \}; \} \}; \/\* mcp-spec:/,
        ),
        variables: [],
        actions: [
          {
            name: "loadUsers",
            workspaceId: "workspace1",
            runBehaviour: "MANUAL",
            clientSideExecution: true,
            actionConfiguration: {
              body: "async function () { await GetUsers.run(); return { loaded: true, count: 25 }; }",
              timeoutInMillisecond: 0,
              jsArguments: [],
            },
          },
        ],
      },
      destructive: false,
    });
  });

  it("builds revision-bound updates (body via the body route + a per-function diff) and destructive deletes", () => {
    const update = updateJsObjectSpecSchema.parse({
      applicationId: "app1",
      collectionId: "collection1",
      revision,
      name: "RenamedHelpers",
      functions: [
        { name: "refresh", run: [{ query: "GetUsers" }] },
        { name: "reset", returns: { done: true } },
      ],
    });
    const current = {
      actions: [
        { id: "act-refresh", name: "refresh" },
        { id: "act-old", name: "legacyFn" },
      ],
    };

    expect(buildUpdateJsObjectRequest(update, current)).toEqual({
      applicationId: "app1",
      revision,
      method: "PATCH",
      path: "v1/collections/actions/collection1",
      // The compiled body goes through PUT /{id}/body (PATCH nulls it server-side).
      jsBody: expect.stringMatching(
        /^export default \{ refresh: async function \(\) \{ await GetUsers\.run\(\); \}, reset: async function \(\) \{ return \{ done: true \}; \} \}; \/\* mcp-spec:/,
      ),
      body: {
        actionCollection: {
          id: "collection1",
          name: "RenamedHelpers",
          pluginType: "JS",
        },
        actions: {
          added: [
            {
              name: "reset",
              runBehaviour: "MANUAL",
              clientSideExecution: true,
              actionConfiguration: {
                body: "async function () { return { done: true }; }",
                timeoutInMillisecond: 0,
                jsArguments: [],
              },
            },
          ],
          updated: [
            {
              id: "act-refresh",
              name: "refresh",
              runBehaviour: "MANUAL",
              clientSideExecution: true,
              actionConfiguration: {
                body: "async function () { await GetUsers.run(); }",
                timeoutInMillisecond: 0,
                jsArguments: [],
              },
            },
          ],
          deleted: [{ id: "act-old", name: "legacyFn" }],
        },
      },
      destructive: false,
    });

    // A rename-only update touches neither the body nor the functions.
    const rename = updateJsObjectSpecSchema.parse({
      applicationId: "app1",
      collectionId: "collection1",
      revision,
      name: "Renamed",
    });
    const renameRequest = buildUpdateJsObjectRequest(rename, current);

    expect(renameRequest.jsBody).toBeUndefined();
    expect(renameRequest.body).toEqual({
      actionCollection: {
        id: "collection1",
        name: "Renamed",
        pluginType: "JS",
      },
      actions: { added: [], updated: [], deleted: [] },
    });

    expect(
      buildDeleteJsObjectRequest(
        deleteJsObjectSpecSchema.parse({
          applicationId: "app1",
          collectionId: "collection1",
          revision,
        }),
      ),
    ).toEqual({
      applicationId: "app1",
      collectionId: "collection1",
      revision,
      method: "DELETE",
      path: "v1/collections/actions/collection1",
      destructive: true,
      confirmation: {
        operation: "delete_js_object",
        entityKey: "js_object:collection1",
      },
    });
  });
});

describe("jsExpr grammar in a JS object — params, steps and expression returns", () => {
  const definition = {
    constants: { maxIds: 50 },
    functions: [
      {
        name: "splitLines",
        params: ["value"],
        returns: {
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
                {
                  op: "not",
                  args: [{ fn: "isEmpty", args: [{ item: true }] }],
                },
              ],
            },
          ],
        },
      },
      {
        name: "save",
        steps: [
          {
            let: "ids",
            value: {
              fn: "unique",
              args: [
                {
                  fn: "split",
                  args: [
                    { widget: "inpInstanceAllow", property: "text" },
                    { sep: "commaOrNewline" },
                  ],
                },
              ],
            },
          },
          {
            if: {
              op: "gt",
              args: [
                { fn: "length", args: [{ var: "ids" }] },
                { constant: "maxIds" },
              ],
            },
            then: [{ throw: "Too many instance IDs." }],
          },
          {
            run: "UpsertBanner",
            with: { ids: { var: "ids" } },
            into: "result",
          },
          { run: "GetBanners" },
          { return: { object: { saved: true, ids: { var: "ids" } } } },
        ],
      },
    ],
  };

  it("compiles the richer grammar, embeds the definition, and reads it back exactly", () => {
    const spec = createJsObjectSpecSchema.parse({
      ...createSpec,
      ...definition,
    });
    const body = compileJsObject(spec);
    const code = compileJsObjectCode(spec);

    expect(
      code.startsWith(
        "export default { maxIds: 50, splitLines: async function (value) { return [...new Set(",
      ),
    ).toBe(true);
    expect(code).toContain(
      'save: async function () { let ids = [...new Set(((v) => Array.isArray(v) ? v : [])(String(inpInstanceAllow.text ?? "").split(/[\\r\\n,]+/)))]; if ((((ids) == null ? 0 : (ids).length) > this.maxIds)) { throw new Error("Too many instance IDs."); } let result = await UpsertBanner.run((($p) => { for (const $k of Object.keys($p)) { if ($p[$k] === undefined) { throw new Error("missing query parameter: " + $k); } } return $p; })({ ids: ids })); await GetBanners.run(); return { saved: true, ids: ids }; } };',
    );
    expect(code).not.toMatch(/\{\{|\}\}|\$\{|`/);
    expect(body.startsWith(`${code} /* mcp-spec:`)).toBe(true);
    expect(jsObjectDefinitionFromBody(body)).toEqual(definition);
    expect(isCompilerAuthoredJsBody(body)).toBe(true);

    // Per-function JSActions carry the params as jsArguments.
    const request = buildCreateJsObjectRequest(spec);
    const actions = (
      request.body as {
        actions: {
          name: string;
          actionConfiguration: { jsArguments: unknown };
        }[];
      }
    ).actions;

    expect(actions.map((a) => a.name)).toEqual(["splitLines", "save"]);
    expect(actions[0].actionConfiguration.jsArguments).toEqual([
      { name: "value", value: "" },
    ]);
  });

  it("treats a hand-edited body as editor-authored even if the marker survives", () => {
    const body = compileJsObject(
      createJsObjectSpecSchema.parse({ ...createSpec, ...definition }),
    );
    const tampered = body.replace(
      "await GetBanners.run();",
      "await fetch('https://evil.example');",
    );

    expect(jsObjectDefinitionFromBody(tampered)).toBeUndefined();
    expect(isCompilerAuthoredJsBody(tampered)).toBe(false);

    // A forged marker whose definition does not recompile to the code is not trusted either.
    const forged = `export default { leak: async () => { return appsmith.user; } }; /* mcp-spec:${Buffer.from(JSON.stringify(definition)).toString("base64")} */`;

    expect(isCompilerAuthoredJsBody(forged)).toBe(false);
  });

  it("rejects scoping and grammar errors with the function's name in the message", () => {
    const bad = createJsObjectSpecSchema.safeParse({
      ...createSpec,
      functions: [{ name: "f", steps: [{ return: { var: "missing" } }] }],
    });

    expect(bad.success).toBe(false);
    expect(
      bad.error?.issues.map((issue) => issue.message).join("\n"),
    ).toContain('f: steps[0]: "missing" is used before');

    for (const fn of [
      { name: "f", params: ["this"] },
      // JS keywords in a param compile to `async function (class) {}`: a SyntaxError that breaks the whole
      // collection (council M2 DX finding); the shared jsExpr reserved list refuses them.
      { name: "f", params: ["class"] },
      { name: "f", params: ["eval"] },
      { name: "f", params: ["showAlert"] },
      { name: "__proto__", steps: [{ return: 1 }] },
      { name: "constructor", steps: [{ return: 1 }] },
      { name: "f", params: ["a", "a"] },
      { name: "f", steps: [{ run: "Q; evil()" }] },
      { name: "f", steps: [{ let: "x", value: { fn: "eval", args: ["1"] } }] },
      { name: "f", returns: { constant: "nope" } },
      { name: "f", body: "return 1" },
    ]) {
      expect(
        createJsObjectSpecSchema.safeParse({ ...createSpec, functions: [fn] })
          .success,
      ).toBe(false);
    }
  });
});

describe("isCompilerAuthoredJsBody — recognises exactly what compileJsObject emits", () => {
  it("accepts every shape the compiler produces", () => {
    const shapes = [
      createJsObjectSpecSchema.parse(createSpec),
      createJsObjectSpecSchema.parse({
        ...createSpec,
        constants: undefined,
        functions: [{ name: "noop" }],
      }),
      createJsObjectSpecSchema.parse({
        ...createSpec,
        constants: { s: 'quote " and \\ backslash', n: -1.5e21, z: null },
        functions: [
          { name: "a", run: [{ query: "Q1" }, { query: "Q2" }] },
          { name: "b", returns: {} },
          { name: "c", run: [{ query: "Q3" }], returns: { ok: true, k: "v" } },
        ],
      }),
    ];

    for (const spec of shapes) {
      expect(isCompilerAuthoredJsBody(compileJsObject(spec))).toBe(true);
    }
  });

  it("classes editor-authored JavaScript as not compiler-authored", () => {
    for (const body of [
      "export default {\n\tmyVar1: [],\n\tmyFun1 () {\n\t\t// write code here\n\t}\n}",
      "export default { save: async () => { const k = 'sk-secret'; await fetch(k); } };",
      "export default { refresh: async () => { await GetBanners.run(); return GetBanners.data; } };",
      "export default { refresh: async (x) => { await GetBanners.run(); } };",
      "export default { limit: 25 }; evil();",
      "",
      "x".repeat(70_000),
    ]) {
      expect(isCompilerAuthoredJsBody(body)).toBe(false);
    }
  });
});

describe("JS object grammar rejects source and dynamic syntax", () => {
  const invalid: [string, Record<string, unknown>][] = [
    ["raw body", { body: "export default { unsafe() { return eval('1') } }" }],
    ["raw source", { source: "import x from 'x'" }],
    ["imports", { imports: ["node:fs"] }],
    [
      "network API",
      { functions: [{ name: "bad", fetch: "https://evil.example" }] },
    ],
    ["eval", { functions: [{ name: "bad", eval: "1 + 1" }] }],
    ["global access", { functions: [{ name: "bad", global: "process" }] }],
    [
      "computed properties",
      { functions: [{ name: "bad", returns: { "[key]": 1 } }] },
    ],
    ["loops", { functions: [{ name: "bad", loop: "for (;;) {}" }] }],
    [
      "arbitrary expression",
      { functions: [{ name: "bad", expression: "a + b" }] },
    ],
    ["template binding", { constants: { value: "{{ GetUsers.data }}" } }],
    ["template literal", { constants: { value: "${GetUsers.data}" } }],
  ];

  it.each(invalid)("rejects %s", (_label, override) => {
    expect(
      createJsObjectSpecSchema.safeParse({
        ...createSpec,
        ...override,
      }).success,
    ).toBe(false);
  });

  it("rejects unsafe identifiers, duplicate functions, incomplete updates, and missing revisions", () => {
    expect(
      createJsObjectSpecSchema.safeParse({
        ...createSpec,
        functions: [{ name: "run-query" }],
      }).success,
    ).toBe(false);
    expect(
      createJsObjectSpecSchema.safeParse({
        ...createSpec,
        functions: [{ name: "same" }, { name: "same" }],
      }).success,
    ).toBe(false);
    expect(
      updateJsObjectSpecSchema.safeParse({
        applicationId: "app1",
        collectionId: "collection1",
        revision,
        constants: { answer: 42 },
      }).success,
    ).toBe(false);
    expect(
      deleteJsObjectSpecSchema.safeParse({
        applicationId: "app1",
        collectionId: "collection1",
      }).success,
    ).toBe(false);
  });
});

describe("definition marker — availability and versioning (council M2 security)", () => {
  const definition = {
    functions: [{ name: "f", steps: [{ return: 1 }] }],
  };

  it("classifies a 256 KB whitespace body in linear time (no regex over the code part)", () => {
    const hostile = " ".repeat(256 * 1024 - 8) + "x */";
    const started = Date.now();

    expect(jsObjectDefinitionFromBody(hostile)).toBeUndefined();
    expect(isCompilerAuthoredJsBody(hostile)).toBe(false);
    // Generous bound for saturated CI runners; the quadratic regex this guards against took ~37 s.
    expect(Date.now() - started).toBeLessThan(5000);
  });

  it("embeds a version and refuses a marker from another version", () => {
    const body = compileJsObject(definition);
    const encoded = body.slice(body.lastIndexOf(" /* mcp-spec:") + 13, -3);
    const payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));

    expect(payload.v).toBe(1);
    expect(jsObjectDefinitionFromBody(body)).toEqual(definition);

    const other = Buffer.from(
      JSON.stringify({ ...payload, v: 2 }),
      "utf8",
    ).toString("base64");
    const code = body.slice(0, body.lastIndexOf(" /* mcp-spec:"));

    expect(
      jsObjectDefinitionFromBody(`${code} /* mcp-spec:${other} */`),
    ).toBeUndefined();
    expect(hasSpecMarker(`${code} /* mcp-spec:${other} */`)).toBe(true);
    expect(hasSpecMarker(code)).toBe(false);
  });
});

describe("cross-object calls are collected for the tool-level existence check", () => {
  it("lists each distinct { object, function } pair once and ignores sibling calls", () => {
    const definition = jsObjectDefinitionSchema.parse({
      functions: [
        {
          name: "a",
          steps: [
            { call: { object: "Utils", function: "count" }, into: "n" },
            { call: "b" },
          ],
        },
        {
          name: "b",
          returns: {
            op: "add",
            args: [
              { call: { object: "Utils", function: "count" } },
              { call: { object: "Other", function: "go" } },
            ],
          },
        },
      ],
    });

    expect(
      crossObjectCalls(definition).sort((a, b) =>
        a.object.localeCompare(b.object),
      ),
    ).toEqual([
      { object: "Other", function: "go" },
      { object: "Utils", function: "count" },
    ]);
    expect(
      jsObjectDefinitionSchema.safeParse({
        functions: [{ name: "a", steps: [{ call: "missing" }] }],
      }).success,
    ).toBe(false);
  });
});

describe("crossObjectCalls ignores an object key that is merely named call", () => {
  it("does not report a { call: <Expr> } object member as a cross-object target", () => {
    const definition = jsObjectDefinitionSchema.parse({
      functions: [
        { name: "helper", returns: 1 },
        { name: "a", returns: { object: { call: { call: "helper" } } } },
      ],
    });

    expect(crossObjectCalls(definition)).toEqual([]);
  });
});

describe("a function may not call itself through the definition schema", () => {
  it("refuses a direct self-call and accepts a call to a sibling", () => {
    expect(
      jsObjectDefinitionSchema.safeParse({
        functions: [{ name: "a", steps: [{ call: "a" }] }],
      }).success,
    ).toBe(false);
    expect(
      jsObjectDefinitionSchema.safeParse({
        functions: [
          { name: "a", steps: [{ call: "b" }] },
          { name: "b", returns: 1 },
        ],
      }).success,
    ).toBe(true);
  });
});
