import {
  buildCreateJsObjectRequest,
  buildDeleteJsObjectRequest,
  buildUpdateJsObjectRequest,
  compileJsObject,
  createJsObjectSpecSchema,
  deleteJsObjectSpecSchema,
  isCompilerAuthoredJsBody,
  updateJsObjectSpecSchema,
} from "./jsObject.js";

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

    expect(compileJsObject(spec)).toBe(
      "export default { limit: 25, enabled: true, loadUsers: async () => { await GetUsers.run(); return { loaded: true, count: 25 }; } };",
    );
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
        body: "export default { limit: 25, enabled: true, loadUsers: async () => { await GetUsers.run(); return { loaded: true, count: 25 }; } };",
        variables: [],
        actions: [
          {
            name: "loadUsers",
            workspaceId: "workspace1",
            runBehaviour: "MANUAL",
            clientSideExecution: true,
            actionConfiguration: {
              body: "async () => { await GetUsers.run(); return { loaded: true, count: 25 }; }",
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
      jsBody:
        "export default { refresh: async () => { await GetUsers.run(); }, reset: async () => { return { done: true }; } };",
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
                body: "async () => { return { done: true }; }",
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
                body: "async () => { await GetUsers.run(); }",
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
