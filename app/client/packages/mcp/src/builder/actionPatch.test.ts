import {
  buildDeleteActionDto,
  buildDuplicateActionDto,
  buildUpdateActionDto,
  deleteActionSpecSchema,
  duplicateActionSpecSchema,
  updateActionSpecSchema,
} from "./actionPatch.js";

const revision = "a".repeat(64);
const reference = {
  actionId: "storedAction1",
  applicationId: "app1",
  revision,
};

const query = {
  name: "ListUsers",
  applicationId: "app1",
  pageId: "page1",
  datasourceId: "storedSqlDatasource",
  operation: "SELECT",
  table: "users",
};

const rest = {
  name: "GetUsers",
  applicationId: "app1",
  pageId: "page1",
  datasourceId: "storedRestDatasource",
  method: "GET",
  path: "/v1/users",
};

function parseUpdate(spec: unknown) {
  return updateActionSpecSchema.parse(spec);
}

describe("action lifecycle builders", () => {
  it("builds a SQL update DTO solely from structured SQL and stored IDs", () => {
    const dto = buildUpdateActionDto(
      parseUpdate({ ...reference, kind: "SQL", name: "ListUsers", query }),
    );

    expect(dto).toEqual({
      ...reference,
      action: {
        id: "storedAction1",
        name: "ListUsers",
        pageId: "page1",
        datasource: { id: "storedSqlDatasource" },
        actionConfiguration: {
          body: "SELECT * FROM users;",
          pluginSpecifiedTemplates: [{ value: true }],
        },
      },
    });
  });

  it("builds a REST update DTO solely from structured REST fields", () => {
    const dto = buildUpdateActionDto(
      parseUpdate({ ...reference, kind: "REST", name: "GetUsers", rest }),
    );

    expect(dto.action).toMatchObject({
      id: "storedAction1",
      name: "GetUsers",
      pageId: "page1",
      datasource: { id: "storedRestDatasource" },
      actionConfiguration: {
        path: "/v1/users",
        httpMethod: "GET",
        httpVersion: "HTTP11",
      },
    });
    expect(dto.action).not.toHaveProperty("applicationId");
  });

  it("allows a name-only update without an action configuration", () => {
    const dto = buildUpdateActionDto(
      parseUpdate({ ...reference, kind: "SQL", name: "RenamedQuery" }),
    );

    expect(dto.action).toEqual({ id: "storedAction1", name: "RenamedQuery" });
  });

  it("builds duplicate and delete requests from stored references", () => {
    expect(
      buildDuplicateActionDto(
        duplicateActionSpecSchema.parse({
          ...reference,
          kind: "REST",
          name: "GetUsersCopy",
        }),
      ),
    ).toEqual({ ...reference, kind: "REST", name: "GetUsersCopy" });
    expect(buildDeleteActionDto(deleteActionSpecSchema.parse(reference))).toEqual(
      reference,
    );
  });
});

describe("action lifecycle schemas reject unsafe action mutation", () => {
  const badUpdate: [string, Record<string, unknown>][] = [
    ["unsupported action kind", { kind: "GRAPHQL", name: "Bad" }],
    ["raw SQL body", { kind: "SQL", query: { ...query, body: "DROP TABLE users" } }],
    [
      "raw SQL binding",
      { kind: "SQL", query: { ...query, table: "{{ evil }}" } },
    ],
    [
      "raw REST binding",
      { kind: "REST", rest: { ...rest, path: "/v1/{{ evil }}" } },
    ],
    [
      "URL change",
      { kind: "REST", rest: { ...rest, path: "https://attacker.example/users" } },
    ],
    [
      "arbitrary header",
      {
        kind: "REST",
        rest: {
          ...rest,
          headers: [{ key: "Authorization", value: "Bearer secret" }],
        },
      },
    ],
    [
      "credentials",
      { kind: "REST", rest: { ...rest, credentials: { username: "a" } } },
    ],
    [
      "inline datasource URL",
      {
        kind: "REST",
        rest: { ...rest, datasourceId: { url: "https://attacker.example" } },
      },
    ],
    [
      "mismatched application",
      { kind: "SQL", name: "ListUsers", query: { ...query, applicationId: "app2" } },
    ],
    [
      "mismatched action name",
      { kind: "REST", name: "Other", rest },
    ],
    ["empty update", { kind: "SQL" }],
  ];

  it.each(badUpdate)("rejects %s", (_label, override) => {
    expect(
      updateActionSpecSchema.safeParse({ ...reference, ...override }).success,
    ).toBe(false);
  });

  it("rejects unknown fields and invalid lifecycle references", () => {
    expect(
      duplicateActionSpecSchema.safeParse({
        ...reference,
        kind: "SQL",
        name: "Copy",
        actionConfiguration: { body: "SELECT 1" },
      }).success,
    ).toBe(false);
    expect(
      deleteActionSpecSchema.safeParse({ actionId: "action1", applicationId: "app1" })
        .success,
    ).toBe(false);
    expect(
      deleteActionSpecSchema.safeParse({ ...reference, revision: "stale" }).success,
    ).toBe(false);
    expect(
      deleteActionSpecSchema.safeParse({ ...reference, url: "https://attacker.example" })
        .success,
    ).toBe(false);
  });
});
