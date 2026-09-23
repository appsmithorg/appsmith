import { aiQuerySpecSchema } from "./aiQuery.js";
import { deleteActionSpecSchema } from "./actionPatch.js";
import { graphqlQuerySpecSchema } from "./graphqlQuery.js";
import { createJsObjectSpecSchema } from "./jsObject.js";
import { mongoQuerySpecSchema } from "./mongoQuery.js";
import { querySpecSchema } from "./query.js";
import { redisQuerySpecSchema } from "./redisQuery.js";
import { restApiSpecSchema } from "./restApi.js";
import { s3QuerySpecSchema } from "./s3Query.js";
import { storedId } from "./schema.js";
import { sheetsQuerySpecSchema } from "./sheetsQuery.js";

// The charset is the security property: these ids are interpolated into URL path segments, encodeURIComponent
// leaves "." untouched, and the WHATWG URL parser then collapses a ".." segment — retargeting the request at a
// different endpoint. `..` is the primitive; the rest guard the obvious variations around it.
const TRAVERSAL_VALUES: [string, string][] = [
  ["parent dot segment", ".."],
  ["current dot segment", "."],
  ["embedded traversal", "a/../.."],
  ["backslash separator", "a\\..\\.."],
  ["percent-encoded dot segment", "%2e%2e"],
  ["forward slash", "actions/1"],
  ["empty string", ""],
];

describe("storedId", () => {
  it.each(TRAVERSAL_VALUES)("rejects %s", (_label, value) => {
    expect(storedId.safeParse(value).success).toBe(false);
  });

  it.each([
    ["a Mongo ObjectId", "689f3c1e4b2a5d7e8f0a1b2c"],
    ["a short test-style id", "app1"],
    ["a long alphanumeric id", "a".repeat(128)],
  ])("accepts %s", (_label, value) => {
    expect(storedId.safeParse(value).success).toBe(true);
  });

  it("rejects an id longer than the 128-character bound", () => {
    expect(storedId.safeParse("a".repeat(129)).success).toBe(false);
  });

  it("rejects binding and template syntax, subsuming the old RAW_EXPRESSION refinement", () => {
    for (const value of ["{{evil}}", "${evil}", "`evil`", "a{b", "a$b"]) {
      expect(storedId.safeParse(value).success).toBe(false);
    }
  });
});

// The point of these: `storedId` is shared by nine builders, but only actionPatch had a traversal test, so a future
// local redefinition of `identifier`/`entityId` in any other builder would silently reopen the hole. Each case goes
// through the PUBLIC spec schema, not `storedId` directly, so it proves the wiring rather than the regex.
describe("every builder spec schema routes its stored IDs through storedId", () => {
  const base = {
    query: {
      name: "ListUsers",
      applicationId: "app1",
      pageId: "page1",
      datasourceId: "ds1",
      operation: "SELECT",
      table: "users",
    },
    restApi: {
      name: "GetUsers",
      applicationId: "app1",
      pageId: "page1",
      datasourceId: "ds1",
      method: "GET",
      path: "/v1/users",
    },
    mongo: {
      name: "getUsers",
      applicationId: "app1",
      pageId: "p1",
      datasourceId: "ds1",
      collection: "users",
      operation: "FIND",
    },
    redis: {
      name: "RedisQ",
      applicationId: "app1",
      pageId: "page1",
      datasourceId: "ds1",
      command: "GET",
      key: "user:42",
    },
    s3: {
      name: "S3Q",
      applicationId: "app1",
      pageId: "p1",
      datasourceId: "ds1",
      operation: "list",
      bucket: "my-bucket",
    },
    sheets: {
      name: "sheetRows",
      applicationId: "app1",
      pageId: "p1",
      datasourceId: "ds1",
      sheetUrl: "https://docs.google.com/spreadsheets/d/1AbC_dEf-123/edit",
      sheetName: "Sheet1",
      operation: "read",
    },
    graphql: {
      name: "GqlQ",
      applicationId: "app1",
      pageId: "p1",
      datasourceId: "ds1",
      query: "query { viewer { id name } }",
    },
    ai: {
      name: "AskAI",
      applicationId: "app1",
      pageId: "page1",
      datasourceId: "ds1",
      model: "gpt-4o",
      messages: [{ role: "user", content: { literal: "hi" } }],
    },
  };

  // Only the id fields matter here; each schema's other required fields come from `base`. A schema whose baseline
  // does not parse would make these vacuous, so the baseline is asserted first in the test below.
  const cases: [
    string,
    {
      schema: { safeParse: (v: unknown) => { success: boolean } };
      valid: object;
      field: string;
    },
  ][] = [
    [
      "querySpecSchema.datasourceId",
      { schema: querySpecSchema, valid: base.query, field: "datasourceId" },
    ],
    [
      "querySpecSchema.applicationId",
      { schema: querySpecSchema, valid: base.query, field: "applicationId" },
    ],
    [
      "querySpecSchema.pageId",
      { schema: querySpecSchema, valid: base.query, field: "pageId" },
    ],
    [
      "restApiSpecSchema.datasourceId",
      { schema: restApiSpecSchema, valid: base.restApi, field: "datasourceId" },
    ],
    [
      "restApiSpecSchema.applicationId",
      {
        schema: restApiSpecSchema,
        valid: base.restApi,
        field: "applicationId",
      },
    ],
    [
      "mongoQuerySpecSchema.datasourceId",
      {
        schema: mongoQuerySpecSchema,
        valid: base.mongo,
        field: "datasourceId",
      },
    ],
    [
      "redisQuerySpecSchema.datasourceId",
      {
        schema: redisQuerySpecSchema,
        valid: base.redis,
        field: "datasourceId",
      },
    ],
    [
      "s3QuerySpecSchema.datasourceId",
      { schema: s3QuerySpecSchema, valid: base.s3, field: "datasourceId" },
    ],
    [
      "sheetsQuerySpecSchema.datasourceId",
      {
        schema: sheetsQuerySpecSchema,
        valid: base.sheets,
        field: "datasourceId",
      },
    ],
    [
      "graphqlQuerySpecSchema.datasourceId",
      {
        schema: graphqlQuerySpecSchema,
        valid: base.graphql,
        field: "datasourceId",
      },
    ],
    [
      "aiQuerySpecSchema.datasourceId",
      { schema: aiQuerySpecSchema, valid: base.ai, field: "datasourceId" },
    ],
  ];

  it.each(cases)(
    "%s rejects a traversal id",
    (_label, { field, schema, valid }) => {
      // Guard against a vacuous assertion: the untampered spec must parse, or "rejected" proves nothing.
      expect(schema.safeParse(valid).success).toBe(true);

      for (const [, traversal] of TRAVERSAL_VALUES) {
        expect(schema.safeParse({ ...valid, [field]: traversal }).success).toBe(
          false,
        );
      }
    },
  );

  it("actionPatch and jsObject reject traversal ids too", () => {
    const reference = {
      actionId: "storedAction1",
      applicationId: "app1",
      revision: "a".repeat(64),
    };

    expect(deleteActionSpecSchema.safeParse(reference).success).toBe(true);

    for (const [, traversal] of TRAVERSAL_VALUES) {
      expect(
        deleteActionSpecSchema.safeParse({ ...reference, actionId: traversal })
          .success,
      ).toBe(false);
      expect(
        createJsObjectSpecSchema.safeParse({
          applicationId: traversal,
          pageId: "page1",
          workspaceId: "ws1",
          pluginId: "plugin1",
          revision: "a".repeat(64),
          name: "Utils",
          functions: [{ name: "run" }],
        }).success,
      ).toBe(false);
    }
  });
});
