import {
  buildMongoActionDto,
  compileMongoQuery,
  mongoQuerySpecSchema,
} from "./mongoQuery.js";

function parse(spec: unknown) {
  const result = mongoQuerySpecSchema.safeParse(spec);

  if (!result.success) throw new Error("spec did not parse");

  return result.data;
}

const base = {
  name: "getUsers",
  applicationId: "app1",
  pageId: "p1",
  datasourceId: "ds1",
  collection: "users",
};

describe("compileMongoQuery — structured Mongo FIND/INSERT, no raw injection", () => {
  it("compiles a FIND with an equality filter, a literal value, sort, and limit", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "FIND",
        filter: [{ field: "status", value: { literal: "active" } }],
        sort: [{ field: "createdAt", direction: "DESC" }],
        limit: 25,
      }),
    );

    expect(compiled.command).toBe("FIND");
    expect(compiled.collection).toBe("users");
    expect(compiled.find).toEqual({
      query: '{ "status": "active" }',
      sort: '{ "createdAt": -1 }',
      limit: "25",
    });
  });

  it("defaults an empty filter to {} and omits sort/limit when absent", () => {
    const compiled = compileMongoQuery(parse({ ...base, operation: "FIND" }));

    expect(compiled.find).toEqual({ query: "{}" });
  });

  it("emits a widget reference as a bare checked binding (parameterized at runtime)", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "FIND",
        filter: [
          {
            field: "ownerId",
            value: { widget: "Table1", property: "selectedRow.id" },
          },
        ],
      }),
    );

    // Bare `{{ }}` (no surrounding quotes): smart substitution supplies JSON typing/quoting at runtime.
    expect(compiled.find?.query).toBe(
      '{ "ownerId": {{ Table1.selectedRow.id }} }',
    );
  });

  it("compiles an INSERT of one document with mixed literal types", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "INSERT",
        document: [
          { field: "name", value: { literal: "Ada" } },
          { field: "age", value: { literal: 30 } },
          { field: "active", value: { literal: true } },
          { field: "note", value: { literal: null } },
        ],
      }),
    );

    expect(compiled.command).toBe("INSERT");
    expect(compiled.insert?.documents).toBe(
      '[{ "name": "Ada", "age": 30, "active": true, "note": null }]',
    );
  });

  it("JSON-encodes a literal string containing quotes so it cannot break out of its JSON position", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "INSERT",
        document: [
          { field: "name", value: { literal: 'a" }, "x": 1, "y": "' } },
        ],
      }),
    );

    // The dangerous characters are escaped by JSON.stringify; the whole value stays a single JSON string.
    expect(compiled.insert?.documents).toBe(
      '[{ "name": "a\\" }, \\"x\\": 1, \\"y\\": \\"" }]',
    );
    // Re-parsing the emitted array yields exactly one key with the literal value (no injected keys).
    const parsedDocs = JSON.parse(compiled.insert!.documents) as Record<
      string,
      unknown
    >[];

    expect(Object.keys(parsedDocs[0])).toEqual(["name"]);
  });

  it("supports a dotted (nested) field path", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "FIND",
        filter: [{ field: "address.city", value: { literal: "NYC" } }],
      }),
    );

    expect(compiled.find?.query).toBe('{ "address.city": "NYC" }');
  });
});

describe("mongoQuerySpecSchema — rejects escape chars and operator injection", () => {
  it("rejects a collection name with escape/injection characters", () => {
    for (const collection of [
      "users; drop",
      'a"]}}',
      "a b",
      "a.b",
      "$evil",
      "a`b",
      "a${b}",
    ]) {
      expect(
        mongoQuerySpecSchema.safeParse({
          ...base,
          collection,
          operation: "FIND",
        }).success,
      ).toBe(false);
    }
  });

  it("rejects a field name that could inject a Mongo operator or a new key", () => {
    for (const field of ['a"]}}', "$where", "a b", "a}b", "a${b}", "a`b"]) {
      expect(
        mongoQuerySpecSchema.safeParse({
          ...base,
          operation: "FIND",
          filter: [{ field, value: { literal: 1 } }],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects a document field with injection characters", () => {
    for (const field of ['a"]}}', "$set", "a}b"]) {
      expect(
        mongoQuerySpecSchema.safeParse({
          ...base,
          operation: "INSERT",
          document: [{ field, value: { literal: 1 } }],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects a literal value carrying template/binding syntax", () => {
    for (const literal of ["{{evil}}", "${evil}", "a`b", "}} ok {{"]) {
      expect(
        mongoQuerySpecSchema.safeParse({
          ...base,
          operation: "INSERT",
          document: [{ field: "note", value: { literal } }],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects field/limit/sort on an INSERT and document on a FIND (shape mismatch)", () => {
    expect(
      mongoQuerySpecSchema.safeParse({
        ...base,
        operation: "INSERT",
        document: [{ field: "a", value: { literal: 1 } }],
        limit: 5,
      }).success,
    ).toBe(false);
    expect(
      mongoQuerySpecSchema.safeParse({
        ...base,
        operation: "FIND",
        document: [{ field: "a", value: { literal: 1 } }],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown top-level key (strict schema)", () => {
    expect(
      mongoQuerySpecSchema.safeParse({
        ...base,
        operation: "FIND",
        bogus: 1,
      }).success,
    ).toBe(false);
  });

  it("the compiler rejects an INSERT with no document", () => {
    // The schema permits the shape (document is optional); compileMongoQuery is the guard, like compileQuery for SQL.
    expect(() =>
      compileMongoQuery(parse({ ...base, operation: "INSERT" })),
    ).toThrow(/INSERT requires a document/);
  });
});

describe("buildMongoActionDto — the exact Mongo formData action shape", () => {
  it("wraps every command leaf as { data } and forces smartSubstitution on (FIND)", () => {
    const spec = parse({
      ...base,
      operation: "FIND",
      filter: [{ field: "status", value: { literal: "active" } }],
      limit: 10,
    });
    const dto = buildMongoActionDto(spec, compileMongoQuery(spec));

    expect(dto).toEqual({
      name: "getUsers",
      pageId: "p1",
      datasource: { id: "ds1" },
      actionConfiguration: {
        formData: {
          command: { data: "FIND" },
          collection: { data: "users" },
          smartSubstitution: { data: true },
          find: {
            query: { data: '{ "status": "active" }' },
            limit: { data: "10" },
          },
        },
      },
    });
  });

  it("emits the INSERT command shape with the documents array", () => {
    const spec = parse({
      ...base,
      operation: "INSERT",
      document: [{ field: "name", value: { literal: "Ada" } }],
    });
    const dto = buildMongoActionDto(spec, compileMongoQuery(spec)) as {
      actionConfiguration: { formData: Record<string, unknown> };
    };

    expect(dto.actionConfiguration.formData).toEqual({
      command: { data: "INSERT" },
      collection: { data: "users" },
      smartSubstitution: { data: true },
      insert: { documents: { data: '[{ "name": "Ada" }]' } },
    });
    // The credential/secret invariant: nothing password-like is ever in the DTO.
    expect(JSON.stringify(dto)).not.toMatch(/password/i);
  });
});
