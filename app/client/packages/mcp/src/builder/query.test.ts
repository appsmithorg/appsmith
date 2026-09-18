import { buildActionDto, compileQuery, querySpecSchema } from "./query.js";

function parse(spec: unknown) {
  const result = querySpecSchema.safeParse(spec);

  if (!result.success) throw new Error("spec did not parse");

  return result.data;
}

const base = {
  name: "getUsers",
  applicationId: "app1",
  pageId: "p1",
  datasourceId: "ds1",
};

describe("compileQuery — parameterized SQL, no raw injection", () => {
  it("compiles a SELECT with columns, a filter, and a limit", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "users",
        columns: ["id", "name"],
        filters: [{ column: "status", op: "eq", value: { literal: "active" } }],
        limit: 50,
      }),
    );

    expect(body).toBe(
      'SELECT id, name FROM users WHERE status = {{ "active" }} LIMIT 50;',
    );
  });

  it("emits a widget reference as an identifier binding", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "orders",
        filters: [
          {
            column: "id",
            op: "eq",
            value: { widget: "Table1", property: "selectedRow.id" },
          },
        ],
      }),
    );

    expect(body).toBe(
      "SELECT * FROM orders WHERE id = {{ Table1.selectedRow.id }};",
    );
  });

  it("compiles INSERT / UPDATE / DELETE with bind parameters", () => {
    const insert = compileQuery(
      parse({
        ...base,
        operation: "INSERT",
        table: "users",
        values: [
          { column: "name", value: { literal: "Ada" } },
          { column: "age", value: { literal: 30 } },
        ],
      }),
    );
    const update = compileQuery(
      parse({
        ...base,
        operation: "UPDATE",
        table: "users",
        values: [{ column: "name", value: { literal: "Ada" } }],
        filters: [{ column: "id", op: "eq", value: { literal: 1 } }],
      }),
    );
    const del = compileQuery(
      parse({
        ...base,
        operation: "DELETE",
        table: "users",
        filters: [{ column: "id", op: "eq", value: { literal: 1 } }],
      }),
    );

    expect(insert).toBe(
      'INSERT INTO users (name, age) VALUES ({{ "Ada" }}, {{ 30 }});',
    );
    expect(update).toBe(
      'UPDATE users SET name = {{ "Ada" }} WHERE id = {{ 1 }};',
    );
    expect(del).toBe("DELETE FROM users WHERE id = {{ 1 }};");
  });

  it("accepts a schema-qualified table name", () => {
    const body = compileQuery(
      parse({ ...base, operation: "SELECT", table: "public.users" }),
    );

    expect(body).toBe("SELECT * FROM public.users;");
  });
});

describe("querySpecSchema — rejects anything that could inject", () => {
  const bad: [string, unknown][] = [
    ["semicolon in table", { table: "users; DROP TABLE users" }],
    ["quote in table", { table: 'users"' }],
    ["comment token in column", { columns: ["id--"] }],
    ["DDL operation", { operation: "DROP" }],
    [
      "raw expression literal",
      {
        filters: [{ column: "a", op: "eq", value: { literal: "{{evil()}}" } }],
      },
    ],
    [
      "backtick literal",
      { filters: [{ column: "a", op: "eq", value: { literal: "`x`" } }] },
    ],
    ["non-identifier query name", { name: "get users" }],
    [
      "bad widget property",
      {
        filters: [
          { column: "a", op: "eq", value: { widget: "T", property: "a;b" } },
        ],
      },
    ],
    [
      "unknown operator",
      { filters: [{ column: "a", op: "regex", value: { literal: 1 } }] },
    ],
  ];

  it.each(bad)("rejects %s", (_label, override) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "users",
      ...(override as Record<string, unknown>),
    });

    expect(result.success).toBe(false);
  });
});

describe("compileQuery — SELECT ordering & aggregation (M4-T1)", () => {
  it("emits ORDER BY with quoted identifiers and enum directions", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "users",
        columns: ["id", "name"],
        orderBy: [
          { column: "name", direction: "ASC" },
          { column: "created_at", direction: "DESC" },
        ],
      }),
    );

    expect(body).toBe(
      'SELECT id, name FROM users ORDER BY "name" ASC, "created_at" DESC;',
    );
  });

  it("emits COUNT(*) with a GROUP BY rollup", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "orders",
        aggregate: { fn: "count" },
        groupBy: ["status"],
      }),
    );

    expect(body).toBe(
      'SELECT "status", COUNT(*) AS count FROM orders GROUP BY "status";',
    );
  });

  it("emits SUM over a column with GROUP BY and ORDER BY in SQL clause order", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "sales",
        aggregate: { fn: "sum", column: "amount" },
        groupBy: ["region"],
        orderBy: [{ column: "region", direction: "ASC" }],
        filters: [{ column: "year", op: "eq", value: { literal: 2026 } }],
      }),
    );

    expect(body).toBe(
      'SELECT "region", SUM("amount") AS sum FROM sales WHERE year = {{ 2026 }} GROUP BY "region" ORDER BY "region" ASC;',
    );
  });

  it("emits AVG over a column", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "scores",
        aggregate: { fn: "avg", column: "points" },
      }),
    );

    expect(body).toBe('SELECT AVG("points") AS avg FROM scores;');
  });

  it("emits COUNT of a specific column", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "users",
        aggregate: { fn: "count", column: "id" },
      }),
    );

    expect(body).toBe('SELECT COUNT("id") AS count FROM users;');
  });

  it("throws when sum/avg omit the column", () => {
    for (const fn of ["sum", "avg"] as const) {
      expect(() =>
        compileQuery(
          parse({
            ...base,
            operation: "SELECT",
            table: "t",
            aggregate: { fn },
          }),
        ),
      ).toThrow(/requires a column/);
    }
  });
});

describe("querySpecSchema — ordering/aggregation reject injection", () => {
  const bad: [string, unknown][] = [
    [
      "quote in orderBy column",
      { orderBy: [{ column: 'a"', direction: "ASC" }] },
    ],
    [
      "brace in orderBy column",
      { orderBy: [{ column: "a}}", direction: "ASC" }] },
    ],
    [
      "bad direction (not an enum)",
      { orderBy: [{ column: "a", direction: "ASC; DROP" }] },
    ],
    ["quote in groupBy column", { groupBy: ['a"'] }],
    ["backtick in groupBy column", { groupBy: ["a`b"] }],
    ["unknown aggregate fn", { aggregate: { fn: "median", column: "a" } }],
    ["quote in aggregate column", { aggregate: { fn: "sum", column: 'a"' } }],
    [
      "backslash in aggregate column",
      { aggregate: { fn: "sum", column: "a\\b" } },
    ],
    // Parity with the chart/select negative sets: ']' and '$' must also be rejected.
    [
      "bracket in orderBy column",
      { orderBy: [{ column: "a]", direction: "ASC" }] },
    ],
    ["dollar in groupBy column", { groupBy: ["a$b"] }],
  ];

  it.each(bad)("rejects %s", (_label, override) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "users",
      ...(override as Record<string, unknown>),
    });

    expect(result.success).toBe(false);
  });

  // orderBy/aggregate/groupBy shape a SELECT only — reject them on other operations (clear agent feedback).
  it.each([
    [
      "orderBy on INSERT",
      "INSERT",
      { orderBy: [{ column: "a", direction: "ASC" }] },
    ],
    ["aggregate on DELETE", "DELETE", { aggregate: { fn: "count" } }],
    ["groupBy on UPDATE", "UPDATE", { groupBy: ["a"] }],
  ] as [string, string, Record<string, unknown>][])(
    "rejects %s",
    (_label, operation, override) => {
      const result = querySpecSchema.safeParse({
        ...base,
        operation,
        table: "users",
        ...override,
      });

      expect(result.success).toBe(false);
    },
  );
});

describe("buildActionDto", () => {
  it("embeds the datasource as { id } and forces prepared statements on", () => {
    const spec = parse({ ...base, operation: "SELECT", table: "users" });
    const dto = buildActionDto(spec, "SELECT * FROM users;") as {
      name: string;
      pageId: string;
      datasource: { id: string };
      actionConfiguration: {
        body: string;
        pluginSpecifiedTemplates: { value: boolean }[];
      };
    };

    expect(dto.name).toBe("getUsers");
    expect(dto.pageId).toBe("p1");
    expect(dto.datasource).toEqual({ id: "ds1" });
    expect(dto.actionConfiguration.body).toBe("SELECT * FROM users;");
    expect(dto.actionConfiguration.pluginSpecifiedTemplates[0].value).toBe(
      true,
    );
  });
});
