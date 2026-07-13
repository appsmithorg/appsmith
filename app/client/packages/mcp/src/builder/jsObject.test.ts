import {
  buildCreateJsObjectRequest,
  buildDeleteJsObjectRequest,
  buildUpdateJsObjectRequest,
  compileJsObject,
  createJsObjectSpecSchema,
  deleteJsObjectSpecSchema,
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
    expect(buildCreateJsObjectRequest(spec)).toEqual({
      applicationId: "app1",
      revision,
      method: "POST",
      path: "v1/collections/actions",
      body: {
        name: "UserHelpers",
        pageId: "page1",
        workspaceId: "workspace1",
        pluginId: "jsPlugin1",
        pluginType: "JS",
        body: "export default { limit: 25, enabled: true, loadUsers: async () => { await GetUsers.run(); return { loaded: true, count: 25 }; } };",
        variables: [],
        actions: [],
      },
      destructive: false,
    });
  });

  it("builds revision-bound updates and destructive deletes", () => {
    const update = updateJsObjectSpecSchema.parse({
      applicationId: "app1",
      collectionId: "collection1",
      revision,
      name: "RenamedHelpers",
      functions: [{ name: "refresh", run: [{ query: "GetUsers" }] }],
    });

    expect(buildUpdateJsObjectRequest(update)).toEqual({
      applicationId: "app1",
      revision,
      method: "PATCH",
      path: "v1/collections/actions/collection1",
      body: {
        actionCollection: {
          id: "collection1",
          name: "RenamedHelpers",
          pluginType: "JS",
          body: "export default { refresh: async () => { await GetUsers.run(); } };",
          variables: [],
          actions: [],
        },
        actions: { added: [], updated: [], deleted: [] },
      },
      destructive: false,
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
