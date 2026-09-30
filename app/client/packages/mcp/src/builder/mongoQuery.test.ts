import {
  buildMongoActionDto,
  compileMongoQuery,
  mongoQuerySpecSchema,
  normalizeIsoDateTime,
  specUsesParams,
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

  it("compiles operator clauses from the closed op enum, merging range clauses on one field", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "FIND",
        filter: [
          // The soft-delete predicate the equality-only grammar could not express.
          { field: "deleted", op: "ne", value: { literal: true } },
          { field: "priority", op: "gte", value: { literal: 1 } },
          { field: "priority", op: "lte", value: { literal: 5 } },
          {
            field: "edition",
            op: "in",
            value: { literal: ["BUSINESS", "ENTERPRISE"] },
          },
          { field: "archivedAt", op: "exists", value: { literal: false } },
          {
            field: "ownerId",
            op: "nin",
            value: { widget: "msOwners", property: "selectedOptionValues" },
          },
        ],
      }),
    );

    expect(compiled.find?.query).toBe(
      '{ "deleted": { "$ne": true }, "priority": { "$gte": 1, "$lte": 5 }, "edition": { "$in": ["BUSINESS","ENTERPRISE"] }, "archivedAt": { "$exists": false }, "ownerId": { "$nin": {{ msOwners.selectedOptionValues }} } }',
    );
  });

  it("emits date literals and date-tagged widget refs inside a compiler-owned $date wrapper", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "FIND",
        filter: [
          {
            field: "startsAt",
            op: "lte",
            value: { date: "2026-10-01T00:00:00Z" },
          },
          {
            field: "endsAt",
            op: "gte",
            value: { widget: "dtNow", property: "selectedDate", as: "date" },
          },
        ],
      }),
    );

    expect(compiled.find?.query).toBe(
      '{ "startsAt": { "$lte": { "$date": "2026-10-01T00:00:00Z" } }, "endsAt": { "$gte": { "$date": {{ dtNow.selectedDate }} } } }',
    );

    // INSERT documents take the same date value kinds.
    const inserted = compileMongoQuery(
      parse({
        ...base,
        operation: "INSERT",
        document: [
          { field: "createdAt", value: { date: "2026-09-29" } },
          {
            field: "startsAt",
            value: { widget: "dtStart", property: "selectedDate", as: "date" },
          },
        ],
      }),
    );

    // A calendar date normalises to midnight UTC: Extended JSON `$date` needs a full date-time with offset.
    expect(inserted.insert?.documents).toBe(
      '[{ "createdAt": { "$date": "2026-09-29T00:00:00Z" }, "startsAt": { "$date": {{ dtStart.selectedDate }} } }]',
    );
  });

  it("binds run-time params from a JS function as this.params bindings, including as: 'date'", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "UPDATE",
        filter: [{ field: "_id", value: { param: "id" } }],
        update: [
          { field: "title", value: { param: "title" } },
          { field: "startsAt", value: { param: "startsAt", as: "date" } },
          { field: "instanceIds", value: { param: "instanceIds" } },
        ],
      }),
    );

    expect(compiled.update).toEqual({
      query: '{ "_id": { "$eq": {{ this.params.id }} } }',
      update:
        '{ "$set": { "title": {{ this.params.title }}, "startsAt": { "$date": {{ this.params.startsAt }} }, "instanceIds": {{ this.params.instanceIds }} } }',
      limit: "SINGLE",
    });

    // in/nin accept a param (an array the function built).
    expect(
      compileMongoQuery(
        parse({
          ...base,
          operation: "FIND",
          filter: [
            { field: "edition", op: "in", value: { param: "editions" } },
          ],
        }),
      ).find?.query,
    ).toBe('{ "edition": { "$in": {{ this.params.editions }} } }');

    for (const param of ["a.b", "a b", "{{x}}", "params['x']"]) {
      expect(
        mongoQuerySpecSchema.safeParse({
          ...base,
          operation: "FIND",
          filter: [{ field: "a", value: { param } }],
        }).success,
      ).toBe(false);
    }
  });

  it("normalises every admitted date literal to a full date-time with an offset", () => {
    expect(normalizeIsoDateTime("2026-09-29")).toBe("2026-09-29T00:00:00Z");
    expect(normalizeIsoDateTime("2026-09-29T10:30")).toBe(
      "2026-09-29T10:30:00Z",
    );
    expect(normalizeIsoDateTime("2026-09-29T10:30Z")).toBe(
      "2026-09-29T10:30:00Z",
    );
    expect(normalizeIsoDateTime("2026-09-29T10:30+05:30")).toBe(
      "2026-09-29T10:30:00+05:30",
    );
    expect(normalizeIsoDateTime("2026-09-29T10:30:15")).toBe(
      "2026-09-29T10:30:15Z",
    );
    expect(normalizeIsoDateTime("2026-09-29T10:30:15.250Z")).toBe(
      "2026-09-29T10:30:15.250Z",
    );
    expect(normalizeIsoDateTime("2026-09-29T10:30:15-04:00")).toBe(
      "2026-09-29T10:30:15-04:00",
    );

    // as: 'date' is limited to a DatePicker's selectedDate (already ISO 8601 with offset at runtime).
    for (const property of ["text", "formattedDate", "selectedDates"]) {
      expect(
        mongoQuerySpecSchema.safeParse({
          ...base,
          operation: "FIND",
          filter: [
            {
              field: "a",
              value: { widget: "W", property, as: "date" },
            },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects operator/value mismatches, unknown operators, and malformed dates", () => {
    const cases: unknown[] = [
      // op outside the enum — no way to smuggle a raw Mongo operator
      { field: "a", op: "$where", value: { literal: 1 } },
      { field: "a", op: "regex", value: { literal: "x" } },
      // a list is only valid with in/nin
      { field: "a", op: "eq", value: { literal: [1, 2] } },
      { field: "a", op: "gt", value: { literal: [1, 2] } },
      // in needs a list or a widget ref, not a scalar
      { field: "a", op: "in", value: { literal: 1 } },
      { field: "a", op: "in", value: { literal: [] } },
      // exists takes a boolean literal only
      { field: "a", op: "exists", value: { literal: "yes" } },
      { field: "a", op: "exists", value: { widget: "W", property: "p" } },
      // dates: ISO only, real calendar dates only, no expression charset
      { field: "a", value: { date: "next tuesday" } },
      { field: "a", value: { date: "2026-02-30" } },
      { field: "a", value: { date: '2026-01-01"}' } },
      { field: "a", value: { date: "{{ x }}" } },
      // as: only 'date', and never on a list operator ($in: { $date } is not a list)
      { field: "a", value: { widget: "W", property: "p", as: "raw" } },
      {
        field: "a",
        op: "in",
        value: { widget: "W", property: "p", as: "date" },
      },
    ];

    for (const clause of cases) {
      expect(
        mongoQuerySpecSchema.safeParse({
          ...base,
          operation: "FIND",
          filter: [clause],
        }).success,
      ).toBe(false);
    }

    // The compiler refuses an equality clause mixed with operator clauses on one field (last-key-wins hazard).
    expect(() =>
      compileMongoQuery(
        parse({
          ...base,
          operation: "FIND",
          filter: [
            { field: "a", value: { literal: 1 } },
            { field: "a", op: "gt", value: { literal: 0 } },
          ],
        }),
      ),
    ).toThrow(/mixes an equality clause/);

    // A repeated operator on one field would emit a duplicate JSON key (last one silently wins) — refused.
    expect(() =>
      compileMongoQuery(
        parse({
          ...base,
          operation: "FIND",
          filter: [
            { field: "a", op: "gt", value: { literal: 1 } },
            { field: "a", op: "gt", value: { literal: 2 } },
          ],
        }),
      ),
    ).toThrow(/repeats the operator "gt"/);
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

    // A run-time binding in the equality position is wrapped in a compiler-owned `$eq`: MongoDB compares the
    // operand of `$eq` as a literal, so a viewer who sends `{ "$ne": null }` typed as an object cannot turn the
    // clause into an operator (the browser chooses the parameter's data type and the server trusts it).
    expect(compiled.find?.query).toBe(
      '{ "ownerId": { "$eq": {{ Table1.selectedRow.id }} } }',
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

describe("compileMongoQuery — UPDATE and DELETE", () => {
  it("compiles an UPDATE to a $set update with a match query, defaulting to SINGLE", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "UPDATE",
        filter: [
          {
            field: "id",
            value: { widget: "Table1", property: "selectedRow.id" },
          },
        ],
        update: [
          { field: "status", value: { literal: "done" } },
          { field: "note", value: { widget: "NoteInput", property: "text" } },
        ],
      }),
    );

    expect(compiled.command).toBe("UPDATE");
    expect(compiled.update).toEqual({
      query: '{ "id": { "$eq": {{ Table1.selectedRow.id }} } }',
      update: '{ "$set": { "status": "done", "note": {{ NoteInput.text }} } }',
      limit: "SINGLE",
    });
  });

  it("compiles a DELETE with a match query and multi:true -> ALL", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "DELETE",
        filter: [{ field: "archived", value: { literal: true } }],
        multi: true,
      }),
    );

    expect(compiled.command).toBe("DELETE");
    expect(compiled.delete).toEqual({
      query: '{ "archived": true }',
      limit: "ALL",
    });
  });

  it("an UPDATE with multi:true targets ALL matches", () => {
    const compiled = compileMongoQuery(
      parse({
        ...base,
        operation: "UPDATE",
        filter: [{ field: "status", value: { literal: "open" } }],
        update: [{ field: "status", value: { literal: "closed" } }],
        multi: true,
      }),
    );

    expect(compiled.update?.limit).toBe("ALL");
  });

  it("emits the exact updateMany / delete formData shape (manual, not on-load)", () => {
    const updateSpec = parse({
      ...base,
      operation: "UPDATE",
      filter: [{ field: "id", value: { literal: 7 } }],
      update: [{ field: "status", value: { literal: "done" } }],
    });
    const updateDto = buildMongoActionDto(
      updateSpec,
      compileMongoQuery(updateSpec),
    ) as {
      executeOnLoad: boolean;
      actionConfiguration: {
        formData: {
          command: { data: string };
          updateMany: {
            query: { data: string };
            update: { data: string };
            limit: { data: string };
          };
        };
      };
    };

    expect(updateDto.actionConfiguration.formData.command.data).toBe("UPDATE");
    expect(updateDto.actionConfiguration.formData.updateMany.limit.data).toBe(
      "SINGLE",
    );
    expect(updateDto.actionConfiguration.formData.updateMany.update.data).toBe(
      '{ "$set": { "status": "done" } }',
    );
    expect(updateDto.executeOnLoad).toBe(false);

    const deleteSpec = parse({
      ...base,
      operation: "DELETE",
      filter: [{ field: "id", value: { literal: 7 } }],
    });
    const deleteDto = buildMongoActionDto(
      deleteSpec,
      compileMongoQuery(deleteSpec),
    ) as {
      executeOnLoad: boolean;
      actionConfiguration: {
        formData: {
          delete: { query: { data: string }; limit: { data: string } };
        };
      };
    };

    expect(deleteDto.actionConfiguration.formData.delete.query.data).toBe(
      '{ "id": 7 }',
    );
    expect(deleteDto.actionConfiguration.formData.delete.limit.data).toBe(
      "SINGLE",
    );
    expect(deleteDto.executeOnLoad).toBe(false);
  });

  it("requires a filter on UPDATE and DELETE (a mutation is always targeted)", () => {
    // Schema permits the shape; compileMongoQuery is the guard (like the SQL builder / INSERT document).
    expect(() =>
      compileMongoQuery(
        parse({
          ...base,
          operation: "UPDATE",
          update: [{ field: "status", value: { literal: "done" } }],
        }),
      ),
    ).toThrow(/UPDATE requires a filter/);
    expect(() =>
      compileMongoQuery(parse({ ...base, operation: "DELETE" })),
    ).toThrow(/DELETE requires a filter/);
  });

  it("requires an update on UPDATE, and rejects an operator-injecting field name", () => {
    expect(() =>
      compileMongoQuery(
        parse({
          ...base,
          operation: "UPDATE",
          filter: [{ field: "id", value: { literal: 1 } }],
        }),
      ),
    ).toThrow(/UPDATE requires an update/);
    // A field named like a Mongo operator can't pass the identifier charset ($ excluded) — a schema-level reject.
    expect(
      mongoQuerySpecSchema.safeParse({
        ...base,
        operation: "UPDATE",
        filter: [{ field: "id", value: { literal: 1 } }],
        update: [{ field: "$where", value: { literal: "x" } }],
      }).success,
    ).toBe(false);
  });

  it("rejects fields that belong to another operation", () => {
    expect(
      mongoQuerySpecSchema.safeParse({
        ...base,
        operation: "DELETE",
        filter: [{ field: "id", value: { literal: 1 } }],
        update: [{ field: "status", value: { literal: "x" } }],
      }).success,
    ).toBe(false);
    expect(
      mongoQuerySpecSchema.safeParse({
        ...base,
        operation: "FIND",
        multi: true,
      }).success,
    ).toBe(false);
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
      // A FIND runs on page load so a bound widget populates without a manual trigger.
      executeOnLoad: true,
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
      executeOnLoad: boolean;
      actionConfiguration: { formData: Record<string, unknown> };
    };

    // An INSERT is user-triggered — it must NOT run on page load.
    expect(dto.executeOnLoad).toBe(false);
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

describe("run-time bindings in filters (council M3 security)", () => {
  it("wraps widget and param equality clauses in $eq but leaves literals plain", () => {
    const compiled = compileMongoQuery(
      mongoQuerySpecSchema.parse({
        name: "FindOne",
        applicationId: "a".repeat(24),
        pageId: "p".repeat(24),
        datasourceId: "d".repeat(24),
        operation: "FIND",
        collection: "orders",
        filter: [
          { field: "status", value: { literal: "open" } },
          {
            field: "owner",
            value: { widget: "Table1", property: "selectedRow.id" },
          },
          { field: "batch", value: { param: "batch" } },
          { field: "since", value: { date: "2026-01-01" } },
        ],
      }),
    );

    expect(compiled.find?.query).toBe(
      '{ "status": "open", "owner": { "$eq": {{ Table1.selectedRow.id }} }, "batch": { "$eq": {{ this.params.batch }} }, "since": { "$date": "2026-01-01T00:00:00Z" } }',
    );
  });

  it("marks a query that reads this.params as MANUAL and never on page load in the DTO", () => {
    const spec = mongoQuerySpecSchema.parse({
      name: "FindByParam",
      applicationId: "a".repeat(24),
      pageId: "p".repeat(24),
      datasourceId: "d".repeat(24),
      operation: "FIND",
      collection: "orders",
      filter: [{ field: "owner", value: { param: "owner" } }],
    });
    const dto = buildMongoActionDto(spec, compileMongoQuery(spec));

    expect(specUsesParams(spec)).toBe(true);
    expect(dto.executeOnLoad).toBe(false);
    expect(dto.runBehaviour).toBe("MANUAL");
    // The DTO cannot pin the behaviour (the server drops userSetOnLoad on create); the tool handler does that
    // through the run-behaviour route — see app.test.ts.
    expect(dto.userSetOnLoad).toBeUndefined();

    const plain = mongoQuerySpecSchema.parse({
      ...spec,
      name: "FindAll",
      filter: [],
    });
    const plainDto = buildMongoActionDto(plain, compileMongoQuery(plain));

    expect(specUsesParams(plain)).toBe(false);
    expect(plainDto.executeOnLoad).toBe(true);
    expect(plainDto.userSetOnLoad).toBeUndefined();
  });
});

describe("as: 'date' in the equality position", () => {
  it("nests the $date wrapper inside the $eq wrapper", () => {
    const compiled = compileMongoQuery(
      mongoQuerySpecSchema.parse({
        name: "FindOnDay",
        applicationId: "a".repeat(24),
        pageId: "p".repeat(24),
        datasourceId: "d".repeat(24),
        operation: "FIND",
        collection: "orders",
        filter: [
          {
            field: "day",
            value: { widget: "dtDay", property: "selectedDate", as: "date" },
          },
        ],
      }),
    );

    expect(compiled.find?.query).toBe(
      '{ "day": { "$eq": { "$date": {{ dtDay.selectedDate }} } } }',
    );
  });
});
