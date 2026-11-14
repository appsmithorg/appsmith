import {
  buildActionDto,
  storedSqlBody,
  compileQuery,
  markMcpAuthoredBody,
  mcpAuthoredBody,
  querySpecSchema,
  sqlDialectFor,
  withoutMcpMarker,
  type QuerySpec,
  type SqlDialect,
} from "./query.js";

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
      'SELECT id, name FROM users WHERE users.status = {{ "active" }} LIMIT 50;',
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
      "SELECT * FROM orders WHERE orders.id = {{ Table1.selectedRow.id }};",
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
      'UPDATE users SET name = {{ "Ada" }} WHERE users.id = {{ 1 }};',
    );
    expect(del).toBe("DELETE FROM users WHERE users.id = {{ 1 }};");
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
      'SELECT "region", SUM("amount") AS sum FROM sales WHERE sales.year = {{ 2026 }} GROUP BY "region" ORDER BY "region" ASC;',
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

// The exact SQL shapes pinned below are also executed against a real PostgreSQL (testcontainers) in
// app/server/appsmith-plugins/postgresPlugin/.../PostgresPluginTest.java (testFilterBar*). Change both together.
describe("APP-16164: filter-bar filters (skipWhenEmpty, inList)", () => {
  const statusFilter = {
    column: "status",
    op: "eq",
    value: { widget: "StatusSelect", property: "selectedOptionValue" },
    skipWhenEmpty: true,
  };
  const tagsFilter = {
    column: "tag",
    op: "inList",
    value: { widget: "TagsSelect", property: "selectedOptionValues" },
  };

  it("wraps a skipWhenEmpty filter in an empty guard and, on PostgreSQL, binds null while empty", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [statusFilter],
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT * FROM tickets WHERE ({{ (StatusSelect.selectedOptionValue == null || StatusSelect.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR "status" = {{ (StatusSelect.selectedOptionValue == null || StatusSelect.selectedOptionValue.length === 0) ? null : StatusSelect.selectedOptionValue }});',
    );
  });

  it("keeps the plain value binding for a skipWhenEmpty filter on other databases (no untyped NULL parameter)", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [statusFilter],
      }),
    );

    expect(body).toBe(
      "SELECT * FROM tickets WHERE ({{ (StatusSelect.selectedOptionValue == null || StatusSelect.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR tickets.status = {{ StatusSelect.selectedOptionValue }});",
    );
  });

  it("compiles inList on PostgreSQL to a text-cast ANY over one array parameter", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [tagsFilter],
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT * FROM tickets WHERE CAST("tag" AS TEXT) = ANY(CAST({{ (TagsSelect.selectedOptionValues == null || TagsSelect.selectedOptionValues.length === 0) ? null : TagsSelect.selectedOptionValues }} AS TEXT[]));',
    );
  });

  it("combines inList with skipWhenEmpty and ANDs it with other filters", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [{ ...tagsFilter, skipWhenEmpty: true }, statusFilter],
      }),
      { dialect: "postgres" },
    );

    expect(body).toMatch(
      /^SELECT \* FROM tickets WHERE \(\{\{ \(TagsSelect\.selectedOptionValues == null .* \? 1 : 0 \}\} = 1 OR CAST\("tag" AS TEXT\) = ANY\(.*\)\) AND \(\{\{ \(StatusSelect\.selectedOptionValue == null .* = 1 OR "status" = .*\);$/,
    );
  });

  it.each([undefined, "other" as const])(
    "refuses inList unless the datasource is PostgreSQL (dialect %s)",
    (dialect) => {
      const spec = parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [tagsFilter],
      });

      expect(() => compileQuery(spec, { dialect })).toThrow(
        /inList \(filter on tag\) is only available on a PostgreSQL datasource/,
      );
    },
  );

  it.each([
    [
      "inList with a literal",
      { column: "tag", op: "inList", value: { literal: "a" } },
      "inList needs a { widget, property } value",
    ],
    [
      "skipWhenEmpty with a literal",
      {
        column: "status",
        op: "eq",
        value: { literal: "open" },
        skipWhenEmpty: true,
      },
      "a literal is never empty",
    ],
    [
      "skipWhenEmpty on an appsmith.* value",
      {
        column: "owner",
        op: "eq",
        value: { widget: "appsmith", property: "user.email" },
        skipWhenEmpty: true,
      },
      "cannot be used on an appsmith.* value",
    ],
  ])("rejects %s at the schema", (_label, filter, message) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [filter],
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(message);
  });

  it.each(["UPDATE", "DELETE"])(
    "refuses skipWhenEmpty on %s (an empty widget would widen the write to every row)",
    (operation) => {
      const result = querySpecSchema.safeParse({
        ...base,
        operation,
        table: "tickets",
        values:
          operation === "UPDATE"
            ? [{ column: "status", value: { literal: "closed" } }]
            : undefined,
        filters: [statusFilter],
      });

      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain(
        "only valid on a SELECT query",
      );
    },
  );

  it("leaves a plain widget filter and the existing in operator unchanged", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "status",
            op: "eq",
            value: { widget: "StatusSelect", property: "selectedOptionValue" },
          },
          {
            column: "tier",
            op: "in",
            value: { widget: "TierSelect", property: "selectedOptionValue" },
          },
        ],
      }),
    );

    expect(body).toBe(
      "SELECT * FROM tickets WHERE tickets.status = {{ StatusSelect.selectedOptionValue }} AND tickets.tier IN ({{ TierSelect.selectedOptionValue }});",
    );
  });

  // The emitted guard and value expressions run in the end user's browser. These tests evaluate exactly what the
  // compiler wrote (the text inside {{ }}) against each kind of widget value, to pin down what "empty" means.
  it.each([
    [undefined, 1, null],
    [null, 1, null],
    ["", 1, null],
    [[], 1, null],
    ["open", 0, "open"],
    [["a", "b"], 0, ["a", "b"]],
    [0, 0, 0],
    [false, 0, false],
  ])(
    "treats widget value %p as empty=%p and binds %p (PostgreSQL)",
    (widgetValue, expectedGuard, expectedValue) => {
      const body = compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          filters: [statusFilter],
        }),
        { dialect: "postgres" },
      );
      const [guard, value] = [...body.matchAll(/\{\{ (.*?) \}\}/g)].map(
        (match) => match[1],
      );
      const evaluate = (expression: string) =>
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        new Function("StatusSelect", `return (${expression});`)({
          selectedOptionValue: widgetValue,
        });

      expect(evaluate(guard)).toBe(expectedGuard);
      expect(evaluate(value)).toEqual(expectedValue);
    },
  );
});

describe("APP-16324 F1: isNull and notNull filters", () => {
  it.each([
    ["isNull", "IS NULL"],
    ["notNull", "IS NOT NULL"],
  ])("compiles %s to %s with no bind parameter", (op, sql) => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [{ column: "l2owner", op }],
      }),
    );

    expect(body).toBe(`SELECT * FROM tickets WHERE tickets.l2owner ${sql};`);
  });

  // Oracle "Unassigned tickets": an open status and no L2 owner.
  it("ANDs an isNull filter with a value filter", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          { column: "status", op: "eq", value: { literal: "New" } },
          { column: "l2owner", op: "isNull" },
        ],
      }),
    );

    expect(body).toBe(
      'SELECT * FROM tickets WHERE tickets.status = {{ "New" }} AND tickets.l2owner IS NULL;',
    );
  });

  it.each([
    [undefined, "SELECT * FROM tickets WHERE tickets.closed_at IS NOT NULL;"],
    [
      "other" as const,
      "SELECT * FROM tickets WHERE tickets.closed_at IS NOT NULL;",
    ],
    [
      "postgres" as const,
      'SELECT * FROM tickets WHERE "closed_at" IS NOT NULL;',
    ],
  ])("compiles to IS NOT NULL on dialect %s", (dialect, sql) => {
    const spec = parse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [{ column: "closed_at", op: "notNull" }],
    });

    expect(compileQuery(spec, { dialect })).toBe(sql);
  });

  // The MySQL plugin refuses any prepared query with the word IS (MySqlPlugin.isIsOperatorUsed). The same SQL is
  // executed in MySqlPluginTest.testNullSafeEqualityWithPreparedStatement. Change both together.
  it.each([
    ["isNull", "SELECT * FROM tickets WHERE tickets.l2owner <=> NULL;"],
    ["notNull", "SELECT * FROM tickets WHERE NOT (tickets.l2owner <=> NULL);"],
  ])("compiles %s on MySQL without the IS keyword", (op, sql) => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [{ column: "l2owner", op }],
      }),
      { dialect: "mysql" },
    );

    expect(body).toBe(sql);
    expect(body).not.toMatch(/\bIS\b/i);
  });

  // A column named after a keyword must not compile to a predicate that is true for every row, such as a bare
  // `null IS NULL`. On a DELETE that would empty the table.
  // On PostgreSQL the column is quoted, not qualified: a missing `tickets.text` would read as the call text(tickets),
  // which is never NULL. A quoted name is always a column, and a missing one is an error.
  it.each([
    [undefined, "DELETE FROM tickets WHERE tickets.null IS NULL;"],
    ["mysql" as const, "DELETE FROM tickets WHERE tickets.null <=> NULL;"],
    ["postgres" as const, 'DELETE FROM tickets WHERE "null" IS NULL;'],
  ])(
    "never emits a keyword column bare on DELETE (dialect %s)",
    (dialect, sql) => {
      const body = compileQuery(
        parse({
          ...base,
          operation: "DELETE",
          table: "tickets",
          filters: [{ column: "null", op: "isNull" }],
        }),
        { dialect },
      );

      expect(body).toBe(sql);
    },
  );

  // A value filter's unquoted EMAIL names the column `email` on PostgreSQL. The null filters must name the same one.
  // A bare `current_user = {{ "app" }}` compares the database user, so it is true for every row when the value is
  // that user's name, and a DELETE would empty the table.
  it.each([
    ["postgres" as const, '"current_user"'],
    ["redshift" as const, '"current_user"'],
    ["mysql" as const, "users.current_user"],
    ["other" as const, "users.current_user"],
  ])("never emits a value filter's column bare on %s", (dialect, column) => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "DELETE",
        table: "users",
        filters: [
          { column: "current_user", op: "eq", value: { literal: "app" } },
        ],
      }),
      { dialect },
    );

    expect(body).toBe(`DELETE FROM users WHERE ${column} = {{ "app" }};`);
  });

  // CAST of the whole row to text can equal a list value, so inList refuses the name too, on a write as on a read.
  it("refuses inList on a column named like its table on PostgreSQL", () => {
    expect(() =>
      compileQuery(
        parse({
          ...base,
          operation: "DELETE",
          table: "users",
          filters: [
            {
              column: "users",
              op: "inList",
              value: { widget: "IdsSelect", property: "selectedOptionValues" },
            },
          ],
        }),
        { dialect: "postgres" },
      ),
    ).toThrow(/cannot test a column named like its table/);
  });

  // The PostgreSQL plugin binds text untyped, so a value compared with the whole row is read as a row literal.
  it.each([
    [
      "eq",
      { column: "users", op: "eq", value: { widget: "Id", property: "text" } },
    ],
    ["lt", { column: "users", op: "lt", value: { literal: "(,,)" } }],
    [
      "an anyOf member",
      {
        anyOf: [
          { column: "id", op: "eq", value: { literal: 1 } },
          { column: "users", op: "ne", value: { literal: "(0)" } },
        ],
      },
    ],
  ])(
    "refuses %s on a column named like its table on PostgreSQL",
    (_label, filter) => {
      expect(() =>
        compileQuery(
          parse({
            ...base,
            operation: "DELETE",
            table: "users",
            filters: [filter],
          }),
          { dialect: "postgres" },
        ),
      ).toThrow(/cannot test a column named like its table/);
    },
  );

  it("lower-cases the column before quoting it on PostgreSQL", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "UPDATE",
        table: "users",
        values: [{ column: "status", value: { literal: "inactive" } }],
        filters: [
          { column: "Email", op: "isNull" },
          { column: "ID", op: "gt", value: { literal: 3 } },
        ],
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'UPDATE users SET status = {{ "inactive" }} WHERE "email" IS NULL AND "id" > {{ 3 }};',
    );
  });

  // On PostgreSQL a quoted name equal to the table's, with no such column, is the whole row. `"tickets" IS NOT NULL`
  // is then true for every row whose fields are all set.
  it.each([
    ["tickets", "tickets"],
    ["support.tickets", "tickets"],
    ["Support.Tickets", "TICKETS"],
  ])(
    "refuses a null filter on a column named like the table %s on PostgreSQL",
    (table, column) => {
      const spec = parse({
        ...base,
        operation: "DELETE",
        table,
        filters: [{ column, op: "notNull" }],
      });

      expect(() => compileQuery(spec, { dialect: "postgres" })).toThrow(
        /cannot test a column named like its table/,
      );
    },
  );

  // PostgreSQL cuts names to 63 characters, so these two read as the same name there.
  it("refuses a column that matches the table only after PostgreSQL's 63-character cut", () => {
    const prefix = "a".repeat(63);
    const spec = parse({
      ...base,
      operation: "DELETE",
      table: `${prefix}x`,
      filters: [{ column: `${prefix}y`, op: "notNull" }],
    });

    expect(() => compileQuery(spec, { dialect: "postgres" })).toThrow(
      /cannot test a column named like its table/,
    );
  });

  // Redshift keeps names up to 127 characters, so it compares that many.
  it("allows names that differ after 63 characters on Redshift", () => {
    const prefix = "a".repeat(63);
    const body = compileQuery(
      parse({
        ...base,
        operation: "DELETE",
        table: `${prefix}x`,
        filters: [{ column: `${prefix}y`, op: "notNull" }],
      }),
      { dialect: "redshift" },
    );

    expect(body).toContain(`"${prefix}y" IS NOT NULL`);
  });

  it("refuses names that match only after Redshift's 127-character cut", () => {
    const prefix = "a".repeat(127);
    const spec = parse({
      ...base,
      operation: "DELETE",
      table: `${prefix}x`,
      filters: [{ column: `${prefix}y`, op: "notNull" }],
    });

    expect(() => compileQuery(spec, { dialect: "redshift" })).toThrow(
      /cannot test a column named like its table/,
    );
  });

  it("allows a long column that differs from the table within 63 characters", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: `${"a".repeat(62)}x`,
        filters: [{ column: `${"a".repeat(62)}y`, op: "isNull" }],
      }),
      { dialect: "postgres" },
    );

    expect(body).toContain(`"${"a".repeat(62)}y" IS NULL`);
  });

  // Elsewhere `tickets.tickets` is a column or an error, never the whole row, so it is allowed.
  it("allows a column named like the table on other databases", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [{ column: "tickets", op: "isNull" }],
      }),
      { dialect: "mysql" },
    );

    expect(body).toBe("SELECT * FROM tickets WHERE tickets.tickets <=> NULL;");
  });

  it("qualifies the column with a schema-qualified table", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "support.tickets",
        filters: [{ column: "current_user", op: "notNull" }],
      }),
    );

    expect(body).toBe(
      "SELECT * FROM support.tickets WHERE support.tickets.current_user IS NOT NULL;",
    );
  });

  it.each([
    ["postgres-plugin", "postgres"],
    ["mysql-plugin", "mysql"],
    ["mariadb-plugin", "mysql"],
    ["redshift-plugin", "redshift"],
    ["mssql-plugin", "other"],
    ["oracle-plugin", "oracle"],
    [undefined, "other"],
  ])("maps plugin %s to dialect %s", (packageName, dialect) => {
    expect(sqlDialectFor(packageName)).toBe(dialect);
  });

  // Oracle has no LIMIT, and a quoted lower-case name would not match a column created without quotes.
  it.each([
    [
      "INSERT",
      { values: [{ column: "status", value: { literal: "open" } }] },
      'INSERT INTO tickets (status) VALUES ({{ "open" }});',
    ],
    [
      "UPDATE",
      {
        values: [{ column: "status", value: { literal: "done" } }],
        filters: [{ column: "id", op: "eq", value: { literal: 7 } }],
      },
      'UPDATE tickets SET status = {{ "done" }} WHERE tickets.id = {{ 7 }};',
    ],
    [
      "DELETE",
      { filters: [{ column: "id", op: "eq", value: { literal: 7 } }] },
      "DELETE FROM tickets WHERE tickets.id = {{ 7 }};",
    ],
  ])(
    "compiles an Oracle %s with bound values and unquoted names",
    (operation, extra, expected) => {
      expect(
        compileQuery(
          parse({ ...base, operation, table: "tickets", ...extra }),
          { dialect: "oracle" },
        ),
      ).toBe(expected);
    },
  );

  it("compiles an Oracle SELECT with FETCH FIRST and bare identifiers", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [{ column: "status", op: "eq", value: { literal: "open" } }],
        groupBy: ["tag"],
        aggregate: { fn: "count", column: "id" },
        orderBy: [{ column: "tag", direction: "ASC" }],
        limit: 10,
      }),
      { dialect: "oracle" },
    );

    expect(body).toBe(
      'SELECT tag, COUNT(id) AS count FROM tickets WHERE tickets.status = {{ "open" }} GROUP BY tag ORDER BY tag ASC FETCH FIRST 10 ROWS ONLY;',
    );
  });

  // Redshift derives from PostgreSQL, so `tickets.text` could read as a function call. It gets the quoted bare form.
  it("uses the PostgreSQL null-filter form on Redshift", () => {
    const spec = parse({
      ...base,
      operation: "DELETE",
      table: "tickets",
      filters: [{ column: "Text", op: "notNull" }],
    });

    expect(compileQuery(spec, { dialect: "redshift" })).toBe(
      'DELETE FROM tickets WHERE "text" IS NOT NULL;',
    );
  });

  it("refuses a column named like its table on Redshift", () => {
    const spec = parse({
      ...base,
      operation: "DELETE",
      table: "tickets",
      filters: [{ column: "tickets", op: "isNull" }],
    });

    expect(() => compileQuery(spec, { dialect: "redshift" })).toThrow(
      /on PostgreSQL or Redshift/,
    );
  });

  // Only the null filters change on Redshift. A value filter on an empty widget still binds as on "other".
  it("quotes value filter columns on Redshift, as it does for isNull", () => {
    const spec = parse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          column: "status",
          op: "eq",
          value: { widget: "StatusSelect", property: "selectedOptionValue" },
          skipWhenEmpty: true,
        },
      ],
    });

    expect(compileQuery(spec, { dialect: "redshift" })).toBe(
      'SELECT * FROM tickets WHERE ({{ (StatusSelect.selectedOptionValue == null || StatusSelect.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR "status" = {{ StatusSelect.selectedOptionValue }});',
    );
  });

  // MySQL and Redshift keep inList refused: they cannot bind a list as one parameter.
  it.each(["mysql" as const, "redshift" as const])(
    "still refuses inList on %s",
    (dialect) => {
      const spec = parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "tag",
            op: "inList",
            value: { widget: "TagsSelect", property: "selectedOptionValues" },
          },
        ],
      });

      expect(() => compileQuery(spec, { dialect })).toThrow(
        /only available on a PostgreSQL datasource/,
      );
    },
  );

  it("is allowed on a write, where it narrows the rows", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "UPDATE",
        table: "tickets",
        values: [{ column: "status", value: { literal: "Pending on L2" } }],
        filters: [
          { column: "id", op: "eq", value: { literal: 7 } },
          { column: "l2owner", op: "isNull" },
        ],
      }),
    );

    expect(body).toBe(
      'UPDATE tickets SET status = {{ "Pending on L2" }} WHERE tickets.id = {{ 7 }} AND tickets.l2owner IS NULL;',
    );
  });

  it("compiles on DELETE", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "DELETE",
        table: "drafts",
        filters: [{ column: "submitted_at", op: "isNull" }],
      }),
    );

    expect(body).toBe("DELETE FROM drafts WHERE drafts.submitted_at IS NULL;");
  });

  // Agents often send optional fields with their "off" value. Neither changes what the filter does.
  it("accepts skipWhenEmpty: false and an explicit value: undefined", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          { column: "l2owner", op: "isNull", skipWhenEmpty: false },
          { column: "closed_at", op: "notNull", value: undefined },
        ],
      }),
    );

    expect(body).toBe(
      "SELECT * FROM tickets WHERE tickets.l2owner IS NULL AND tickets.closed_at IS NOT NULL;",
    );
  });

  it.each([
    [
      "isNull with a value",
      { column: "l2owner", op: "isNull", value: { literal: null } },
      "isNull takes no value",
    ],
    [
      "notNull with a widget value",
      {
        column: "l2owner",
        op: "notNull",
        value: { widget: "OwnerSelect", property: "selectedOptionValue" },
      },
      "notNull takes no value",
    ],
    [
      "isNull with skipWhenEmpty",
      { column: "l2owner", op: "isNull", skipWhenEmpty: true },
      "isNull takes no value",
    ],
    ["eq with no value", { column: "status", op: "eq" }, "eq needs a value"],
    [
      "eq with an explicit value: undefined",
      { column: "status", op: "eq", value: undefined },
      "eq needs a value",
    ],
    [
      "isNull on a column that is not an identifier",
      { column: "l2owner IS NULL OR 1=1 --", op: "isNull" },
      "must be a plain SQL identifier",
    ],
  ])("rejects %s at the schema", (_label, filter, message) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [filter],
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(message);
  });

  // A caller that skips parsing must still fail closed instead of emitting `col = undefined`.
  it("throws in the compiler when a value filter reaches it without a value", () => {
    const spec = {
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [{ column: "status", op: "eq" }],
    } as unknown as Parameters<typeof compileQuery>[0];

    expect(() => compileQuery(spec)).toThrow(/filter on status needs a value/);
  });
});

describe("APP-16324 F1.2: anyOf OR groups", () => {
  // Oracle "Unassigned tickets": an open status and no L2 owner (null or empty).
  it("compiles the Unassigned Tickets filter as two ANDed OR groups", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            anyOf: [
              { column: "status", op: "eq", value: { literal: "New" } },
              {
                column: "status",
                op: "eq",
                value: { literal: "Pending on L2" },
              },
              {
                column: "status",
                op: "eq",
                value: { literal: "Pending on L1" },
              },
            ],
          },
          {
            anyOf: [
              { column: "l2owner", op: "isNull" },
              { column: "l2owner", op: "eq", value: { literal: "" } },
            ],
          },
        ],
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT * FROM tickets WHERE ("status" = {{ "New" }} OR "status" = {{ "Pending on L2" }} OR "status" = {{ "Pending on L1" }}) AND ("l2owner" IS NULL OR "l2owner" = {{ "" }});',
    );
  });

  it("ANDs a group with plain filters, in order", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          { column: "archived", op: "eq", value: { literal: false } },
          {
            anyOf: [
              {
                column: "org_id",
                op: "eq",
                value: { widget: "Customers", property: "selectedRow.org_id" },
              },
              {
                column: "requester_email",
                op: "eq",
                value: { widget: "Customers", property: "selectedRow.email" },
              },
            ],
          },
        ],
      }),
    );

    expect(body).toBe(
      "SELECT * FROM tickets WHERE tickets.archived = {{ false }} AND (tickets.org_id = {{ Customers.selectedRow.org_id }} OR tickets.requester_email = {{ Customers.selectedRow.email }});",
    );
  });

  it("allows a group on a write, where it narrows with the other filters", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "UPDATE",
        table: "tickets",
        values: [{ column: "status", value: { literal: "Closed" } }],
        filters: [
          { column: "id", op: "gt", value: { literal: 0 } },
          {
            anyOf: [
              { column: "status", op: "eq", value: { literal: "Solved" } },
              { column: "status", op: "eq", value: { literal: "Spam" } },
            ],
          },
        ],
      }),
    );

    expect(body).toBe(
      'UPDATE tickets SET status = {{ "Closed" }} WHERE tickets.id > {{ 0 }} AND (tickets.status = {{ "Solved" }} OR tickets.status = {{ "Spam" }});',
    );
  });

  it("keeps a value that looks like SQL as a bind parameter inside a group", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            anyOf: [
              {
                column: "subject",
                op: "eq",
                value: { literal: "x' OR '1'='1" },
              },
              { column: "subject", op: "eq", value: { literal: "a -- b %" } },
            ],
          },
        ],
      }),
    );

    expect(body).toBe(
      `SELECT * FROM tickets WHERE (tickets.subject = {{ "x' OR '1'='1" }} OR tickets.subject = {{ "a -- b %" }});`,
    );
  });

  it.each([
    [
      "a nested group",
      {
        anyOf: [
          { column: "a", op: "eq", value: { literal: 1 } },
          {
            anyOf: [
              { column: "b", op: "eq", value: { literal: 2 } },
              { column: "c", op: "eq", value: { literal: 3 } },
            ],
          },
        ],
      },
    ],
    [
      "a group with one member",
      { anyOf: [{ column: "a", op: "eq", value: { literal: 1 } }] },
    ],
    ["an empty group", { anyOf: [] }],
    [
      "a group with more than 10 members",
      {
        anyOf: Array.from({ length: 11 }, (_, i) => ({
          column: "a",
          op: "eq",
          value: { literal: i },
        })),
      },
    ],
    [
      "a group with an extra key",
      {
        anyOf: [
          { column: "a", op: "eq", value: { literal: 1 } },
          { column: "b", op: "eq", value: { literal: 2 } },
        ],
        op: "eq",
      },
    ],
    [
      "a member column that is not an identifier",
      {
        anyOf: [
          { column: "a OR 1=1", op: "eq", value: { literal: 1 } },
          { column: "b", op: "eq", value: { literal: 2 } },
        ],
      },
    ],
  ])("rejects %s", (_label, entry) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [entry],
    });

    expect(result.success).toBe(false);
  });

  it("accepts a group at the 10-member maximum", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            anyOf: Array.from({ length: 10 }, (_, i) => ({
              column: "priority",
              op: "eq",
              value: { literal: i },
            })),
          },
        ],
      }),
    );

    expect(body.match(/ OR /g)).toHaveLength(9);
  });

  it("compiles a group on DELETE", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "DELETE",
        table: "drafts",
        filters: [
          {
            anyOf: [
              { column: "submitted_at", op: "isNull" },
              { column: "status", op: "eq", value: { literal: "abandoned" } },
            ],
          },
        ],
      }),
    );

    expect(body).toBe(
      'DELETE FROM drafts WHERE (drafts.submitted_at IS NULL OR drafts.status = {{ "abandoned" }});',
    );
  });

  // Members use each database's own form, so MySQL gets `<=>` inside a group too.
  it("compiles a null member inside a group on MySQL without IS", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            anyOf: [
              { column: "l2owner", op: "isNull" },
              { column: "l2owner", op: "eq", value: { literal: "" } },
            ],
          },
        ],
      }),
      { dialect: "mysql" },
    );

    expect(body).toBe(
      'SELECT * FROM tickets WHERE (tickets.l2owner <=> NULL OR tickets.l2owner = {{ "" }});',
    );
    expect(body).not.toMatch(/\bIS\b/);
  });

  // A malformed entry must come back as a validation issue on a write, not throw out of the write-path refinement.
  it.each([
    ["null", null],
    ["a number", 5],
    ["a string", "x"],
    ["anyOf as a string", { anyOf: "x" }],
    ["anyOf as null", { anyOf: null }],
    ["anyOf as undefined", { anyOf: undefined }],
  ])(
    "returns a validation issue, not a throw, for %s on DELETE",
    (_label, entry) => {
      let result: ReturnType<typeof querySpecSchema.safeParse> | undefined;

      expect(() => {
        result = querySpecSchema.safeParse({
          ...base,
          operation: "DELETE",
          table: "tickets",
          filters: [entry],
        });
      }).not.toThrow();
      expect(result?.success).toBe(false);
    },
  );

  it("reports a skipped group member at its own path", () => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          anyOf: [
            { column: "owner", op: "isNull" },
            {
              column: "status",
              op: "eq",
              value: { widget: "S", property: "selectedOptionValue" },
              skipWhenEmpty: true,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([
      "filters",
      0,
      "anyOf",
      1,
      "skipWhenEmpty",
    ]);
  });

  // In an OR, a skipped member would compile to TRUE and make the whole group TRUE, so one empty control would match
  // every row. Groups refuse skipWhenEmpty on every operation.
  it.each(["SELECT", "UPDATE", "DELETE"])(
    "refuses skipWhenEmpty inside a group on %s",
    (operation) => {
      const result = querySpecSchema.safeParse({
        ...base,
        operation,
        table: "tickets",
        values:
          operation === "UPDATE"
            ? [{ column: "status", value: { literal: "closed" } }]
            : undefined,
        filters: [
          {
            anyOf: [
              {
                column: "status",
                op: "eq",
                value: {
                  widget: "StatusSelect",
                  property: "selectedOptionValue",
                },
                skipWhenEmpty: true,
              },
              { column: "owner", op: "isNull" },
            ],
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain(
        "skipWhenEmpty cannot be used inside anyOf",
      );
    },
  );

  // A caller that skips parsing must still fail closed instead of emitting the always-true guard inside an OR.
  it("throws in the compiler when a group member has skipWhenEmpty", () => {
    const spec = {
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          anyOf: [
            {
              column: "status",
              op: "eq",
              value: { widget: "S", property: "selectedOptionValue" },
              skipWhenEmpty: true,
            },
            { column: "owner", op: "isNull" },
          ],
        },
      ],
    } as unknown as Parameters<typeof compileQuery>[0];

    expect(() => compileQuery(spec)).toThrow(
      /skipWhenEmpty cannot be used inside anyOf/,
    );
  });

  it("applies the member rules inside a group (inList stays PostgreSQL-only)", () => {
    const spec = parse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          anyOf: [
            {
              column: "tag",
              op: "inList",
              value: { widget: "TagsSelect", property: "selectedOptionValues" },
            },
            { column: "tag", op: "isNull" },
          ],
        },
      ],
    });

    expect(() => compileQuery(spec, { dialect: "mysql" })).toThrow(
      /only available on a PostgreSQL datasource/,
    );
  });
});

describe("APP-16324 F1.3: like match position and ilike", () => {
  it.each([
    ["contains", '{{ "%open%" }}'],
    ["prefix", '{{ "open%" }}'],
    ["suffix", '{{ "%open" }}'],
    ["exact", '{{ "open" }}'],
  ])("puts the %s wildcard in a literal's bound value", (match, binding) => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          { column: "subject", op: "like", match, value: { literal: "open" } },
        ],
      }),
    );

    expect(body).toBe(
      `SELECT * FROM tickets WHERE tickets.subject LIKE ${binding};`,
    );
  });

  it.each([
    ["contains", '{{ "%" + (SearchInput.text ?? "") + "%" }}'],
    ["prefix", '{{ (SearchInput.text ?? "") + "%" }}'],
    ["suffix", '{{ "%" + (SearchInput.text ?? "") }}'],
  ])(
    "builds the %s wildcard around a widget value at run time",
    (match, binding) => {
      const body = compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          filters: [
            {
              column: "subject",
              op: "like",
              match,
              value: { widget: "SearchInput", property: "text" },
            },
          ],
        }),
      );

      expect(body).toBe(
        `SELECT * FROM tickets WHERE tickets.subject LIKE ${binding};`,
      );
    },
  );

  // The emitted template runs in the end user's browser. Evaluate exactly what the compiler wrote.
  it.each([
    ["abc", "%abc%"],
    ["", "%%"],
    [undefined, "%%"],
    [null, "%%"],
  ])("binds widget text %p as %p for contains", (text, expected) => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "subject",
            op: "like",
            match: "contains",
            value: { widget: "SearchInput", property: "text" },
          },
        ],
      }),
    );
    const expression = /\{\{ (.*) \}\}/.exec(body)?.[1] ?? "";
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const value = new Function("SearchInput", `return (${expression});`)({
      text,
    });

    expect(value).toBe(expected);
  });

  it("keeps the exact (no match) behaviour unchanged", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "subject",
            op: "like",
            value: { widget: "SearchInput", property: "text" },
          },
        ],
      }),
    );

    expect(body).toBe(
      "SELECT * FROM tickets WHERE tickets.subject LIKE {{ SearchInput.text }};",
    );
  });

  it("keeps quotes, % and -- in the value as part of the bound parameter", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "subject",
            op: "like",
            match: "contains",
            value: { literal: "it's 50% -- off" },
          },
        ],
      }),
    );

    expect(body).toBe(
      `SELECT * FROM tickets WHERE tickets.subject LIKE {{ "%it's 50% -- off%" }};`,
    );
  });

  // Oracle "Customer tickets": org_id = $1 OR requester_email ILIKE '%' || $2 (a suffix match).
  it("compiles the Customer Tickets filter with ilike on PostgreSQL", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            anyOf: [
              {
                column: "org_id",
                op: "eq",
                value: { widget: "Customers", property: "selectedRow.org_id" },
              },
              {
                column: "requester_email",
                op: "ilike",
                match: "suffix",
                value: { widget: "Customers", property: "selectedRow.domain" },
              },
            ],
          },
        ],
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT * FROM tickets WHERE ("org_id" = {{ Customers.selectedRow.org_id }} OR "requester_email" ILIKE {{ "%" + (Customers.selectedRow.domain ?? "") }});',
    );
  });

  // Redshift has ILIKE, but its plugin does not use prepared statements, so the bound pattern would not be a parameter.
  it.each([undefined, "mysql" as const, "other" as const, "redshift" as const])(
    "refuses ilike unless the datasource is PostgreSQL (dialect %s)",
    (dialect) => {
      const spec = parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          { column: "subject", op: "ilike", value: { literal: "open" } },
        ],
      });

      expect(() => compileQuery(spec, { dialect })).toThrow(
        /ilike \(filter on subject\) is only available on a PostgreSQL datasource/,
      );
    },
  );

  it.each([
    ["prefix", "abc%"],
    ["suffix", "%abc"],
  ])("binds widget text as the %s pattern at run time", (match, expected) => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "subject",
            op: "like",
            match,
            value: { widget: "SearchInput", property: "text" },
          },
        ],
      }),
    );
    const expression = /\{\{ (.*) \}\}/.exec(body)?.[1] ?? "";
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const value = new Function("SearchInput", `return (${expression});`)({
      text: "abc",
    });

    expect(value).toBe(expected);
  });

  it("keeps a plain widget binding for match: exact", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "subject",
            op: "like",
            match: "exact",
            value: { widget: "SearchInput", property: "text" },
          },
        ],
      }),
    );

    expect(body).toBe(
      "SELECT * FROM tickets WHERE tickets.subject LIKE {{ SearchInput.text }};",
    );
  });

  it("compiles a wildcard member inside a group on a SELECT", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            anyOf: [
              {
                column: "subject",
                op: "like",
                match: "contains",
                value: { literal: "refund" },
              },
              { column: "tag", op: "eq", value: { literal: "billing" } },
            ],
          },
        ],
      }),
    );

    expect(body).toBe(
      'SELECT * FROM tickets WHERE (tickets.subject LIKE {{ "%refund%" }} OR tickets.tag = {{ "billing" }});',
    );
  });

  // A widget value in like is a pattern the end user writes, so typing "%" would widen the write to every row.
  it.each(["UPDATE", "DELETE"])(
    "refuses like with a widget value on %s, even without a wildcard match",
    (operation) => {
      const result = querySpecSchema.safeParse({
        ...base,
        operation,
        table: "tickets",
        values:
          operation === "UPDATE"
            ? [{ column: "status", value: { literal: "closed" } }]
            : undefined,
        filters: [
          {
            column: "subject",
            op: "like",
            value: { widget: "SearchInput", property: "text" },
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain(
        "like and ilike with a { widget, property } value are only valid on a SELECT query",
      );
    },
  );

  it.each([
    [
      "match on a non-like op",
      {
        column: "subject",
        op: "eq",
        match: "contains",
        value: { literal: "a" },
      },
      "match is only valid with like or ilike",
    ],
    [
      "an unknown match",
      {
        column: "subject",
        op: "like",
        match: "regex",
        value: { literal: "a" },
      },
      "Invalid enum value",
    ],
    [
      "match on isNull",
      { column: "owner", op: "isNull", match: "contains" },
      "match is only valid with like or ilike",
    ],
    [
      "a wildcard match on a number literal",
      { column: "id", op: "like", match: "prefix", value: { literal: 12 } },
      "needs a string literal",
    ],
  ])("rejects %s", (_label, filter, message) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      filters: [filter],
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(message);
  });

  // An empty search box compiles to "%%", which matches every row, so a wildcard match would widen a write.
  it.each(["UPDATE", "DELETE"])(
    "refuses a wildcard match on %s, including inside a group",
    (operation) => {
      for (const filters of [
        [
          {
            column: "subject",
            op: "like",
            match: "contains",
            value: { widget: "SearchInput", property: "text" },
          },
        ],
        [
          {
            anyOf: [
              {
                column: "subject",
                op: "ilike",
                match: "prefix",
                value: { literal: "x" },
              },
              { column: "id", op: "eq", value: { literal: 1 } },
            ],
          },
        ],
      ]) {
        const result = querySpecSchema.safeParse({
          ...base,
          operation,
          table: "tickets",
          values:
            operation === "UPDATE"
              ? [{ column: "status", value: { literal: "closed" } }]
              : undefined,
          filters,
        });

        expect(result.success).toBe(false);
        expect(JSON.stringify(result.error?.issues)).toContain(
          "a wildcard match is only valid on a SELECT query",
        );
      }
    },
  );

  it("allows match: exact on a write", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "DELETE",
        table: "tickets",
        filters: [
          {
            column: "subject",
            op: "like",
            match: "exact",
            value: { literal: "spam" },
          },
        ],
      }),
    );

    expect(body).toBe(
      'DELETE FROM tickets WHERE tickets.subject LIKE {{ "spam" }};',
    );
  });

  it("combines a wildcard match with skipWhenEmpty on a SELECT", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "subject",
            op: "like",
            match: "contains",
            value: { widget: "SearchInput", property: "text" },
            skipWhenEmpty: true,
          },
        ],
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT * FROM tickets WHERE ({{ (SearchInput.text == null || SearchInput.text.length === 0) ? 1 : 0 }} = 1 OR "subject" LIKE {{ "%" + (SearchInput.text ?? "") + "%" }});',
    );
  });
});

describe("APP-16324 F1.4: coalesce on selected and grouped columns", () => {
  it("coalesces a selected column, keeping its name", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        columns: [
          "id",
          { column: "appsmith_version", coalesce: { literal: "Unknown" } },
        ],
      }),
    );

    expect(body).toBe(
      'SELECT id, COALESCE(appsmith_version, {{ "Unknown" }}) AS appsmith_version FROM tickets;',
    );
  });

  // Oracle "Tickets by version": tickets with no version count under "Unknown".
  it("coalesces a grouped column in an aggregated select", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: [
          { column: "appsmith_version", coalesce: { literal: "Unknown" } },
        ],
        aggregate: { fn: "count" },
        orderBy: [{ column: "appsmith_version", direction: "DESC" }],
      }),
    );

    expect(body).toBe(
      'SELECT COALESCE("appsmith_version", {{ "Unknown" }}) AS "appsmith_version", COUNT(*) AS count FROM tickets GROUP BY "appsmith_version" ORDER BY "appsmith_version" DESC;',
    );
  });

  // MySQL and MariaDB read "col" as a string literal unless ANSI_QUOTES is on, which would group and sort by a
  // constant. Backticks are refused in every body, so those identifiers are emitted bare there; other dialects keep
  // double quotes.
  it("emits grouped, aggregated and sorted columns bare on MySQL, never double-quoted", () => {
    const spec = parse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      groupBy: [
        "region",
        { column: "appsmith_version", coalesce: { literal: "Unknown" } },
      ],
      aggregate: { fn: "sum", column: "amount" },
      orderBy: [{ column: "region", direction: "ASC" }],
    });

    expect(compileQuery(spec, { dialect: "mysql" })).toBe(
      'SELECT region, COALESCE(appsmith_version, {{ "Unknown" }}) AS appsmith_version, SUM(amount) AS sum FROM tickets GROUP BY region, appsmith_version ORDER BY region ASC;',
    );
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          groupBy: ["region"],
          aggregate: { fn: "count", column: "id" },
        }),
        { dialect: "mysql" },
      ),
    ).toBe("SELECT region, COUNT(id) AS count FROM tickets GROUP BY region;");
    expect(compileQuery(spec, { dialect: "postgres" })).toBe(
      'SELECT "region", COALESCE("appsmith_version", {{ "Unknown" }}) AS "appsmith_version", SUM("amount") AS sum FROM tickets GROUP BY "region", "appsmith_version" ORDER BY "region" ASC;',
    );
  });

  it("mixes plain and coalesced group columns", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: ["region", { column: "tier", coalesce: { literal: 0 } }],
        aggregate: { fn: "sum", column: "amount" },
      }),
    );

    expect(body).toBe(
      'SELECT "region", COALESCE("tier", {{ 0 }}) AS "tier", SUM("amount") AS sum FROM tickets GROUP BY "region", "tier";',
    );
  });

  it("keeps a fallback that looks like SQL as a bound parameter", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        columns: [
          { column: "owner", coalesce: { literal: "x') OR 1=1 -- %" } },
        ],
      }),
    );

    expect(body).toBe(
      `SELECT COALESCE(owner, {{ "x') OR 1=1 -- %" }}) AS owner FROM tickets;`,
    );
  });

  it.each([
    [
      "a column that is not an identifier",
      { columns: [{ column: "a, b", coalesce: { literal: "x" } }] },
    ],
    [
      "a null fallback",
      { columns: [{ column: "a", coalesce: { literal: null } }] },
    ],
    [
      "a widget fallback",
      {
        columns: [
          { column: "a", coalesce: { widget: "Input1", property: "text" } },
        ],
      },
    ],
    [
      "template syntax in the fallback",
      { columns: [{ column: "a", coalesce: { literal: "{{evil()}}" } }] },
    ],
    [
      "an extra key",
      { columns: [{ column: "a", coalesce: { literal: "x" }, as: "b" }] },
    ],
    [
      "a grouped column that is not an identifier",
      {
        groupBy: [{ column: "a;b", coalesce: { literal: "x" } }],
        aggregate: { fn: "count" },
      },
    ],
  ])("rejects %s", (_label, override) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      ...(override as Record<string, unknown>),
    });

    expect(result.success).toBe(false);
  });

  it("refuses coalesce entries on a write", () => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "UPDATE",
      table: "tickets",
      values: [{ column: "status", value: { literal: "closed" } }],
      columns: [{ column: "owner", coalesce: { literal: "x" } }],
      filters: [{ column: "id", op: "eq", value: { literal: 1 } }],
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(
      "coalesce is only valid on a SELECT query",
    );
  });

  it("refuses a groupBy coalesce without an aggregate, instead of dropping it", () => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      groupBy: [{ column: "status", coalesce: { literal: "none" } }],
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(
      "coalesce on a groupBy column needs an aggregate",
    );
  });

  it("refuses a columns coalesce with an aggregate, instead of dropping it", () => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      columns: ["id", { column: "status", coalesce: { literal: "none" } }],
      groupBy: ["region"],
      aggregate: { fn: "count" },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "columns.1.coalesce",
    ]);
  });

  // JSON such as 1e999 parses to Infinity, which JSON.stringify emits as null: the literal would silently bind NULL.
  it.each([
    [
      "a coalesce fallback",
      { columns: [{ column: "a", coalesce: { literal: Infinity } }] },
    ],
    [
      "a filter value",
      { filters: [{ column: "a", op: "eq", value: { literal: -Infinity } }] },
    ],
    [
      "a NaN filter value",
      { filters: [{ column: "a", op: "gt", value: { literal: NaN } }] },
    ],
  ])("refuses a non-finite number as %s", (_case, extra) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      ...extra,
    });

    expect(result.success).toBe(false);
  });

  // The case that mattered most: an INSERT would have written NULL into the row.
  it("refuses a non-finite number as an INSERT value", () => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "INSERT",
      table: "tickets",
      values: [{ column: "a", value: { literal: Infinity } }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path.join(".")).toBe(
      "values.0.value.literal",
    );
  });

  it("combines a coalesce column with filters, ordering and a limit", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        columns: [
          "id",
          { column: "owner", coalesce: { literal: "unassigned" } },
        ],
        filters: [{ column: "status", op: "eq", value: { literal: "New" } }],
        orderBy: [{ column: "id", direction: "DESC" }],
        limit: 50,
      }),
    );

    expect(body).toBe(
      'SELECT id, COALESCE(owner, {{ "unassigned" }}) AS owner FROM tickets WHERE tickets.status = {{ "New" }} ORDER BY "id" DESC LIMIT 50;',
    );
  });

  // Plain columns on a write were always ignored, and still are.
  it("still ignores plain columns on a write", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "DELETE",
        table: "tickets",
        columns: ["id"],
        filters: [{ column: "id", op: "eq", value: { literal: 1 } }],
      }),
    );

    expect(body).toBe("DELETE FROM tickets WHERE tickets.id = {{ 1 }};");
  });

  it("leaves plain columns and plain groupBy unchanged", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: ["region"],
        aggregate: { fn: "count" },
      }),
    );

    expect(body).toBe(
      'SELECT "region", COUNT(*) AS count FROM tickets GROUP BY "region";',
    );
  });
});

describe("APP-16324 F1.5: having on aggregated selects", () => {
  it.each([
    ["eq", "="],
    ["ne", "!="],
    ["gt", ">"],
    ["gte", ">="],
    ["lt", "<"],
    ["lte", "<="],
  ])("emits having op %s as %s", (op, sql) => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [{ column: "count", op, value: { literal: 3 } }],
      }),
    );

    expect(body).toBe(
      `SELECT "tag", COUNT(*) AS count FROM tickets GROUP BY "tag" HAVING COUNT(*) ${sql} {{ 3 }};`,
    );
  });

  // MySQL names are bare and case-insensitive, so "COUNT" would collide with the count result there.
  it("refuses a group column named like the aggregate in any case", () => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      groupBy: ["COUNT"],
      aggregate: { fn: "count" },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "groupBy.0",
    ]);
  });

  it("refuses a null literal, which = NULL would never match", () => {
    for (const op of ["eq", "ne"]) {
      const result = querySpecSchema.safeParse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [{ column: "tag", op, value: { literal: null } }],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "having cannot compare with null: = NULL never matches",
      );
    }
  });

  it("filters on the aggregate by repeating its expression", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [{ column: "count", op: "gt", value: { literal: 5 } }],
        orderBy: [{ column: "count", direction: "DESC" }],
      }),
    );

    expect(body).toBe(
      'SELECT "tag", COUNT(*) AS count FROM tickets GROUP BY "tag" HAVING COUNT(*) > {{ 5 }} ORDER BY count DESC;',
    );
  });

  // Oracle "Tag counts": HAVING tag <> 'N/A'.
  it("filters on a group column", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [{ column: "tag", op: "ne", value: { literal: "N/A" } }],
      }),
    );

    expect(body).toBe(
      'SELECT "tag", COUNT(*) AS count FROM tickets GROUP BY "tag" HAVING "tag" != {{ "N/A" }};',
    );
  });

  // HAVING names group columns and the aggregate the way GROUP BY and the select list do, so on MySQL they are bare
  // too (a double-quoted name there is a string, which would compare a constant).
  it("emits HAVING columns and the aggregate bare on MySQL", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "orders",
        groupBy: ["region"],
        aggregate: { fn: "sum", column: "amount" },
        having: [
          { column: "sum", op: "gt", value: { literal: 100 } },
          { column: "region", op: "ne", value: { literal: "test" } },
        ],
      }),
      { dialect: "mysql" },
    );

    expect(body).toBe(
      'SELECT region, SUM(amount) AS sum FROM orders GROUP BY region HAVING SUM(amount) > {{ 100 }} AND region != {{ "test" }};',
    );
  });

  it("filters an avg over the whole table when there is no groupBy", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "orders",
        aggregate: { fn: "avg", column: "amount" },
        having: [{ column: "avg", op: "gt", value: { literal: 10.5 } }],
      }),
    );

    expect(body).toBe(
      'SELECT AVG("amount") AS avg FROM orders HAVING AVG("amount") > {{ 10.5 }};',
    );
  });

  // Each refusal checks its exact message and the path of the field the agent must fix.
  it.each([
    [
      "a column that is neither the aggregate nor a group column",
      {
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [{ column: "status", op: "eq", value: { literal: "x" } }],
      },
      'having can only test "count" or a groupBy column',
      ["having", 0, "column"],
    ],
    [
      "an aggregate name that does not match the aggregate",
      {
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [{ column: "sum", op: "gt", value: { literal: 1 } }],
      },
      'having can only test "count" or a groupBy column',
      ["having", 0, "column"],
    ],
    // HAVING would test the stored value, not the fallback the select list shows.
    [
      "a group column that has coalesce",
      {
        groupBy: [{ column: "tag", coalesce: { literal: "none" } }],
        aggregate: { fn: "count" },
        having: [{ column: "tag", op: "ne", value: { literal: "none" } }],
      },
      "having cannot test a groupBy column that has coalesce (it would test the stored value, not the fallback shown)",
      ["having", 0, "column"],
    ],
    [
      "a group column named like the aggregate's result",
      {
        groupBy: ["count"],
        aggregate: { fn: "count" },
      },
      'a groupBy column cannot be named "count", the name of the aggregate\'s result',
      ["groupBy", 0],
    ],
    [
      "skipWhenEmpty in having",
      {
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [
          {
            column: "count",
            op: "gt",
            value: { widget: "W", property: "text" },
            skipWhenEmpty: true,
          },
        ],
      },
      "Unrecognized key(s) in object: 'skipWhenEmpty'",
      ["having", 0],
    ],
  ])("refuses %s, at its own path", (_label, override, message, path) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      ...(override as Record<string, unknown>),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ message, path }),
    );
  });

  it("ANDs several having conditions and accepts a widget value", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "orders",
        groupBy: ["region"],
        aggregate: { fn: "sum", column: "amount" },
        having: [
          {
            column: "sum",
            op: "gte",
            value: { widget: "MinAmount", property: "text" },
          },
          { column: "region", op: "ne", value: { literal: "test" } },
        ],
      }),
    );

    expect(body).toBe(
      'SELECT "region", SUM("amount") AS sum FROM orders GROUP BY "region" HAVING SUM("amount") >= {{ MinAmount.text }} AND "region" != {{ "test" }};',
    );
  });

  // A group column named like the table groups by, or tests, the whole row on PostgreSQL and Redshift.
  it.each([
    ["postgres" as const, "a group column", { groupBy: ["tickets"] }],
    [
      "redshift" as const,
      "a mixed-case group column",
      { groupBy: ["Tickets"] },
    ],
    [
      "redshift" as const,
      "a having group column",
      {
        groupBy: ["tickets"],
        having: [{ column: "tickets", op: "ne", value: { literal: "x" } }],
      },
    ],
  ])("refuses on %s %s named like its table", (dialect, _label, extra) => {
    expect(() =>
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          aggregate: { fn: "count" },
          ...extra,
        }),
        { dialect },
      ),
    ).toThrow(/groupBy and having cannot use a column named like its table/);
  });

  // PostgreSQL keeps a quoted name's case, so "Tickets" names a column, never the row `tickets`.
  it("keeps a mixed-case group column on PostgreSQL", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          groupBy: ["Tickets"],
          aggregate: { fn: "count" },
        }),
        { dialect: "postgres" },
      ),
    ).toBe(
      'SELECT "Tickets", COUNT(*) AS count FROM tickets GROUP BY "Tickets";',
    );
  });

  it("keeps a group column named like its table on MySQL", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          groupBy: ["tickets"],
          aggregate: { fn: "count" },
        }),
        { dialect: "mysql" },
      ),
    ).toBe("SELECT tickets, COUNT(*) AS count FROM tickets GROUP BY tickets;");
  });

  it("puts HAVING between GROUP BY and ORDER BY, after WHERE", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [{ column: "status", op: "eq", value: { literal: "open" } }],
        groupBy: ["tag"],
        aggregate: { fn: "count", column: "id" },
        having: [{ column: "count", op: "lt", value: { literal: 100 } }],
        orderBy: [{ column: "tag", direction: "ASC" }],
        limit: 10,
      }),
    );

    expect(body).toBe(
      'SELECT "tag", COUNT("id") AS count FROM tickets WHERE tickets.status = {{ "open" }} GROUP BY "tag" HAVING COUNT("id") < {{ 100 }} ORDER BY "tag" ASC LIMIT 10;',
    );
  });

  it.each([
    [
      "having without an aggregate",
      {
        groupBy: ["tag"],
        having: [{ column: "tag", op: "ne", value: { literal: "x" } }],
      },
      "having needs an aggregate",
    ],
    [
      "an op outside the comparison set",
      {
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [{ column: "tag", op: "like", value: { literal: "x" } }],
      },
      "Invalid enum value",
    ],
    [
      "a column that is not an identifier",
      {
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: [{ column: "count) OR (1", op: "gt", value: { literal: 1 } }],
      },
      "must be a plain SQL identifier",
    ],
    [
      "more than 10 conditions",
      {
        groupBy: ["tag"],
        aggregate: { fn: "count" },
        having: Array.from({ length: 11 }, () => ({
          column: "count",
          op: "gt",
          value: { literal: 1 },
        })),
      },
      "too_big",
    ],
  ])("rejects %s", (_label, override, message) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      ...(override as Record<string, unknown>),
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(message);
  });

  it("refuses having on a write", () => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "DELETE",
      table: "tickets",
      filters: [{ column: "id", op: "eq", value: { literal: 1 } }],
      having: [{ column: "count", op: "gt", value: { literal: 1 } }],
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(
      "having is only valid on a SELECT query",
    );
  });
});

describe("APP-16324 F1.6: split a delimited column (PostgreSQL)", () => {
  // Oracle "Tag counts": split feature_tags on ",", count each tag, skip "N/A", most-used first.
  it("compiles the Tag Counts query with a lateral unnest", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: [{ column: "feature_tags", split: "," }],
        aggregate: { fn: "count" },
        having: [
          { column: "feature_tags", op: "ne", value: { literal: "N/A" } },
        ],
        orderBy: [{ column: "count", direction: "DESC" }],
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT TRIM(mcp_split.mcp_split_value) AS "feature_tags", COUNT(*) AS count FROM tickets CROSS JOIN LATERAL unnest(string_to_array("feature_tags", {{ "," }})) AS mcp_split(mcp_split_value) GROUP BY TRIM(mcp_split.mcp_split_value) HAVING TRIM(mcp_split.mcp_split_value) != {{ "N/A" }} ORDER BY count DESC;',
    );
  });

  // A WHERE filter on the split column tests the whole stored value; having tests each item.
  it("combines a split with a filter on the same column, having, orderBy and a limit", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [
          {
            column: "tags",
            op: "like",
            match: "contains",
            value: { literal: "a" },
          },
        ],
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
        having: [{ column: "count", op: "gt", value: { literal: 1 } }],
        orderBy: [{ column: "tags", direction: "DESC" }],
        limit: 5,
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT TRIM(mcp_split.mcp_split_value) AS "tags", COUNT(*) AS count FROM tickets CROSS JOIN LATERAL unnest(string_to_array("tags", {{ "," }})) AS mcp_split(mcp_split_value) WHERE "tags" LIKE {{ "%a%" }} GROUP BY TRIM(mcp_split.mcp_split_value) HAVING COUNT(*) > {{ 1 }} ORDER BY "tags" DESC LIMIT 5;',
    );
  });

  // The repeated-column refusal exists for split; a plain repeated group column stays accepted, as before F1.6.
  it("still accepts a plain group column listed twice without a split", () => {
    expect(
      querySpecSchema.safeParse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: ["region", "region"],
        aggregate: { fn: "count" },
      }).success,
    ).toBe(true);
  });

  it("keeps WHERE filters on the table's own columns, and other group columns", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        filters: [{ column: "status", op: "eq", value: { literal: "open" } }],
        groupBy: ["product", { column: "feature_tags", split: ";" }],
        aggregate: { fn: "count" },
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT "product", TRIM(mcp_split.mcp_split_value) AS "feature_tags", COUNT(*) AS count FROM tickets CROSS JOIN LATERAL unnest(string_to_array("feature_tags", {{ ";" }})) AS mcp_split(mcp_split_value) WHERE "status" = {{ "open" }} GROUP BY "product", TRIM(mcp_split.mcp_split_value);',
    );
  });

  it("keeps a separator that looks like SQL as a bound parameter", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: [{ column: "tags", split: "')--" }],
        aggregate: { fn: "count" },
      }),
      { dialect: "postgres" },
    );

    expect(body).toContain(`string_to_array("tags", {{ "')--" }})`);
  });

  it.each([undefined, "mysql" as const, "other" as const, "redshift" as const])(
    "refuses split unless the datasource is PostgreSQL (dialect %s)",
    (dialect) => {
      const spec = parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
      });

      expect(() => compileQuery(spec, { dialect })).toThrow(
        /split \(on tags\) is only available on a PostgreSQL datasource/,
      );
    },
  );

  it.each([
    [
      "split in columns",
      { columns: [{ column: "tags", split: "," }] },
      "split is only valid in groupBy",
      ["columns", 0, "split"],
    ],
    [
      "two split columns",
      {
        groupBy: [
          { column: "a", split: "," },
          { column: "b", split: "," },
        ],
        aggregate: { fn: "count" },
      },
      "only one groupBy column can use split",
      ["groupBy", 1, "split"],
    ],
    [
      "split without an aggregate",
      { groupBy: [{ column: "tags", split: "," }] },
      "split on a groupBy column needs an aggregate",
      ["groupBy", 0, "split"],
    ],
  ])("refuses %s, at its own path", (_label, override, message, path) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      ...(override as Record<string, unknown>),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ message, path }),
    );
  });

  // PostgreSQL resolves an ORDER BY name to the output column first, so this sorts by the trimmed item.
  it("orders by the split column's alias", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
        orderBy: [{ column: "tags", direction: "ASC" }],
      }),
      { dialect: "postgres" },
    );

    expect(body).toMatch(
      / GROUP BY TRIM\(mcp_split\.mcp_split_value\) ORDER BY "tags" ASC;$/,
    );
    expect(body).toContain('TRIM(mcp_split.mcp_split_value) AS "tags"');
  });

  it.each([
    [
      "the same column listed twice in groupBy",
      {
        groupBy: ["tags", { column: "tags", split: "," }],
        aggregate: { fn: "count" },
      },
      'groupBy lists "tags" more than once',
      ["groupBy", 1],
    ],
    [
      "split on a table named mcp_split",
      {
        table: "public.mcp_split",
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
      },
      "split cannot be used on a table named mcp_split",
      ["table"],
    ],
    [
      "a filter on the reserved item column",
      {
        filters: [
          { column: "mcp_split_value", op: "eq", value: { literal: "x" } },
        ],
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
      },
      "with split, a column cannot be named mcp_split_value (that name is reserved for the split source)",
      ["filters", 0, "column"],
    ],
    [
      "a group member on the reserved source name",
      {
        filters: [
          {
            anyOf: [
              { column: "mcp_split", op: "isNull" },
              { column: "status", op: "eq", value: { literal: "x" } },
            ],
          },
        ],
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
      },
      "with split, a column cannot be named mcp_split (that name is reserved for the split source)",
      ["filters", 0, "anyOf", 0, "column"],
    ],
    [
      "a plain group column on the reserved item name",
      {
        groupBy: ["mcp_split_value", { column: "tags", split: "," }],
        aggregate: { fn: "count" },
      },
      "with split, a column cannot be named mcp_split_value (that name is reserved for the split source)",
      ["groupBy", 0],
    ],
    [
      "the aggregate's column on the reserved source name",
      {
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count", column: "mcp_split" },
      },
      "with split, a column cannot be named mcp_split (that name is reserved for the split source)",
      ["aggregate", "column"],
    ],
    [
      "an orderBy column on the reserved item name",
      {
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
        orderBy: [{ column: "mcp_split_value", direction: "ASC" }],
      },
      "with split, a column cannot be named mcp_split_value (that name is reserved for the split source)",
      ["orderBy", 0, "column"],
    ],
    [
      "a having column on the reserved item name",
      {
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
        having: [
          { column: "mcp_split_value", op: "eq", value: { literal: "x" } },
        ],
      },
      "with split, a column cannot be named mcp_split_value (that name is reserved for the split source)",
      ["having", 0, "column"],
    ],
    [
      "a selected column on the reserved source name",
      {
        columns: ["mcp_split"],
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
      },
      "with split, a column cannot be named mcp_split (that name is reserved for the split source)",
      ["columns", 0],
    ],
    // WHERE columns are emitted unquoted and PostgreSQL lowercases them, so case is ignored.
    [
      "a mixed-case reserved name",
      {
        filters: [
          { column: "Mcp_Split_Value", op: "eq", value: { literal: "x" } },
        ],
        groupBy: [{ column: "tags", split: "," }],
        aggregate: { fn: "count" },
      },
      "with split, a column cannot be named Mcp_Split_Value (that name is reserved for the split source)",
      ["filters", 0, "column"],
    ],
  ])("refuses %s, at its own path", (_label, override, message, path) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      ...(override as Record<string, unknown>),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ message, path }),
    );
  });

  it.each([
    ["an empty separator", { column: "tags", split: "" }],
    [
      "a separator longer than 10 characters",
      { column: "tags", split: "x".repeat(11) },
    ],
    ["template syntax in the separator", { column: "tags", split: "{{a}}" }],
    [
      "split together with coalesce",
      { column: "tags", split: ",", coalesce: { literal: "x" } },
    ],
    ["a column that is not an identifier", { column: "tags,1", split: "," }],
  ])("rejects %s", (_label, entry) => {
    const result = querySpecSchema.safeParse({
      ...base,
      operation: "SELECT",
      table: "tickets",
      groupBy: [entry],
      aggregate: { fn: "count" },
    });

    expect(result.success).toBe(false);
  });
});

// Checks that a spec is refused with this exact message at this exact path. `.strict()` refuses an unknown key, so
// `success === false` alone would also pass before a field exists.
function expectIssue(
  spec: Record<string, unknown>,
  message: string,
  path: (string | number)[],
) {
  const result = querySpecSchema.safeParse({
    ...base,
    operation: "SELECT",
    table: "tickets",
    ...spec,
  });

  expect(result.success).toBe(false);
  expect(result.error?.issues).toContainEqual(
    expect.objectContaining({ message, path }),
  );
}

const dupName = (name: string) =>
  `the result name "${name}" is used more than once (names ignore case); give each aggregate and group key its own name`;

describe("APP-16495 A: aggregates (more than one aggregate)", () => {
  // Oracle "weekly resolution time": a week bucket plus 3 columns, the rounded mean of the absolute time, and a count.
  it("compiles the Oracle weekly shape on PostgreSQL", () => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "public.oracle_support_ticket",
        filters: [
          {
            column: "created_at",
            op: "gte",
            value: { widget: "StartDate", property: "selectedDate" },
          },
        ],
        groupBy: [
          { column: "created_at", bucket: "week", as: "week" },
          "status",
          "severity",
          "support_level",
        ],
        aggregates: [
          { fn: "avg", column: "resolution_time", abs: true, round: "floor" },
          { fn: "count" },
        ],
        orderBy: [{ column: "week", direction: "ASC" }],
      }),
      { dialect: "postgres" },
    );

    expect(body).toBe(
      'SELECT DATE_TRUNC(\'week\', "created_at") AS week, "status", "severity", "support_level", FLOOR(AVG(ABS("resolution_time"))) AS avg, COUNT(*) AS count FROM public.oracle_support_ticket WHERE "created_at" >= {{ StartDate.selectedDate }} GROUP BY DATE_TRUNC(\'week\', "created_at"), "status", "severity", "support_level" ORDER BY week ASC;',
    );
  });

  it.each([
    [
      "mysql" as const,
      "SELECT status, FLOOR(AVG(ABS(resolution_time))) AS avg, COUNT(*) AS tickets FROM tickets GROUP BY status ORDER BY tickets DESC LIMIT 10;",
    ],
    [
      "oracle" as const,
      "SELECT status, FLOOR(AVG(ABS(resolution_time))) AS avg, COUNT(*) AS tickets FROM tickets GROUP BY status ORDER BY tickets DESC FETCH FIRST 10 ROWS ONLY;",
    ],
  ])("emits result names bare and orders by one on %s", (dialect, expected) => {
    const body = compileQuery(
      parse({
        ...base,
        operation: "SELECT",
        table: "tickets",
        groupBy: ["status"],
        aggregates: [
          {
            fn: "avg",
            column: "resolution_time",
            abs: true,
            round: "floor",
          },
          { fn: "count", as: "tickets" },
        ],
        orderBy: [{ column: "tickets", direction: "DESC" }],
        limit: 10,
      }),
      { dialect },
    );

    expect(body).toBe(expected);
  });

  it.each([
    [
      { fn: "sum", column: "amount", round: "ceil" },
      'CEIL(SUM("amount")) AS sum',
    ],
    [
      { fn: "avg", column: "amount", round: "round", as: "avg_amount" },
      'ROUND(AVG("amount")) AS avg_amount',
    ],
    [{ fn: "min", column: "delta", abs: true }, 'MIN(ABS("delta")) AS min'],
    [{ fn: "max", column: "delta", abs: true }, 'MAX(ABS("delta")) AS max'],
    [{ fn: "min", column: "delta" }, 'MIN("delta") AS min'],
    [{ fn: "count", column: "id" }, 'COUNT("id") AS count'],
    [{ fn: "sum", column: "amount", abs: false }, 'SUM("amount") AS sum'],
  ])("compiles %j", (entry, item) => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "orders",
          aggregates: [entry],
        }),
        { dialect: "postgres" },
      ),
    ).toBe(`SELECT ${item} FROM orders;`);
  });

  // The single `aggregate` goes through the same emit path, so the two forms give the same SQL.
  it.each([
    [{ fn: "count" }],
    [{ fn: "count", column: "id" }],
    [{ fn: "sum", column: "amount" }],
    [{ fn: "avg", column: "amount" }],
  ])("gives aggregates [%j] the same SQL as the single aggregate", (entry) => {
    const spec = {
      ...base,
      operation: "SELECT",
      table: "orders",
      groupBy: ["region"],
    };

    expect(compileQuery(parse({ ...spec, aggregates: [entry] }))).toBe(
      compileQuery(parse({ ...spec, aggregate: entry })),
    );
  });

  it("still refuses min and max on the single aggregate", () => {
    for (const fn of ["min", "max"]) {
      const result = querySpecSchema.safeParse({
        ...base,
        operation: "SELECT",
        table: "orders",
        aggregate: { fn, column: "amount" },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["aggregate", "fn"]);
    }
  });

  it.each([
    [
      "aggregate and aggregates together",
      { aggregate: { fn: "count" }, aggregates: [{ fn: "count" }] },
      "use aggregate or aggregates, not both",
      ["aggregates"],
    ],
    [
      "two avg entries without as",
      {
        aggregates: [
          { fn: "avg", column: "a" },
          { fn: "avg", column: "b" },
        ],
      },
      dupName("avg"),
      ["aggregates", 1, "as"],
    ],
    [
      'as: "count" on sum next to a default count',
      {
        aggregates: [{ fn: "sum", column: "a", as: "count" }, { fn: "count" }],
      },
      dupName("count"),
      ["aggregates", 1, "as"],
    ],
    [
      "an as equal to a group column in another case",
      { groupBy: ["Status"], aggregates: [{ fn: "count", as: "status" }] },
      dupName("status"),
      ["aggregates", 0, "as"],
    ],
    [
      "0 entries",
      { aggregates: [] },
      "Array must contain at least 1 element(s)",
      ["aggregates"],
    ],
    [
      "7 entries",
      {
        aggregates: Array.from({ length: 7 }, (_, index) => ({
          fn: "count",
          as: `c${index}`,
        })),
      },
      "Array must contain at most 6 element(s)",
      ["aggregates"],
    ],
    [
      "abs on count",
      { aggregates: [{ fn: "count", column: "id", abs: true }] },
      "abs is not valid with count",
      ["aggregates", 0, "abs"],
    ],
    [
      "round on count",
      { aggregates: [{ fn: "count", round: "floor" }] },
      "round is only valid with sum or avg",
      ["aggregates", 0, "round"],
    ],
    [
      "round on min",
      { aggregates: [{ fn: "min", column: "a", round: "floor" }] },
      "round is only valid with sum or avg",
      ["aggregates", 0, "round"],
    ],
    [
      "round on max",
      { aggregates: [{ fn: "max", column: "a", round: "ceil" }] },
      "round is only valid with sum or avg",
      ["aggregates", 0, "round"],
    ],
    [
      "sum without a column",
      { aggregates: [{ fn: "sum" }] },
      "sum needs a column",
      ["aggregates", 0, "column"],
    ],
    [
      "the reserved word order as a result name",
      { aggregates: [{ fn: "count", as: "order" }] },
      '"order" is a reserved SQL word; pick another name',
      ["aggregates", 0, "as"],
    ],
    [
      "the reserved word user as a result name",
      { aggregates: [{ fn: "count", as: "user" }] },
      '"user" is a reserved SQL word; pick another name',
      ["aggregates", 0, "as"],
    ],
    [
      "the reserved word null as a result name",
      { aggregates: [{ fn: "count", as: "null" }] },
      '"null" is a reserved SQL word; pick another name',
      ["aggregates", 0, "as"],
    ],
    [
      "an upper-case result name",
      { aggregates: [{ fn: "count", as: "Total" }] },
      "must be a lower-case name: a letter, then letters, digits or _, up to 63 characters",
      ["aggregates", 0, "as"],
    ],
    [
      "the split source name as a result name",
      { aggregates: [{ fn: "count", as: "mcp_split" }] },
      '"mcp_split" is reserved for the split source; pick another name',
      ["aggregates", 0, "as"],
    ],
    [
      "the split item name as a result name",
      { aggregates: [{ fn: "count", as: "mcp_split_value" }] },
      '"mcp_split_value" is reserved for the split source; pick another name',
      ["aggregates", 0, "as"],
    ],
    [
      "an aggregate column on the reserved split item name",
      {
        groupBy: [{ column: "tags", split: "," }],
        aggregates: [{ fn: "sum", column: "mcp_split_value" }],
      },
      "with split, a column cannot be named mcp_split_value (that name is reserved for the split source)",
      ["aggregates", 0, "column"],
    ],
    [
      "an orderBy column that is not a result name",
      {
        groupBy: ["status"],
        aggregates: [{ fn: "count" }],
        orderBy: [{ column: "created_at", direction: "ASC" }],
      },
      'with aggregates or a bucket, orderBy can only name a result column ("status", "count")',
      ["orderBy", 0, "column"],
    ],
  ])("refuses %s, at its own path", (_label, override, message, path) => {
    expectIssue(override, message, path);
  });

  it("refuses an aggregate column named like its table on PostgreSQL", () => {
    expect(() =>
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          aggregates: [{ fn: "count", column: "tickets" }],
        }),
        { dialect: "postgres" },
      ),
    ).toThrow(/an aggregate cannot use a column named like its table/);
  });

  describe("having", () => {
    it("repeats the full aggregate expression", () => {
      expect(
        compileQuery(
          parse({
            ...base,
            operation: "SELECT",
            table: "tickets",
            groupBy: ["tag"],
            aggregates: [{ fn: "avg", column: "x", abs: true, round: "floor" }],
            having: [{ column: "avg", op: "gt", value: { literal: 5 } }],
          }),
        ),
      ).toBe(
        'SELECT "tag", FLOOR(AVG(ABS("x"))) AS avg FROM tickets GROUP BY "tag" HAVING FLOOR(AVG(ABS("x"))) > {{ 5 }};',
      );
    });

    it("picks the entry whose result name matches", () => {
      expect(
        compileQuery(
          parse({
            ...base,
            operation: "SELECT",
            table: "orders",
            groupBy: ["region"],
            aggregates: [
              { fn: "sum", column: "amount" },
              { fn: "count", as: "n" },
            ],
            having: [{ column: "n", op: "gte", value: { literal: 2 } }],
          }),
        ),
      ).toBe(
        'SELECT "region", SUM("amount") AS sum, COUNT(*) AS n FROM orders GROUP BY "region" HAVING COUNT(*) >= {{ 2 }};',
      );
    });

    it.each([
      [
        "a name that is neither a result nor a group column",
        {
          groupBy: ["region"],
          aggregates: [
            { fn: "sum", column: "amount" },
            { fn: "count", as: "n" },
          ],
          having: [{ column: "count", op: "gt", value: { literal: 1 } }],
        },
        'having can only test "sum", "n" or a groupBy column',
      ],
      [
        "a bucket's result name",
        {
          groupBy: [{ column: "created_at", bucket: "week", as: "week" }],
          aggregates: [{ fn: "count" }],
          having: [{ column: "week", op: "gt", value: { literal: "x" } }],
        },
        "having cannot test a bucket or its column (created_at); filter created_at in filters instead",
      ],
      [
        "a bucket's source column",
        {
          groupBy: [{ column: "created_at", bucket: "week", as: "week" }],
          aggregate: { fn: "count" },
          having: [{ column: "created_at", op: "gt", value: { literal: "x" } }],
        },
        "having cannot test a bucket or its column (created_at); filter created_at in filters instead",
      ],
    ])("refuses %s", (_label, override, message) => {
      expectIssue(override, message, ["having", 0, "column"]);
    });
  });
});

describe("APP-16495 B: date bucket group key", () => {
  const weekly = {
    ...base,
    operation: "SELECT",
    table: "tickets",
    groupBy: [{ column: "created_at", bucket: "week", as: "week" }],
    aggregates: [{ fn: "count" }],
  };

  it.each(["day", "week", "month", "quarter", "year"])(
    "emits DATE_TRUNC with the %s unit as fixed text",
    (bucket) => {
      expect(
        compileQuery(
          parse({
            ...weekly,
            groupBy: [{ column: "created_at", bucket, as: "period" }],
          }),
          { dialect: "postgres" },
        ),
      ).toBe(
        `SELECT DATE_TRUNC('${bucket}', "created_at") AS period, COUNT(*) AS count FROM tickets GROUP BY DATE_TRUNC('${bucket}', "created_at");`,
      );
    },
  );

  it("compiles on Redshift the same way", () => {
    expect(compileQuery(parse(weekly), { dialect: "redshift" })).toBe(
      "SELECT DATE_TRUNC('week', \"created_at\") AS week, COUNT(*) AS count FROM tickets GROUP BY DATE_TRUNC('week', \"created_at\");",
    );
  });

  it("works with the single aggregate", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          groupBy: [{ column: "created_at", bucket: "day", as: "day" }],
          aggregate: { fn: "count" },
          orderBy: [{ column: "day", direction: "DESC" }],
        }),
        { dialect: "postgres" },
      ),
    ).toBe(
      "SELECT DATE_TRUNC('day', \"created_at\") AS day, COUNT(*) AS count FROM tickets GROUP BY DATE_TRUNC('day', \"created_at\") ORDER BY day DESC;",
    );
  });

  it.each([undefined, "mysql" as const, "oracle" as const, "other" as const])(
    "refuses a bucket unless the datasource is PostgreSQL or Redshift (dialect %s)",
    (dialect) => {
      expect(() => compileQuery(parse(weekly), { dialect })).toThrow(
        /^bucket \(on created_at\) is only available on a PostgreSQL or Redshift datasource/,
      );
    },
  );

  it("refuses a bucket column named like its table on PostgreSQL", () => {
    expect(() =>
      compileQuery(
        parse({
          ...weekly,
          groupBy: [{ column: "tickets", bucket: "week", as: "week" }],
        }),
        { dialect: "postgres" },
      ),
    ).toThrow(/groupBy and having cannot use a column named like its table/);
  });

  const withSplit = {
    ...base,
    operation: "SELECT",
    table: "tickets",
    groupBy: [
      { column: "created_at", bucket: "month", as: "month" },
      { column: "tags", split: "," },
    ],
    aggregates: [{ fn: "count" }],
  };

  it("combines a bucket with a split on PostgreSQL", () => {
    expect(compileQuery(parse(withSplit), { dialect: "postgres" })).toBe(
      'SELECT DATE_TRUNC(\'month\', "created_at") AS month, TRIM(mcp_split.mcp_split_value) AS "tags", COUNT(*) AS count FROM tickets CROSS JOIN LATERAL unnest(string_to_array("tags", {{ "," }})) AS mcp_split(mcp_split_value) GROUP BY DATE_TRUNC(\'month\', "created_at"), TRIM(mcp_split.mcp_split_value);',
    );
  });

  it("still refuses the split on Redshift when a bucket is present", () => {
    expect(() =>
      compileQuery(parse(withSplit), { dialect: "redshift" }),
    ).toThrow(/split \(on tags\) is only available on a PostgreSQL datasource/);
  });

  it.each([
    [
      "a bucket without an aggregate",
      { groupBy: [{ column: "created_at", bucket: "week", as: "week" }] },
      "bucket on a groupBy column needs an aggregate",
      ["groupBy", 0, "bucket"],
    ],
    [
      "a bucket in columns",
      { columns: [{ column: "created_at", bucket: "week", as: "week" }] },
      "bucket is only valid in groupBy",
      ["columns", 0, "bucket"],
    ],
    [
      "a bucket without as",
      {
        groupBy: [{ column: "created_at", bucket: "week" }],
        aggregates: [{ fn: "count" }],
      },
      'bucket needs as, the name of its result column (such as "week")',
      ["groupBy", 0, "as"],
    ],
    [
      "a reserved bucket result name",
      {
        groupBy: [{ column: "created_at", bucket: "week", as: "date" }],
        aggregates: [{ fn: "count" }],
      },
      '"date" is a reserved SQL word; pick another name',
      ["groupBy", 0, "as"],
    ],
    [
      "a bucket result name equal to a group column",
      {
        groupBy: ["week", { column: "created_at", bucket: "week", as: "week" }],
        aggregate: { fn: "count" },
      },
      dupName("week"),
      ["groupBy", 1, "as"],
    ],
    [
      "a bucket result name equal to the single aggregate's",
      {
        groupBy: [{ column: "created_at", bucket: "week", as: "count" }],
        aggregate: { fn: "count" },
      },
      dupName("count"),
      ["aggregate"],
    ],
    [
      "an orderBy on the bucket's source column",
      {
        groupBy: [{ column: "created_at", bucket: "week", as: "week" }],
        aggregates: [{ fn: "count" }],
        orderBy: [{ column: "created_at", direction: "ASC" }],
      },
      'with aggregates or a bucket, orderBy can only name a result column ("week", "count")',
      ["orderBy", 0, "column"],
    ],
  ])("refuses %s, at its own path", (_label, override, message, path) => {
    expectIssue(override, message, path);
  });
});

describe("APP-16495 C: distinct", () => {
  it("compiles SELECT DISTINCT with an ORDER BY on a selected column", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "customers",
          distinct: true,
          columns: ["domain", "id"],
          orderBy: [{ column: "id", direction: "ASC" }],
        }),
        { dialect: "postgres" },
      ),
    ).toBe('SELECT DISTINCT domain, id FROM customers ORDER BY "id" ASC;');
  });

  it("allows a coalesce column, which keeps its name", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          distinct: true,
          columns: [{ column: "owner", coalesce: { literal: "none" } }, "id"],
          orderBy: [{ column: "owner", direction: "ASC" }],
        }),
      ),
    ).toBe(
      'SELECT DISTINCT COALESCE(owner, {{ "none" }}) AS owner, id FROM tickets ORDER BY "owner" ASC;',
    );
  });

  it("accepts distinct: false with no columns as a no-op", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          distinct: false,
        }),
      ),
    ).toBe("SELECT * FROM tickets;");
  });

  it.each([
    [
      "no columns",
      { distinct: true },
      "distinct needs a non-empty columns list",
    ],
    [
      "an empty columns list",
      { distinct: true, columns: [] },
      "distinct needs a non-empty columns list",
    ],
    [
      "an aggregate",
      { distinct: true, columns: ["a"], aggregate: { fn: "count" } },
      "distinct cannot be used with aggregate",
    ],
    [
      "aggregates",
      { distinct: true, columns: ["a"], aggregates: [{ fn: "count" }] },
      "distinct cannot be used with aggregates",
    ],
    [
      "groupBy",
      { distinct: true, columns: ["a"], groupBy: ["a"] },
      "distinct cannot be used with groupBy",
    ],
  ])("refuses distinct with %s", (_label, override, message) => {
    expectIssue(override, message, ["distinct"]);
  });

  it("refuses an orderBy column that is not in columns", () => {
    expectIssue(
      {
        distinct: true,
        columns: ["domain"],
        orderBy: [{ column: "id", direction: "ASC" }],
      },
      "with distinct, orderBy can only name a column in columns",
      ["orderBy", 0, "column"],
    );
  });
});

describe("APP-16495: write guard and fail-closed compiler", () => {
  const writes: [string, Record<string, unknown>][] = [
    ["INSERT", { values: [{ column: "a", value: { literal: 1 } }] }],
    [
      "UPDATE",
      {
        values: [{ column: "a", value: { literal: 1 } }],
        filters: [{ column: "id", op: "eq", value: { literal: 1 } }],
      },
    ],
    [
      "DELETE",
      { filters: [{ column: "id", op: "eq", value: { literal: 1 } }] },
    ],
  ];

  it.each(writes)(
    "refuses aggregates and distinct on %s",
    (operation, extra) => {
      for (const [field, value] of [
        ["aggregates", [{ fn: "count" }]],
        ["distinct", true],
      ] as const) {
        const result = querySpecSchema.safeParse({
          ...base,
          operation,
          table: "tickets",
          ...extra,
          [field]: value,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues).toContainEqual(
          expect.objectContaining({
            message: `${field} is only valid on a SELECT query`,
            path: [field],
          }),
        );
      }
    },
  );

  // A caller that skips parsing must not get SQL text from an unknown key or a bad result name.
  it.each([
    [
      "an unknown fn",
      { aggregates: [{ fn: "median", column: "x" }] },
      /^unknown aggregate fn "median"$/,
    ],
    [
      "an inherited fn name",
      { aggregates: [{ fn: "constructor", column: "x" }] },
      /^unknown aggregate fn "constructor"$/,
    ],
    [
      "an unknown round",
      { aggregates: [{ fn: "avg", column: "x", round: "trunc" }] },
      /^unknown round "trunc"$/,
    ],
    [
      "an unknown bucket",
      {
        groupBy: [{ column: "d", bucket: "decade", as: "d10" }],
        aggregates: [{ fn: "count" }],
      },
      /^unknown bucket "decade"$/,
    ],
    [
      "a result name with SQL in it",
      { aggregates: [{ fn: "count", as: "c FROM t; DROP TABLE t; --" }] },
      /^invalid result name/,
    ],
    [
      "a bucket with no result name",
      {
        groupBy: [{ column: "d", bucket: "week" }],
        aggregates: [{ fn: "count" }],
      },
      /^invalid result name/,
    ],
    [
      "abs on count",
      { aggregates: [{ fn: "count", abs: true }] },
      /^abs is not valid with count$/,
    ],
    [
      "round on min",
      { aggregates: [{ fn: "min", column: "x", round: "floor" }] },
      /^round is only valid with sum or avg$/,
    ],
    [
      "aggregate and aggregates together",
      { aggregate: { fn: "count" }, aggregates: [{ fn: "count" }] },
      /^use aggregate or aggregates, not both$/,
    ],
    [
      "distinct with an aggregate",
      { distinct: true, columns: ["a"], aggregates: [{ fn: "count" }] },
      /^distinct cannot be used with aggregate, aggregates or groupBy$/,
    ],
    [
      "distinct without columns",
      { distinct: true },
      /^distinct needs a non-empty columns list$/,
    ],
  ])("throws in the compiler on %s", (_label, extra, error) => {
    expect(() =>
      compileQuery(
        {
          ...base,
          operation: "SELECT",
          table: "t",
          ...extra,
        } as never,
        { dialect: "postgres" },
      ),
    ).toThrow(error);
  });
});

describe("APP-16495: council follow-ups", () => {
  // Bare MySQL and Oracle reserved words. As a bare alias, each would fail to parse at run time there.
  it.each(["key", "rank", "rowid", "level", "number", "size", "comment"])(
    "refuses the MySQL or Oracle reserved word %s as a result name",
    (name) => {
      expectIssue(
        { aggregates: [{ fn: "count", as: name }] },
        `"${name}" is a reserved SQL word; pick another name`,
        ["aggregates", 0, "as"],
      );
    },
  );

  it("refuses an Oracle reserved word as a bucket result name", () => {
    expectIssue(
      {
        groupBy: [{ column: "created_at", bucket: "day", as: "sysdate" }],
        aggregates: [{ fn: "count" }],
      },
      '"sysdate" is a reserved SQL word; pick another name',
      ["groupBy", 0, "as"],
    );
  });

  // SQL Server spells these CEILING and ROUND(x, n). "other" covers it, so ceil and round are refused there.
  it.each([
    ["ceil", undefined],
    ["ceil", "other" as const],
    ["round", undefined],
    ["round", "other" as const],
  ])("refuses round %s on dialect %s", (round, dialect) => {
    expect(() =>
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "orders",
          aggregates: [{ fn: "avg", column: "amount", round }],
        }),
        { dialect },
      ),
    ).toThrow(
      new RegExp(
        `^round "${round}" \\(on amount\\) is only available on a PostgreSQL, Redshift, MySQL or Oracle datasource`,
      ),
    );
  });

  it.each([
    ["postgres" as const, "ceil", 'CEIL(AVG("amount"))'],
    ["redshift" as const, "round", 'ROUND(AVG("amount"))'],
    ["mysql" as const, "ceil", "CEIL(AVG(amount))"],
    ["oracle" as const, "round", "ROUND(AVG(amount))"],
    ["other" as const, "floor", 'FLOOR(AVG("amount"))'],
    [undefined, "floor", 'FLOOR(AVG("amount"))'],
  ])("allows on dialect %s round %s", (dialect, round, expression) => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "orders",
          aggregates: [{ fn: "avg", column: "amount", round }],
        }),
        { dialect },
      ),
    ).toBe(`SELECT ${expression} AS avg FROM orders;`);
  });

  it("refuses a second case-insensitive duplicate: a group column WEEK and a bucket named week", () => {
    expectIssue(
      {
        groupBy: ["WEEK", { column: "created_at", bucket: "week", as: "week" }],
        aggregates: [{ fn: "count" }],
      },
      dupName("week"),
      ["groupBy", 1, "as"],
    );
  });

  // A caller that skips parsing must not get a quoted or bare name with SQL in it, or an operator that is not in the
  // closed map.
  it.each([
    [
      "an orderBy column",
      {
        columns: ["id"],
        orderBy: [{ column: 'id" DESC; DROP TABLE t; --', direction: "ASC" }],
      },
      "postgres" as const,
    ],
    [
      "a group column on MySQL, where names are bare",
      {
        groupBy: ["status FROM t; DROP TABLE t; --"],
        aggregates: [{ fn: "count" }],
      },
      "mysql" as const,
    ],
    [
      "an aggregate column on Oracle",
      { aggregates: [{ fn: "sum", column: "amount) FROM t; --" }] },
      "oracle" as const,
    ],
  ])("throws on an unsafe identifier in %s", (_label, extra, dialect) => {
    expect(() =>
      compileQuery(
        { ...base, operation: "SELECT", table: "t", ...extra } as never,
        { dialect },
      ),
    ).toThrow(/^unsafe identifier: /);
  });

  it("throws on a having op that is not in the closed map", () => {
    expect(() =>
      compileQuery(
        {
          ...base,
          operation: "SELECT",
          table: "t",
          aggregates: [{ fn: "count" }],
          having: [
            { column: "count", op: "constructor", value: { literal: 1 } },
          ],
        } as never,
        { dialect: "postgres" },
      ),
    ).toThrow(/^unknown having op "constructor"$/);
  });
});

describe("APP-16495: CodeRabbit follow-ups", () => {
  // Reserved as a bare name on MySQL, PostgreSQL, SQL Server or Snowflake. SQL Server and Snowflake are "other".
  it.each([
    "precision",
    "database",
    "returning",
    "ilike",
    "top",
    "percent",
    "qualify",
  ])("refuses the reserved word %s as a result name", (name) => {
    expectIssue(
      { aggregates: [{ fn: "count", as: name }] },
      `"${name}" is a reserved SQL word; pick another name`,
      ["aggregates", 0, "as"],
    );
  });

  // Snowflake folds the bare alias n to N, so a quoted "n" in ORDER BY would not find it. A bare reference folds the
  // same way as the alias on every database.
  it("orders by an aggregate result name bare on dialect other", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "sales",
          groupBy: ["region"],
          aggregates: [{ fn: "count", as: "n" }],
          orderBy: [{ column: "n", direction: "DESC" }],
        }),
        { dialect: "other" },
      ),
    ).toBe(
      'SELECT "region", COUNT(*) AS n FROM sales GROUP BY "region" ORDER BY n DESC;',
    );
  });

  it("orders by a bucket and an aggregate bare, and by a group column quoted", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          groupBy: [
            { column: "created_at", bucket: "week", as: "week" },
            "status",
          ],
          aggregates: [{ fn: "count" }],
          orderBy: [
            { column: "week", direction: "ASC" },
            { column: "status", direction: "ASC" },
            { column: "count", direction: "DESC" },
          ],
        }),
        { dialect: "postgres" },
      ),
    ).toBe(
      'SELECT DATE_TRUNC(\'week\', "created_at") AS week, "status", COUNT(*) AS count FROM tickets GROUP BY DATE_TRUNC(\'week\', "created_at"), "status" ORDER BY week ASC, "status" ASC, count DESC;',
    );
  });

  // A caller that skips parsing must not get an unsafe result name into ORDER BY through the bare path.
  it("throws on an unsafe result name that orderBy names, without parsing", () => {
    expect(() =>
      compileQuery(
        {
          ...base,
          operation: "SELECT",
          table: "t",
          aggregates: [{ fn: "count", as: "x; DROP TABLE t; --" }],
          orderBy: [{ column: "x; DROP TABLE t; --", direction: "ASC" }],
        } as never,
        { dialect: "other" },
      ),
    ).toThrow(/^invalid result name: /);
  });

  // The single aggregate names its result bare too. On Snowflake, a quoted "count" would miss the alias COUNT.
  it("orders by the single aggregate's result name bare on dialect other", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          groupBy: ["tag"],
          aggregate: { fn: "count" },
          orderBy: [{ column: "count", direction: "DESC" }],
        }),
        { dialect: "other" },
      ),
    ).toBe(
      'SELECT "tag", COUNT(*) AS count FROM tickets GROUP BY "tag" ORDER BY count DESC;',
    );
  });

  // Oracle needs a bare name to start with a letter, so a leading _ is refused on every database.
  it.each([
    [
      "an aggregate",
      { aggregates: [{ fn: "count", as: "_n" }] },
      ["aggregates", 0, "as"],
    ],
    [
      "a bucket",
      {
        groupBy: [{ column: "created_at", bucket: "day", as: "_day" }],
        aggregates: [{ fn: "count" }],
      },
      ["groupBy", 0, "as"],
    ],
  ])(
    "refuses a result name that starts with _ on %s",
    (_label, extra, path) => {
      expectIssue(
        extra,
        "must be a lower-case name: a letter, then letters, digits or _, up to 63 characters",
        path,
      );
    },
  );

  it("throws on a result name that starts with _, without parsing", () => {
    expect(() =>
      compileQuery(
        {
          ...base,
          operation: "SELECT",
          table: "t",
          aggregates: [{ fn: "count", as: "_n" }],
        } as never,
        { dialect: "oracle" },
      ),
    ).toThrow(/^invalid result name: "_n"$/);
  });

  // HAVING resolves an aggregate's result name first, so an aggregate named like a bucket's source column is allowed.
  it("allows having on an aggregate named like a bucket's source column", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          groupBy: [{ column: "created_at", bucket: "month", as: "month" }],
          aggregates: [{ fn: "max", column: "created_at", as: "created_at" }],
          having: [
            {
              column: "created_at",
              op: "gt",
              value: { literal: "2026-01-01" },
            },
          ],
        }),
        { dialect: "postgres" },
      ),
    ).toBe(
      'SELECT DATE_TRUNC(\'month\', "created_at") AS month, MAX("created_at") AS created_at FROM tickets GROUP BY DATE_TRUNC(\'month\', "created_at") HAVING MAX("created_at") > {{ "2026-01-01" }};',
    );
  });

  // An orderBy name that is not the aggregate's result stays quoted.
  it("keeps a group column quoted when the single aggregate is present", () => {
    expect(
      compileQuery(
        parse({
          ...base,
          operation: "SELECT",
          table: "tickets",
          groupBy: ["tag"],
          aggregate: { fn: "sum", column: "amount" },
          orderBy: [{ column: "tag", direction: "ASC" }],
        }),
        { dialect: "other" },
      ),
    ).toBe(
      'SELECT "tag", SUM("amount") AS sum FROM tickets GROUP BY "tag" ORDER BY "tag" ASC;',
    );
  });
});

// A caller that skips parsing must not get a bad table name into the SQL. Before this check, a missing table compiled
// to `FROM undefined`, and `t; DROP TABLE u` was written as is.
describe("APP-16506: the compiler checks the table name again", () => {
  const operations: [string, Record<string, unknown>][] = [
    ["SELECT", {}],
    ["INSERT", { values: [{ column: "a", value: { literal: 1 } }] }],
    ["UPDATE", { values: [{ column: "a", value: { literal: 1 } }] }],
    ["DELETE", {}],
  ];
  const badTables: [string, unknown][] = [
    ["a missing table", undefined],
    ["an empty table", ""],
    ["a non-string table", 42],
    ["a statement after the table", "t; DROP TABLE u"],
    ["an empty name part", "public..t"],
    ["a name that is too long", `s.${"t".repeat(256)}`],
  ];

  describe.each(operations)("%s", (operation, extra) => {
    it.each(badTables)("refuses %s", (_, table) => {
      const spec = {
        ...base,
        operation,
        table,
        ...extra,
      } as unknown as Parameters<typeof compileQuery>[0];

      for (const dialect of [undefined, "postgres", "mysql"] as const) {
        expect(() =>
          compileQuery(spec, dialect === undefined ? undefined : { dialect }),
        ).toThrow(new Error(`unsafe table name: ${JSON.stringify(table)}`));
      }
    });

    it("still compiles a schema-qualified table", () => {
      const body = compileQuery(
        parse({ ...base, operation, table: "public.tickets", ...extra }),
        { dialect: "postgres" },
      );

      expect(body).toContain("public.tickets");
    });
  });
});

// A caller that skips parsing must not get other text into the SQL through a column name or a literal. Before these
// checks, each case below compiled with the text written as is.
describe("APP-16506: names are re-checked when written", () => {
  const unsafe = "x OR 1=1 OR y";
  const compileUnparsed = (
    spec: Record<string, unknown>,
    dialect: "postgres" | "redshift" | "mysql" | "oracle" | "other",
  ) =>
    compileQuery(
      { ...base, table: "t", ...spec } as unknown as Parameters<
        typeof compileQuery
      >[0],
      { dialect },
    );
  const columnError = new Error(
    `unsafe column name: ${JSON.stringify(unsafe)}`,
  );

  it.each(["postgres", "redshift", "mysql", "oracle", "other"] as const)(
    "refuses an unsafe filter column on %s",
    (dialect) => {
      expect(() =>
        compileUnparsed(
          {
            operation: "DELETE",
            filters: [{ column: unsafe, op: "eq", value: { literal: 1 } }],
          },
          dialect,
        ),
      ).toThrow(columnError);
    },
  );

  it("refuses an unsafe column in the plain select list", () => {
    expect(() =>
      compileUnparsed(
        { operation: "SELECT", columns: ["a FROM secrets --"] },
        "postgres",
      ),
    ).toThrow(
      new Error(`unsafe column name: ${JSON.stringify("a FROM secrets --")}`),
    );
  });

  it("refuses an unsafe coalesce column in the plain select list", () => {
    expect(() =>
      compileUnparsed(
        {
          operation: "SELECT",
          columns: [{ column: unsafe, coalesce: { literal: 0 } }],
        },
        "mysql",
      ),
    ).toThrow(columnError);
  });

  it("refuses an unsafe split column", () => {
    expect(() =>
      compileUnparsed(
        {
          operation: "SELECT",
          groupBy: [{ column: 'a") ,1) x; --', split: "," }],
        },
        "postgres",
      ),
    ).toThrow(
      new Error(`unsafe column name: ${JSON.stringify('a") ,1) x; --')}`),
    );
  });

  it.each([
    ["INSERT", "a) VALUES (1); DROP TABLE t; --"],
    ["UPDATE", "a = 1, b"],
  ])("refuses an unsafe %s column", (operation, column) => {
    expect(() =>
      compileUnparsed(
        { operation, values: [{ column, value: { literal: 1 } }] },
        "postgres",
      ),
    ).toThrow(new Error(`unsafe column name: ${JSON.stringify(column)}`));
  });

  it.each([
    [
      "a filter value",
      { filters: [{ column: "a", op: "eq", value: { literal: "{{ x }}" } }] },
    ],
    [
      "a like value",
      {
        filters: [
          {
            column: "a",
            op: "like",
            value: { literal: "}}" },
            match: "contains",
          },
        ],
      },
    ],
    [
      "a coalesce fallback",
      { columns: [{ column: "a", coalesce: { literal: "{{ x" } }] },
    ],
  ])("refuses template braces in %s", (_, extra) => {
    expect(() =>
      compileUnparsed({ operation: "SELECT", ...extra }, "postgres"),
    ).toThrow(new Error("unsafe literal value"));
  });

  it("still compiles a literal with a single brace, escaped", () => {
    expect(
      compileUnparsed(
        {
          operation: "SELECT",
          filters: [{ column: "a", op: "eq", value: { literal: "{x}" } }],
        },
        "postgres",
      ),
    ).toBe('SELECT * FROM t WHERE "a" = {{ "\\u007bx\\u007d" }};');
  });
});

// Splits a body into text and `{{ }}` segments the way Appsmith does (getDynamicStringSegments in
// src/utils/DynamicBindingUtils.ts). It counts single braces and does not skip quoted text.
function appsmithSegments(text: string): string[] {
  const start = text.indexOf("{{");

  if (start === -1) return [text];

  const segments = start > 0 ? [text.slice(0, start)] : [];
  const rest = text.slice(start);
  let depth = 0;

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "{") depth++;

    if (rest[i] === "}") {
      depth--;

      if (rest[i - 1] === "}" && depth === 0) {
        segments.push(rest.slice(0, i + 1));

        const tail = rest.slice(i + 1);

        return tail ? [...segments, ...appsmithSegments(tail)] : segments;
      }
    }
  }

  return [text];
}

// A caller that skips parsing must not get other text into the SQL through a value, a direction, a limit, an operator
// or an over-long name. Single braces also arrive through parsed specs.
describe("APP-16506: emitted tokens are re-checked", () => {
  const compileUnparsed = (
    spec: Record<string, unknown>,
    dialect: "postgres" | "oracle" | "mysql" = "postgres",
  ) =>
    compileQuery(
      { ...base, table: "t", ...spec } as unknown as Parameters<
        typeof compileQuery
      >[0],
      { dialect },
    );

  it("keeps single braces in literals inside their own binding", () => {
    // Given a parsed spec with { in one literal and } in another
    const spec = parse({
      ...base,
      operation: "SELECT",
      table: "t",
      filters: [
        { column: "a", op: "eq", value: { literal: "{" } },
        { column: "b", op: "eq", value: { literal: "}" } },
      ],
    });

    // When it compiles
    const body = compileQuery(spec, { dialect: "mysql" });

    // Then each value is its own binding, and every brace left belongs to a binding
    expect(body).toBe(
      'SELECT * FROM t WHERE t.a = {{ "\\u007b" }} AND t.b = {{ "\\u007d" }};',
    );
    expect(appsmithSegments(body)).toEqual([
      "SELECT * FROM t WHERE t.a = ",
      '{{ "\\u007b" }}',
      " AND t.b = ",
      '{{ "\\u007d" }}',
      ";",
    ]);
    expect(
      appsmithSegments(body)
        .filter((segment) => !segment.startsWith("{{"))
        .join(""),
    ).not.toMatch(/[{}]/);
  });

  it.each([
    ["${", "${x}"],
    ["a backtick", "`x`"],
    ["U+2028", "a b"],
    ["U+2029", "a b"],
  ])("refuses %s in a string literal", (_, literal) => {
    expect(() =>
      compileUnparsed({
        operation: "SELECT",
        filters: [{ column: "a", op: "eq", value: { literal } }],
      }),
    ).toThrow(new Error("unsafe literal value"));
  });

  it("refuses an orderBy direction that is not ASC or DESC", () => {
    expect(() =>
      compileUnparsed({
        operation: "SELECT",
        orderBy: [{ column: "a", direction: "ASC; DROP TABLE t" }],
      }),
    ).toThrow(new Error('unknown orderBy direction "ASC; DROP TABLE t"'));
  });

  it.each([
    ["postgres", "1; DROP TABLE t"],
    ["postgres", 0],
    ["postgres", 1001],
    ["postgres", 1.5],
    ["oracle", "1 ROWS ONLY; DROP TABLE t; --"],
    ["oracle", 1001],
    ["oracle", -1],
  ] as const)("refuses a bad limit on %s: %p", (dialect, limit) => {
    expect(() =>
      compileUnparsed({ operation: "SELECT", limit }, dialect),
    ).toThrow(
      new Error(
        `limit must be an integer from 1 to 1000: ${JSON.stringify(limit)}`,
      ),
    );
  });

  it.each(["between", "constructor", "toString"])(
    "refuses the filter op %s",
    (op) => {
      expect(() =>
        compileUnparsed({
          operation: "DELETE",
          filters: [{ column: "a", op, value: { literal: 1 } }],
        }),
      ).toThrow(new Error(`unknown filter op ${JSON.stringify(op)}`));
    },
  );

  it.each([
    [
      "an orderBy column",
      { orderBy: [{ column: "a".repeat(129), direction: "ASC" }] },
    ],
    [
      "a group column",
      { aggregate: { fn: "count" }, groupBy: ["a".repeat(129)] },
    ],
    [
      "an aggregate column",
      { aggregate: { fn: "sum", column: "a".repeat(129) } },
    ],
  ])("refuses %s longer than 128 characters", (_, extra) => {
    expect(() =>
      compileUnparsed({ operation: "SELECT", ...extra }, "mysql"),
    ).toThrow(
      new Error(`unsafe identifier: ${JSON.stringify("a".repeat(129))}`),
    );
  });

  it("still compiles a 128-character column", () => {
    const name = "a".repeat(128);

    expect(
      compileUnparsed(
        {
          operation: "SELECT",
          orderBy: [{ column: name, direction: "ASC" }],
        },
        "mysql",
      ),
    ).toBe(`SELECT * FROM t ORDER BY ${name} ASC;`);
  });
});

describe("APP-16324 F9: marking MCP-authored SQL", () => {
  const body = 'SELECT id FROM tickets WHERE status = {{ "open" }};';

  it("prefixes the body with a hash marker and reads it back", () => {
    const stored = markMcpAuthoredBody(body);

    expect(stored).toMatch(
      /^-- appsmith-mcp:v1 sha256=[0-9a-f]{64} \(written by the Appsmith MCP server, editing it stops MCP clients from reading it\)\n/,
    );
    expect(stored.endsWith(body)).toBe(true);
    expect(mcpAuthoredBody(stored)).toBe(body);
  });

  // The MySQL plugin strips `--` comments and then reads the first word to decide whether the query returns rows.
  // The marker line must be plain ASCII with nothing a plugin scans for.
  it("writes the marker as one ASCII line comment with no ; ' \" ? or {{", () => {
    const markerLine = markMcpAuthoredBody(body).split("\n")[0];

    expect(markerLine.startsWith("-- ")).toBe(true);
    expect(/^[\x20-\x7e]*$/.test(markerLine)).toBe(true);
    expect(markerLine).not.toMatch(/[;'"?]|\{\{/);
  });

  it("treats a body whose line endings became CRLF as not MCP-authored", () => {
    expect(
      mcpAuthoredBody(markMcpAuthoredBody(body).replace(/\n/g, "\r\n")),
    ).toBeUndefined();
  });

  // The marker line keeps its \n, so only the hash can notice a line-ending change inside the body.
  it("treats a CRLF change inside a multi-line body as not MCP-authored", () => {
    const multiLine = 'SELECT *\nFROM tickets\nWHERE status = {{ "open" }};';
    const stored = markMcpAuthoredBody(multiLine);
    const [markerLine, ...rest] = stored.split("\n");

    expect(mcpAuthoredBody(stored)).toBe(multiLine);
    expect(
      mcpAuthoredBody(`${markerLine}\n${rest.join("\r\n")}`),
    ).toBeUndefined();
  });

  // The marker must be the first line: text above it (such as an added secret) means the body is not what the MCP
  // wrote, and it must stay hidden.
  it("treats text above a valid marker as not MCP-authored", () => {
    expect(
      mcpAuthoredBody(`-- api_key=xyz\n${markMcpAuthoredBody(body)}`),
    ).toBeUndefined();
  });

  it("strips only a leading marker line for classification, whatever its hash", () => {
    const stored = markMcpAuthoredBody(body);

    expect(withoutMcpMarker(stored)).toBe(body);
    expect(withoutMcpMarker(`${stored} edited`)).toBe(`${body} edited`);
    expect(withoutMcpMarker(body)).toBe(body);
    expect(withoutMcpMarker(`-- x\n${stored}`)).toBe(`-- x\n${stored}`);
  });

  it.each([
    ["an editor-written body (no marker)", body],
    ["an empty body", ""],
    ["a non-string body", 42],
    ["undefined", undefined],
  ])("treats %s as not MCP-authored", (_label, stored) => {
    expect(mcpAuthoredBody(stored)).toBeUndefined();
  });

  // An edit after the MCP wrote the query, such as an added secret, must hide the body again.
  it("treats a body edited after marking as not MCP-authored", () => {
    const stored = markMcpAuthoredBody(body);

    expect(
      mcpAuthoredBody(stored.replace("open", "open' -- api_key=xyz")),
    ).toBeUndefined();
    expect(
      mcpAuthoredBody(`${stored}\nSELECT secret FROM vault;`),
    ).toBeUndefined();
  });

  it("treats a marker with a wrong hash as not MCP-authored", () => {
    const stored = markMcpAuthoredBody(body).replace(
      /sha256=[0-9a-f]{64}/,
      `sha256=${"0".repeat(64)}`,
    );

    expect(mcpAuthoredBody(stored)).toBeUndefined();
  });
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

  // The Oracle plugin and its editor form read the query and the prepared-statement switch from formData.
  it("stores an Oracle query in formData with prepared statements on", () => {
    const spec = parse({ ...base, operation: "SELECT", table: "users" });
    const dto = buildActionDto(
      spec,
      "SELECT * FROM users;",
      "oracle-plugin",
    ) as { actionConfiguration: Record<string, unknown> };

    expect(dto.actionConfiguration).toEqual({
      formData: {
        body: { data: "SELECT * FROM users;" },
        preparedStatement: { data: true },
      },
    });
    expect(storedSqlBody(dto.actionConfiguration)).toBe("SELECT * FROM users;");
  });

  it("reads the stored body of any other SQL plugin from actionConfiguration.body", () => {
    expect(storedSqlBody({ body: "SELECT 1;" })).toBe("SELECT 1;");
    expect(storedSqlBody(undefined)).toBeUndefined();
  });
});

const DIALECTS = ["postgres", "redshift", "mysql", "oracle", "other"] as const;

const CATALOG_MESSAGE = (table: string) =>
  `${JSON.stringify(table)} is in a system catalog, which the MCP does not query (a best-effort guard; the datasource's credentials decide what can be read). To see a datasource's tables and columns, call get_datasource_structure`;

describe("APP-16506 A: system catalogs are refused", () => {
  it.each([
    "information_schema.tables",
    "PG_CATALOG.pg_class",
    "pg_toast.pg_toast_2619",
    "pg_temp_3.scratch",
    "mysql.user",
    "Performance_Schema.threads",
    "sys.objects",
    "master.sys.objects",
  ])("should_refuse_a_system_schema_when_table_is_%s", (table) => {
    // Given
    const spec = { ...base, operation: "SELECT", table };

    // When
    const result = querySpecSchema.safeParse(spec);

    // Then
    expect(result.success).toBe(false);
    expect(
      result.success
        ? []
        : result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
    ).toEqual([{ path: ["table"], message: CATALOG_MESSAGE(table) }]);
  });

  it.each([
    ["SELECT", {}],
    ["INSERT", { values: [{ column: "a", value: { literal: 1 } }] }],
    ["UPDATE", { values: [{ column: "a", value: { literal: 1 } }] }],
    ["DELETE", {}],
  ])(
    "should_throw_on_a_system_schema_when_an_unparsed_%s_reaches_the_compiler",
    (operation, extra) => {
      // Given
      const spec = {
        ...base,
        operation,
        table: "information_schema.columns",
        ...extra,
      } as unknown as QuerySpec;

      // When / Then
      for (const dialect of DIALECTS) {
        expect(() => compileQuery(spec, { dialect })).toThrow(
          new Error(CATALOG_MESSAGE("information_schema.columns")),
        );
      }
    },
  );

  it.each(["pg_user", "public.pg_stats", "PG_SHADOW", "pg_x.t"])(
    "should_refuse_%s_only_on_postgres_and_redshift",
    (table) => {
      // Given
      const spec = parse({ ...base, operation: "SELECT", table });

      // When / Then
      for (const dialect of ["postgres", "redshift"] as const) {
        expect(() => compileQuery(spec, { dialect })).toThrow(
          new Error(CATALOG_MESSAGE(table)),
        );
      }

      for (const dialect of ["mysql", "oracle", "other"] as const) {
        expect(compileQuery(spec, { dialect })).toBe(`SELECT * FROM ${table};`);
      }
    },
  );

  it.each([
    "stl_query",
    "public.stv_sessions",
    "SVV_TABLE_INFO",
    "pg_catalog_x.svl_qlog",
  ])("should_refuse_%s_only_on_redshift_and_postgres_pg_rules", (table) => {
    // Given
    const spec = parse({ ...base, operation: "SELECT", table });
    const refused = table
      .toLowerCase()
      .split(".")
      .some((part) => part.startsWith("pg_"))
      ? ["postgres", "redshift"]
      : ["redshift"];

    // When / Then
    for (const dialect of DIALECTS) {
      if (refused.includes(dialect)) {
        expect(() => compileQuery(spec, { dialect })).toThrow(
          new Error(CATALOG_MESSAGE(table)),
        );
      } else {
        expect(compileQuery(spec, { dialect })).toBe(`SELECT * FROM ${table};`);
      }
    }
  });

  it.each(["SYSTEM.help", "system.users", "Prod.System.t"])(
    "should_refuse_the_oracle_system_schema_only_on_oracle_when_table_is_%s",
    (table) => {
      // Given
      const spec = parse({ ...base, operation: "SELECT", table });

      // When / Then
      expect(() => compileQuery(spec, { dialect: "oracle" })).toThrow(
        new Error(CATALOG_MESSAGE(table)),
      );

      for (const dialect of [
        "postgres",
        "redshift",
        "mysql",
        "other",
      ] as const) {
        expect(compileQuery(spec, { dialect })).toBe(`SELECT * FROM ${table};`);
      }
    },
  );

  it("should_refuse_a_redshift_system_table_on_a_write_too", () => {
    // Given
    const spec = parse({
      ...base,
      operation: "DELETE",
      table: "stl_load_errors",
    });

    // When / Then
    expect(() => compileQuery(spec, { dialect: "redshift" })).toThrow(
      new Error(CATALOG_MESSAGE("stl_load_errors")),
    );
  });

  it.each(["public.pgsql_data", "sysadmin.users", "app.mysql_users", "sys"])(
    "should_accept_%s_because_it_is_not_a_system_catalog",
    (table) => {
      // Given
      const spec = parse({ ...base, operation: "SELECT", table });

      // When / Then
      for (const dialect of DIALECTS) {
        expect(compileQuery(spec, { dialect })).toBe(`SELECT * FROM ${table};`);
      }
    },
  );
});

// APP-16506 B: a SELECT over several tables (`from` and `joins`).
const ALIASED_MODE_MESSAGE =
  "from and joins need a PostgreSQL, MySQL, MariaDB, Oracle or SQL Server datasource that the server can identify. Redshift and Snowflake are not supported: their plugins put values into the SQL text instead of binding them";

const ALIASED_PACKAGES = [
  "postgres-plugin",
  "mysql-plugin",
  "mariadb-plugin",
  "oracle-plugin",
  "mssql-plugin",
] as const;

function compileFor(spec: unknown, packageName: string) {
  return compileQuery(parse(spec), {
    dialect: sqlDialectFor(packageName),
    packageName,
  });
}

function issuesOf(spec: unknown) {
  const result = querySpecSchema.safeParse(spec);

  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      }));
}

// Three tables: orders, the customer of each order, and its payments.
const threeTableJoin = {
  ...base,
  operation: "SELECT",
  from: { table: "public.orders", as: "o" },
  joins: [
    {
      type: "inner",
      table: "public.customers",
      as: "c",
      on: [{ left: "c.id", right: "o.customer_id" }],
    },
    {
      type: "left",
      table: "public.payments",
      as: "p",
      on: [{ left: "p.order_id", right: "o.id" }],
    },
  ],
  filters: [
    { column: "o.status", op: "eq", value: { literal: "paid" } },
    {
      anyOf: [
        { column: "p.refunded", op: "isNull" },
        { column: "p.refunded", op: "eq", value: { literal: false } },
      ],
    },
    {
      column: "c.region",
      op: "eq",
      value: { widget: "RegionSelect", property: "selectedOptionValue" },
    },
  ],
  groupBy: ["c.region", { column: "c.name", as: "customer" }],
  aggregates: [
    { fn: "count", as: "orders" },
    { fn: "sum", column: "p.amount", as: "paid_total" },
  ],
  having: [{ column: "orders", op: "gt", value: { literal: 1 } }],
  orderBy: [{ column: "paid_total", direction: "DESC" }],
  limit: 50,
};

const THREE_TABLE_POSTGRES =
  'SELECT c."region" AS region, c."name" AS customer, COUNT(*) AS orders, SUM(p."amount") AS paid_total FROM (SELECT "customer_id", "id", "status" FROM public.orders) o INNER JOIN (SELECT "id", "region", "name" FROM public.customers) c ON c."id" = o."customer_id" LEFT JOIN (SELECT "order_id", "refunded", "amount" FROM public.payments) p ON p."order_id" = o."id" WHERE o."status" = {{ "paid" }} AND (p."refunded" IS NULL OR p."refunded" = {{ false }}) AND c."region" = {{ RegionSelect.selectedOptionValue }} GROUP BY c."region", c."name" HAVING COUNT(*) > {{ 1 }} ORDER BY paid_total DESC LIMIT 50;';
const THREE_TABLE_MYSQL =
  'SELECT c.region AS region, c.name AS customer, COUNT(*) AS orders, SUM(p.amount) AS paid_total FROM public.orders o INNER JOIN public.customers c ON c.id = o.customer_id LEFT JOIN public.payments p ON p.order_id = o.id WHERE o.status = {{ "paid" }} AND (p.refunded <=> NULL OR p.refunded = {{ false }}) AND c.region = {{ RegionSelect.selectedOptionValue }} GROUP BY c.region, c.name HAVING COUNT(*) > {{ 1 }} ORDER BY paid_total DESC LIMIT 50;';
const THREE_TABLE_ORACLE =
  'SELECT c.region AS region, c.name AS customer, COUNT(*) AS orders, SUM(p.amount) AS paid_total FROM public.orders o INNER JOIN public.customers c ON c.id = o.customer_id LEFT JOIN public.payments p ON p.order_id = o.id WHERE o.status = {{ "paid" }} AND (p.refunded IS NULL OR p.refunded = {{ false }}) AND c.region = {{ RegionSelect.selectedOptionValue }} GROUP BY c.region, c.name HAVING COUNT(*) > {{ 1 }} ORDER BY paid_total DESC FETCH FIRST 50 ROWS ONLY;';
const THREE_TABLE_MSSQL =
  'SELECT TOP (50) c."region" AS region, c."name" AS customer, COUNT(*) AS orders, SUM(p."amount") AS paid_total FROM public.orders o INNER JOIN public.customers c ON c."id" = o."customer_id" LEFT JOIN public.payments p ON p."order_id" = o."id" WHERE o."status" = {{ "paid" }} AND (p."refunded" IS NULL OR p."refunded" = {{ false }}) AND c."region" = {{ RegionSelect.selectedOptionValue }} GROUP BY c."region", c."name" HAVING COUNT(*) > {{ 1 }} ORDER BY paid_total DESC;';

// A chain of joins: each joins the source before it.
function joinChain(joinCount: number, onPairs = 1) {
  return {
    ...base,
    operation: "SELECT",
    from: { table: "orders", as: "o" },
    joins: Array.from({ length: joinCount }, (_, index) => ({
      type: "inner",
      table: `t${index + 1}`,
      as: `j${index + 1}`,
      on: Array.from({ length: onPairs }, (__, pair) => ({
        left: `j${index + 1}.k${pair}`,
        right: `${index === 0 ? "o" : `j${index}`}.k${pair}`,
      })),
    })),
    columns: ["o.id"],
    limit: 10,
  };
}

// A minimal valid two-table spec that each refusal test changes in one place.
const twoTables = {
  ...base,
  operation: "SELECT",
  from: { table: "orders", as: "o" },
  joins: [
    {
      type: "inner",
      table: "customers",
      as: "c",
      on: [{ left: "c.id", right: "o.customer_id" }],
    },
  ],
  columns: ["o.id", { column: "c.name", as: "customer" }],
  limit: 20,
};

describe("APP-16506 B: from + joins", () => {
  describe("compiled bodies", () => {
    it.each([
      ["postgres-plugin", THREE_TABLE_POSTGRES],
      ["mysql-plugin", THREE_TABLE_MYSQL],
      ["mariadb-plugin", THREE_TABLE_MYSQL],
      ["oracle-plugin", THREE_TABLE_ORACLE],
      ["mssql-plugin", THREE_TABLE_MSSQL],
    ])(
      "should_compile_a_three_table_join_with_filters_group_having_order_and_limit_when_plugin_is_%s",
      (packageName, expected) => {
        // Given
        const spec = threeTableJoin;

        // When
        const body = compileFor(spec, packageName);

        // Then
        expect(body).toBe(expected);
      },
    );

    it("should_write_the_oracle_table_alias_without_as", () => {
      // Given
      const spec = twoTables;

      // When
      const body = compileFor(spec, "oracle-plugin");

      // Then
      expect(body).toBe(
        "SELECT o.id AS id, c.name AS customer FROM orders o INNER JOIN customers c ON c.id = o.customer_id FETCH FIRST 20 ROWS ONLY;",
      );
      expect(body).not.toMatch(/ AS [oc] /);
    });

    it("should_keep_the_case_of_a_mixed_case_column_in_the_inner_list_and_the_outer_reference_on_postgres", () => {
      // Given
      const spec = {
        ...twoTables,
        columns: [
          { column: "o.createdAt", as: "created_at" },
          { column: "c.name", as: "customer" },
        ],
        filters: [
          {
            column: "o.createdAt",
            op: "gte",
            value: { literal: "2026-01-01" },
          },
        ],
      };

      // When
      const body = compileFor(spec, "postgres-plugin");

      // Then
      expect(body).toBe(
        'SELECT o."createdAt" AS created_at, c."name" AS customer FROM (SELECT "customer_id", "createdAt" FROM orders) o INNER JOIN (SELECT "id", "name" FROM customers) c ON c."id" = o."customer_id" WHERE o."createdAt" >= {{ "2026-01-01" }} LIMIT 20;',
      );
    });

    it("should_keep_two_columns_that_differ_only_in_case_and_dedupe_exact_repeats_on_postgres", () => {
      // Given
      const spec = {
        ...twoTables,
        columns: [
          { column: "o.Status", as: "status_upper" },
          { column: "o.status", as: "status" },
          { column: "o.status", as: "status_again" },
          { column: "c.name", as: "customer" },
        ],
      };

      // When
      const body = compileFor(spec, "postgres-plugin");

      // Then
      expect(body).toBe(
        'SELECT o."Status" AS status_upper, o."status" AS status, o."status" AS status_again, c."name" AS customer FROM (SELECT "customer_id", "Status", "status" FROM orders) o INNER JOIN (SELECT "id", "name" FROM customers) c ON c."id" = o."customer_id" LIMIT 20;',
      );
    });

    it("should_write_a_mixed_case_column_as_written_on_mysql_oracle_and_sql_server", () => {
      // Given
      const spec = {
        ...twoTables,
        columns: [{ column: "o.createdAt", as: "created_at" }, "c.name"],
      };

      // When / Then
      expect(compileFor(spec, "mysql-plugin")).toBe(
        "SELECT o.createdAt AS created_at, c.name AS name FROM orders o INNER JOIN customers c ON c.id = o.customer_id LIMIT 20;",
      );
      expect(compileFor(spec, "mssql-plugin")).toBe(
        'SELECT TOP (20) o."createdAt" AS created_at, c."name" AS name FROM orders o INNER JOIN customers c ON c."id" = o."customer_id";',
      );
    });

    it("should_compile_coalesce_distinct_and_mssql_top_together", () => {
      // Given
      const spec = {
        ...twoTables,
        columns: [
          { column: "c.name", coalesce: { literal: "Unknown" } },
          { column: "o.region", coalesce: { literal: "none" }, as: "area" },
        ],
        distinct: true,
        orderBy: [{ column: "name", direction: "ASC" }],
      };

      // When
      const mssql = compileFor(spec, "mssql-plugin");
      const postgres = compileFor(spec, "postgres-plugin");

      // Then
      expect(mssql).toBe(
        'SELECT DISTINCT TOP (20) COALESCE(c."name", {{ "Unknown" }}) AS name, COALESCE(o."region", {{ "none" }}) AS area FROM orders o INNER JOIN customers c ON c."id" = o."customer_id" ORDER BY name ASC;',
      );
      expect(postgres).toBe(
        'SELECT DISTINCT COALESCE(c."name", {{ "Unknown" }}) AS name, COALESCE(o."region", {{ "none" }}) AS area FROM (SELECT "customer_id", "region" FROM orders) o INNER JOIN (SELECT "id", "name" FROM customers) c ON c."id" = o."customer_id" ORDER BY name ASC LIMIT 20;',
      );
    });

    it("should_compile_a_bucket_skip_when_empty_and_in_list_on_postgres", () => {
      // Given
      const spec = {
        ...twoTables,
        columns: undefined,
        filters: [
          {
            column: "c.tier",
            op: "inList",
            value: { widget: "Tiers", property: "selectedOptionValues" },
          },
          {
            column: "o.status",
            op: "eq",
            value: { widget: "Status", property: "selectedOptionValue" },
            skipWhenEmpty: true,
          },
        ],
        groupBy: [{ column: "o.created_at", bucket: "month", as: "month" }],
        aggregates: [{ fn: "count" }],
      };

      // When
      const body = compileFor(spec, "postgres-plugin");

      // Then
      expect(body).toBe(
        'SELECT DATE_TRUNC(\'month\', o."created_at") AS month, COUNT(*) AS count FROM (SELECT "customer_id", "created_at", "status" FROM orders) o INNER JOIN (SELECT "id", "tier" FROM customers) c ON c."id" = o."customer_id" WHERE CAST(c."tier" AS TEXT) = ANY(CAST({{ (Tiers.selectedOptionValues == null || Tiers.selectedOptionValues.length === 0) ? null : Tiers.selectedOptionValues }} AS TEXT[])) AND ({{ (Status.selectedOptionValue == null || Status.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR o."status" = {{ (Status.selectedOptionValue == null || Status.selectedOptionValue.length === 0) ? null : Status.selectedOptionValue }}) GROUP BY DATE_TRUNC(\'month\', o."created_at") LIMIT 20;',
      );
    });

    it.each([
      [
        "bucket",
        {
          columns: undefined,
          groupBy: [{ column: "o.created_at", bucket: "week", as: "week" }],
          aggregates: [{ fn: "count" }],
        },
        "bucket (on o.created_at) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      ],
      [
        "ilike",
        {
          filters: [{ column: "c.name", op: "ilike", value: { literal: "a" } }],
        },
        "ilike (filter on c.name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      ],
    ])("should_keep_%s_postgres_only_with_joins", (_label, change, message) => {
      // Given
      const spec = { ...twoTables, ...change };

      // When / Then
      expect(() => compileFor(spec, "mysql-plugin")).toThrow(
        new Error(message),
      );
      expect(() => compileFor(spec, "postgres-plugin")).not.toThrow();
    });

    it("should_accept_seven_joins_and_four_on_pairs", () => {
      // Given
      const spec = joinChain(7, 4);

      // When
      const body = compileFor(spec, "mysql-plugin");

      // Then
      expect(body.match(/INNER JOIN/g)).toHaveLength(7);
      expect(body).toContain(
        "INNER JOIN t7 j7 ON j7.k0 = j6.k0 AND j7.k1 = j6.k1 AND j7.k2 = j6.k2 AND j7.k3 = j6.k3",
      );
    });

    it("should_refuse_a_column_named_like_its_table_inside_the_postgres_projection", () => {
      // Given
      const spec = {
        ...twoTables,
        columns: [{ column: "c.customers", as: "x" }],
      };

      // When / Then
      expect(() => compileFor(spec, "postgres-plugin")).toThrow(
        new Error(
          "a query with from and joins cannot read a column named like its table (customers) on PostgreSQL or Redshift, which would read it as the whole row",
        ),
      );
      expect(compileFor(spec, "mysql-plugin")).toBe(
        "SELECT c.customers AS x FROM orders o INNER JOIN customers c ON c.id = o.customer_id LIMIT 20;",
      );
    });
  });

  describe("the plugin gate", () => {
    it.each([
      ["redshift-plugin", "redshift"],
      ["snowflake-plugin", "other"],
      ["unknown-plugin", "other"],
      ["snowflake-plugin", "postgres"],
      ["postgres-plugin", "mysql"],
      [undefined, "postgres"],
      [undefined, undefined],
    ])(
      "should_refuse_from_and_joins_when_packageName_is_%s_and_dialect_is_%s",
      (packageName, dialect) => {
        // Given
        const spec = parse(twoTables);

        // When / Then
        expect(() =>
          compileQuery(spec, {
            dialect: dialect as SqlDialect | undefined,
            packageName,
          }),
        ).toThrow(new Error(ALIASED_MODE_MESSAGE));
      },
    );

    it("should_refuse_from_and_joins_when_no_options_are_passed", () => {
      // Given
      const spec = parse(twoTables);

      // When / Then
      expect(() => compileQuery(spec)).toThrow(new Error(ALIASED_MODE_MESSAGE));
    });

    it.each(ALIASED_PACKAGES)(
      "should_compile_from_and_joins_when_packageName_is_%s",
      (packageName) => {
        expect(compileFor(twoTables, packageName)).toMatch(/^SELECT /);
      },
    );
  });

  describe("querySpecSchema refusals", () => {
    const COLUMN_REF_MESSAGE =
      'must be alias.column, such as "o.status": a source alias from from or joins, a dot, then a plain column name';

    it.each([
      [
        "an unqualified column in columns",
        { columns: ["id"] },
        [{ path: ["columns", 0], message: COLUMN_REF_MESSAGE }],
      ],
      [
        "an unqualified filter column",
        { filters: [{ column: "status", op: "eq", value: { literal: 1 } }] },
        [{ path: ["filters", 0, "column"], message: COLUMN_REF_MESSAGE }],
      ],
      [
        "an unqualified aggregate column",
        { columns: undefined, aggregates: [{ fn: "sum", column: "amount" }] },
        [{ path: ["aggregates", 0, "column"], message: COLUMN_REF_MESSAGE }],
      ],
      [
        "an a.b.c reference",
        { columns: ["a.b.c"] },
        [{ path: ["columns", 0], message: COLUMN_REF_MESSAGE }],
      ],
      [
        "an injection string in an on side",
        {
          joins: [
            {
              type: "inner",
              table: "customers",
              as: "c",
              on: [{ left: "c.id; DROP TABLE x", right: "o.customer_id" }],
            },
          ],
        },
        [
          {
            path: ["joins", 0, "on", 0, "left"],
            message: COLUMN_REF_MESSAGE,
          },
        ],
      ],
      [
        "a join type of left outer",
        {
          joins: [{ ...twoTables.joins[0], type: "left outer" }],
        },
        [
          {
            path: ["joins", 0, "type"],
            message:
              "Invalid enum value. Expected 'inner' | 'left', received 'left outer'",
          },
        ],
      ],
      [
        "a join type of constructor",
        {
          joins: [{ ...twoTables.joins[0], type: "constructor" }],
        },
        [
          {
            path: ["joins", 0, "type"],
            message:
              "Invalid enum value. Expected 'inner' | 'left', received 'constructor'",
          },
        ],
      ],
      [
        "an injection string in a join table",
        {
          joins: [{ ...twoTables.joins[0], table: "x; DROP TABLE y" }],
        },
        [
          {
            path: ["joins", 0, "table"],
            message: "must be table or schema.table (plain identifiers)",
          },
        ],
      ],
      [
        "an injection string as an alias",
        { from: { table: "orders", as: "x; DROP" } },
        [
          {
            path: ["from", "as"],
            message:
              "must be a lower-case name: a letter, then letters, digits or _, up to 63 characters",
          },
        ],
      ],
      [
        "a reserved word as an alias",
        { joins: [{ ...twoTables.joins[0], as: "select" }] },
        [
          {
            path: ["joins", 0, "as"],
            message: '"select" is a reserved SQL word; pick another name',
          },
        ],
      ],
      [
        "an alias that starts with mcp_split",
        { from: { table: "orders", as: "mcp_split_x" } },
        [
          {
            path: ["from", "as"],
            message: "an alias cannot start with mcp_split",
          },
        ],
      ],
      [
        "a constructor alias that no source declares",
        { columns: ["constructor.id"] },
        [
          {
            path: ["columns", 0],
            message:
              '"constructor.id" uses the alias "constructor", which no source declares (aliases: o, c)',
          },
        ],
      ],
      [
        "a system catalog as a join table",
        {
          joins: [
            { ...twoTables.joins[0], table: "information_schema.tables" },
          ],
        },
        [
          {
            path: ["joins", 0, "table"],
            message: CATALOG_MESSAGE("information_schema.tables"),
          },
        ],
      ],
      [
        "an alias used twice",
        {
          joins: [
            {
              ...twoTables.joins[0],
              as: "o",
              on: [{ left: "o.id", right: "o.customer_id" }],
            },
          ],
          columns: ["o.id"],
        },
        [
          {
            path: ["joins", 0, "as"],
            message:
              'the alias "o" is used more than once (aliases ignore case); give each source its own alias',
          },
          {
            path: ["joins", 0, "on", 0],
            message:
              "each on pair compares a column of this join's own alias with a column of a source declared before it (this join is o; earlier sources: o)",
          },
        ],
      ],
      [
        "an on pair with this join's alias on both sides",
        {
          joins: [
            {
              ...twoTables.joins[0],
              on: [{ left: "c.id", right: "c.parent_id" }],
            },
          ],
        },
        [
          {
            path: ["joins", 0, "on", 0],
            message:
              "each on pair compares a column of this join's own alias with a column of a source declared before it (this join is c; earlier sources: o)",
          },
        ],
      ],
      [
        "an on pair that names a later join",
        {
          joins: [
            {
              ...twoTables.joins[0],
              on: [{ left: "c.id", right: "p.customer_id" }],
            },
            {
              type: "left",
              table: "payments",
              as: "p",
              on: [{ left: "p.order_id", right: "o.id" }],
            },
          ],
        },
        [
          {
            path: ["joins", 0, "on", 0],
            message:
              "each on pair compares a column of this join's own alias with a column of a source declared before it (this join is c; earlier sources: o)",
          },
        ],
      ],
      [
        "an on pair that does not use this join's alias",
        {
          joins: [
            twoTables.joins[0],
            {
              type: "left",
              table: "payments",
              as: "p",
              on: [{ left: "c.id", right: "o.customer_id" }],
            },
          ],
          columns: ["o.id", { column: "p.amount", as: "amount" }],
        },
        [
          {
            path: ["joins", 1, "on", 0],
            message:
              "each on pair compares a column of this join's own alias with a column of a source declared before it (this join is p; earlier sources: o, c)",
          },
        ],
      ],
      [
        "an unused alias",
        {
          joins: undefined,
          columns: undefined,
          aggregates: [{ fn: "count" }],
        },
        [
          {
            path: ["from", "as"],
            message:
              'the alias "o" is not used; read a column through it or remove the source',
          },
        ],
      ],
      [
        "a missing limit",
        { limit: undefined },
        [
          {
            path: ["limit"],
            message:
              "limit is required with from and joins (at most 1000 rows)",
          },
        ],
      ],
      [
        "a limit over the cap",
        { limit: 1001 },
        [
          {
            path: ["limit"],
            message: "Number must be less than or equal to 1000",
          },
        ],
      ],
      [
        "SELECT *",
        { columns: undefined },
        [
          {
            path: ["columns"],
            message:
              "with from and joins, list the columns to return in columns (SELECT * is not available)",
          },
        ],
      ],
      [
        "a write",
        { operation: "UPDATE" },
        [
          {
            path: ["operation"],
            message: "from and joins are only valid on a SELECT query",
          },
        ],
      ],
      [
        "values",
        { values: [{ column: "a", value: { literal: 1 } }] },
        [{ path: [], message: "Unrecognized key(s) in object: 'values'" }],
      ],
      [
        "a repeated result name",
        { columns: ["o.id", "c.id"] },
        [
          {
            path: ["columns", 1],
            message:
              'the result name "id" is used more than once (names ignore case); give each output its own name with as',
          },
        ],
      ],
      [
        "a column part that is not a result name",
        { columns: ["o.Status", "c.select"] },
        [
          {
            path: ["columns", 0],
            message:
              'the column name "Status" cannot be a result name as it is; add as with a lower-case name that is not a SQL keyword',
          },
          {
            path: ["columns", 1],
            message:
              'the column name "select" cannot be a result name as it is; add as with a lower-case name that is not a SQL keyword',
          },
        ],
      ],
      [
        "split",
        {
          columns: undefined,
          groupBy: [{ column: "o.tags", split: "," }],
          aggregates: [{ fn: "count" }],
        },
        [
          {
            path: ["groupBy", 0, "split"],
            message: "split is not available with from and joins",
          },
        ],
      ],
      [
        "groupBy without aggregates",
        { groupBy: ["o.status"] },
        [{ path: ["groupBy"], message: "groupBy needs aggregates" }],
      ],
      [
        "columns with aggregates",
        { aggregates: [{ fn: "count" }] },
        [
          {
            path: ["columns"],
            message:
              "with aggregates, put the columns to return in groupBy, not in columns",
          },
        ],
      ],
      [
        "an orderBy that is not a result name",
        { orderBy: [{ column: "created_at", direction: "ASC" }] },
        [
          {
            path: ["orderBy", 0, "column"],
            message:
              'with from and joins, orderBy can only name a result name ("id", "customer")',
          },
        ],
      ],
      [
        "a having that is not a result name",
        {
          columns: undefined,
          groupBy: ["o.status"],
          aggregates: [{ fn: "count" }],
          having: [{ column: "total", op: "gt", value: { literal: 1 } }],
        },
        [
          {
            path: ["having", 0, "column"],
            message:
              'having can only test an aggregate\'s result name ("count") or a groupBy result name',
          },
        ],
      ],
      [
        "an injection string in from.table",
        { from: { table: "orders; DROP TABLE x", as: "o" } },
        [
          {
            path: ["from", "table"],
            message: "must be table or schema.table (plain identifiers)",
          },
        ],
      ],
      [
        "an injection string in the on right side",
        {
          joins: [
            {
              ...twoTables.joins[0],
              on: [{ left: "c.id", right: "o.customer_id OR 1=1" }],
            },
          ],
        },
        [
          {
            path: ["joins", 0, "on", 0, "right"],
            message: COLUMN_REF_MESSAGE,
          },
        ],
      ],
      [
        "an injection string in a groupBy column reference",
        {
          columns: undefined,
          groupBy: ['o.status" --'],
          aggregates: [{ fn: "count" }],
        },
        [{ path: ["groupBy", 0], message: COLUMN_REF_MESSAGE }],
      ],
      [
        "an injection string in having",
        {
          columns: undefined,
          groupBy: ["o.status"],
          aggregates: [{ fn: "count" }],
          having: [
            { column: "count; DROP TABLE x", op: "gt", value: { literal: 1 } },
          ],
        },
        [
          {
            path: ["having", 0, "column"],
            message: "must be a plain SQL identifier",
          },
          {
            path: ["having", 0, "column"],
            message:
              'having can only test an aggregate\'s result name ("count") or a groupBy result name',
          },
        ],
      ],
      [
        "an injection string in orderBy",
        { orderBy: [{ column: "id DESC; --", direction: "ASC" }] },
        [
          {
            path: ["orderBy", 0, "column"],
            message: "must be a plain SQL identifier",
          },
          {
            path: ["orderBy", 0, "column"],
            message:
              'with from and joins, orderBy can only name a result name ("id", "customer")',
          },
        ],
      ],
      [
        "table and from together",
        { table: "orders" },
        [
          {
            path: ["table"],
            message:
              "use table for a query on one table, or from (with joins) for several, not both",
          },
        ],
      ],
    ])("should_refuse_%s", (_label, change, issues) => {
      // Given
      const spec = { ...twoTables, ...change };

      // When / Then
      expect(issuesOf(spec)).toEqual(issues);
    });

    it("should_refuse_joins_without_from", () => {
      // Given
      const spec = { ...twoTables, from: undefined };

      // When / Then
      expect(issuesOf(spec)).toEqual([{ path: ["from"], message: "Required" }]);
    });

    it("should_refuse_a_qualified_column_in_single_table_mode", () => {
      // Given
      const spec = {
        ...base,
        operation: "SELECT",
        table: "orders",
        columns: ["o.id"],
      };

      // When / Then
      expect(issuesOf(spec)).toEqual([
        { path: ["columns", 0], message: "must be a plain SQL identifier" },
      ]);
    });

    it.each([
      [
        "eight joins",
        joinChain(8),
        ["joins"],
        "Array must contain at most 7 element(s)",
      ],
      [
        "five on pairs",
        joinChain(1, 5),
        ["joins", 0, "on"],
        "Array must contain at most 4 element(s)",
      ],
    ])("should_refuse_%s", (_label, spec, path, message) => {
      expect(issuesOf(spec)).toEqual([{ path, message }]);
    });

    it("should_accept_a_qualified_column_with_as_and_a_repeated_column_part", () => {
      // Given
      const spec = {
        ...twoTables,
        columns: ["o.id", { column: "c.id", as: "customer_id" }],
      };

      // When / Then
      expect(issuesOf(spec)).toEqual([]);
    });
  });

  describe("the compiler fails closed on unparsed specs", () => {
    function compileUnparsed(
      change: Record<string, unknown>,
      packageName = "postgres-plugin",
    ) {
      const spec = { ...twoTables, ...change } as unknown as QuerySpec;

      return () =>
        compileQuery(spec, {
          dialect: sqlDialectFor(packageName),
          packageName,
        });
    }

    it.each([
      [
        "join type left outer",
        { joins: [{ ...twoTables.joins[0], type: "left outer" }] },
        'unknown join type "left outer"',
      ],
      [
        "join type constructor",
        { joins: [{ ...twoTables.joins[0], type: "constructor" }] },
        'unknown join type "constructor"',
      ],
      [
        "an injection string as an alias",
        { joins: [{ ...twoTables.joins[0], as: "c; DROP" }] },
        'unsafe alias: "c; DROP"',
      ],
      [
        "an injection string as a join table",
        { joins: [{ ...twoTables.joins[0], table: "t; DROP TABLE x" }] },
        'unsafe table name: "t; DROP TABLE x"',
      ],
      [
        "an a.b.c on side",
        {
          joins: [
            { ...twoTables.joins[0], on: [{ left: "c.id.x", right: "o.id" }] },
          ],
        },
        'unsafe column reference: "c.id.x"',
      ],
      [
        "an on pair with this join's alias on both sides",
        {
          joins: [
            { ...twoTables.joins[0], on: [{ left: "c.id", right: "c.id" }] },
          ],
        },
        "each on pair compares a column of this join's own alias with a column of a source declared before it",
      ],
      [
        "an alias used twice",
        { joins: [{ ...twoTables.joins[0], as: "o" }] },
        'the alias "o" is used more than once',
      ],
      [
        "a catalog join table",
        { joins: [{ ...twoTables.joins[0], table: "pg_catalog.pg_authid" }] },
        CATALOG_MESSAGE("pg_catalog.pg_authid"),
      ],
      [
        "a pg_ join table on postgres",
        { joins: [{ ...twoTables.joins[0], table: "pg_shadow" }] },
        CATALOG_MESSAGE("pg_shadow"),
      ],
      [
        "eight joins",
        { joins: joinChain(8).joins },
        "joins must be a list of at most 7 joins",
      ],
      [
        "a join with no on pairs",
        { joins: [{ ...twoTables.joins[0], on: [] }] },
        "a join needs 1 to 4 on pairs",
      ],
      [
        "a write",
        { operation: "DELETE" },
        "from and joins are only valid on a SELECT query",
      ],
      [
        "no limit",
        { limit: undefined },
        "limit is required with from and joins (at most 1000 rows)",
      ],
      [
        "a limit over the cap",
        { limit: 5000 },
        "limit must be an integer from 1 to 1000: 5000",
      ],
      [
        "SELECT *",
        { columns: [] },
        "with from and joins, list the columns to return in columns (SELECT * is not available)",
      ],
      [
        "table and from together",
        { table: "orders" },
        "use table for a query on one table, or from (with joins) for several, not both",
      ],
      [
        "an alias that no source declares",
        {
          filters: [{ column: "x.id", op: "eq", value: { literal: 1 } }],
        },
        '"x.id" uses an alias that no source declares',
      ],
      [
        "an unqualified column",
        { columns: ["id"] },
        'unsafe column reference: "id"',
      ],
      [
        "an unused alias",
        { joins: undefined, columns: [{ column: "c.id", as: "id" }] },
        '"c.id" uses an alias that no source declares',
      ],
      [
        "a repeated result name",
        { columns: ["o.id", "c.id"] },
        'the result name "id" is used more than once',
      ],
      [
        "an invalid result name",
        { columns: [{ column: "o.id", as: "x FROM y" }] },
        'invalid result name: "x FROM y"',
      ],
      [
        "split",
        {
          columns: undefined,
          groupBy: [{ column: "o.tags", split: "," }],
          aggregates: [{ fn: "count" }],
        },
        "split is not available with from and joins",
      ],
      [
        "an unknown having name",
        {
          columns: undefined,
          groupBy: ["o.status"],
          aggregates: [{ fn: "count" }],
          having: [{ column: "o.secret", op: "gt", value: { literal: 1 } }],
        },
        'having can only test an aggregate\'s result name or a plain groupBy result name: "o.secret"',
      ],
    ])("should_throw_on_%s", (_label, change, message) => {
      expect(compileUnparsed(change)).toThrow(new Error(message));
    });

    // The projection is built from the spec before anything is emitted. orderBy names result names, so it adds
    // nothing to the projection. A hand-built orderBy on a source column is a reference the projection missed: the
    // emit-time check must refuse it rather than write c."secret".
    it.each(["postgres-plugin", "mysql-plugin"])(
      "should_refuse_an_outer_reference_to_a_column_that_is_not_projected_when_plugin_is_%s",
      (packageName) => {
        // Given
        const change = {
          orderBy: [{ column: "c.secret", direction: "ASC" }],
        };

        // When / Then
        expect(compileUnparsed(change, packageName)).toThrow(
          new Error('"c.secret" is not a column this query reads through c'),
        );
      },
    );
  });
});

// APP-16506 C: CASE, in aliased mode only.
const REF_MESSAGE =
  'must be alias.column, such as "o.status": a source alias from from or joins, a dot, then a plain column name';
const CASE_IN_GROUP_BY =
  "a CASE cannot be in groupBy: compute it in a with query, then group by that query's output";
const NESTED_CASE = "a CASE cannot contain another CASE";
const CASE_OPERAND =
  'then and else take { column: "alias.column" } or { literal } (not a widget value)';
const CASE_LITERAL =
  "a CASE literal must be a string, number or boolean, not null";
const CASE_CAP = "a query level can have at most 12 CASE expressions";
const BOOLEAN_CASE =
  "a boolean then or else is not available on Oracle or SQL Server; use a number or a string";

function caseLiteralTypes(first: string, other: string) {
  return `every literal then and else in one CASE has the same type: the first is a ${first}, this one is a ${other}`;
}

// A CASE that labels an order by its total.
const bandCase = {
  when: [
    {
      if: [{ column: "o.total", op: "gte", value: { literal: 1000 } }],
      then: { literal: "large" },
    },
    {
      if: [
        { column: "o.total", op: "isNull" },
        {
          anyOf: [
            { column: "o.status", op: "eq", value: { literal: "new" } },
            { column: "o.status", op: "isNull" },
          ],
        },
      ],
      then: { column: "o.status" },
    },
  ],
  else: { literal: "small" },
};

const caseColumns = {
  ...base,
  operation: "SELECT",
  from: { table: "orders", as: "o" },
  columns: ["o.id", { case: bandCase, as: "order_band" }],
  limit: 50,
};

const caseAggregates = {
  ...base,
  operation: "SELECT",
  from: { table: "orders", as: "o" },
  groupBy: ["o.region"],
  aggregates: [
    {
      fn: "sum",
      case: {
        when: [
          {
            if: [{ column: "o.status", op: "eq", value: { literal: "paid" } }],
            then: { column: "o.total" },
          },
        ],
        else: { literal: 0 },
      },
      as: "paid_total",
    },
    {
      fn: "count",
      case: {
        when: [
          {
            if: [{ column: "o.refunded", op: "notNull" }],
            then: { literal: 1 },
          },
        ],
      },
      as: "refunds",
    },
  ],
  having: [{ column: "paid_total", op: "gt", value: { literal: 0 } }],
  orderBy: [{ column: "paid_total", direction: "DESC" }],
  limit: 20,
};

// Changes the CASE of caseColumns.
function withBandCase(change: Record<string, unknown>) {
  return {
    ...caseColumns,
    columns: ["o.id", { case: { ...bandCase, ...change }, as: "order_band" }],
  };
}

const CASE_COLUMNS_POSTGRES =
  'SELECT o."id" AS id, CASE WHEN o."total" >= {{ 1000 }} THEN {{ "large" }} WHEN o."total" IS NULL AND (o."status" = {{ "new" }} OR o."status" IS NULL) THEN o."status" ELSE {{ "small" }} END AS order_band FROM (SELECT "id", "total", "status" FROM orders) o LIMIT 50;';
const CASE_COLUMNS_ORACLE =
  'SELECT o.id AS id, CASE WHEN o.total >= {{ 1000 }} THEN {{ "large" }} WHEN o.total IS NULL AND (o.status = {{ "new" }} OR o.status IS NULL) THEN o.status ELSE {{ "small" }} END AS order_band FROM orders o FETCH FIRST 50 ROWS ONLY;';
const CASE_COLUMNS_MSSQL =
  'SELECT TOP (50) o."id" AS id, CASE WHEN o."total" >= {{ 1000 }} THEN {{ "large" }} WHEN o."total" IS NULL AND (o."status" = {{ "new" }} OR o."status" IS NULL) THEN o."status" ELSE {{ "small" }} END AS order_band FROM orders o;';
const CASE_COLUMNS_MYSQL =
  'SELECT o.id AS id, CASE WHEN o.total >= {{ 1000 }} THEN {{ "large" }} WHEN o.total <=> NULL AND (o.status = {{ "new" }} OR o.status <=> NULL) THEN o.status ELSE {{ "small" }} END AS order_band FROM orders o LIMIT 50;';
const CASE_AGGREGATES_POSTGRES =
  'SELECT o."region" AS region, SUM(CASE WHEN o."status" = {{ "paid" }} THEN o."total" ELSE {{ 0 }} END) AS paid_total, COUNT(CASE WHEN o."refunded" IS NOT NULL THEN {{ 1 }} END) AS refunds FROM (SELECT "region", "status", "total", "refunded" FROM orders) o GROUP BY o."region" HAVING SUM(CASE WHEN o."status" = {{ "paid" }} THEN o."total" ELSE {{ 0 }} END) > {{ 0 }} ORDER BY paid_total DESC LIMIT 20;';
const CASE_AGGREGATES_ORACLE =
  'SELECT o.region AS region, SUM(CASE WHEN o.status = {{ "paid" }} THEN o.total ELSE {{ 0 }} END) AS paid_total, COUNT(CASE WHEN o.refunded IS NOT NULL THEN {{ 1 }} END) AS refunds FROM orders o GROUP BY o.region HAVING SUM(CASE WHEN o.status = {{ "paid" }} THEN o.total ELSE {{ 0 }} END) > {{ 0 }} ORDER BY paid_total DESC FETCH FIRST 20 ROWS ONLY;';
const CASE_AGGREGATES_MSSQL =
  'SELECT TOP (20) o."region" AS region, SUM(CASE WHEN o."status" = {{ "paid" }} THEN o."total" ELSE {{ 0 }} END) AS paid_total, COUNT(CASE WHEN o."refunded" IS NOT NULL THEN {{ 1 }} END) AS refunds FROM orders o GROUP BY o."region" HAVING SUM(CASE WHEN o."status" = {{ "paid" }} THEN o."total" ELSE {{ 0 }} END) > {{ 0 }} ORDER BY paid_total DESC;';

describe("APP-16506 C: CASE", () => {
  describe("compiled bodies", () => {
    it.each([
      ["postgres-plugin", CASE_COLUMNS_POSTGRES],
      ["oracle-plugin", CASE_COLUMNS_ORACLE],
      ["mssql-plugin", CASE_COLUMNS_MSSQL],
      ["mysql-plugin", CASE_COLUMNS_MYSQL],
    ])(
      "should_compile_a_case_column_when_plugin_is_%s",
      (packageName, expected) => {
        expect(compileFor(caseColumns, packageName)).toBe(expected);
      },
    );

    it.each([
      ["postgres-plugin", CASE_AGGREGATES_POSTGRES],
      ["oracle-plugin", CASE_AGGREGATES_ORACLE],
      ["mssql-plugin", CASE_AGGREGATES_MSSQL],
    ])(
      "should_compile_case_aggregate_inputs_and_having_when_plugin_is_%s",
      (packageName, expected) => {
        expect(compileFor(caseAggregates, packageName)).toBe(expected);
      },
    );

    it("should_bind_a_boolean_case_literal_on_postgres", () => {
      // Given
      const spec = withBandCase({
        when: [
          {
            if: [{ column: "o.total", op: "gte", value: { literal: 1000 } }],
            then: { literal: true },
          },
        ],
        else: { literal: false },
      });

      // When / Then
      expect(compileFor(spec, "postgres-plugin")).toBe(
        'SELECT o."id" AS id, CASE WHEN o."total" >= {{ 1000 }} THEN {{ true }} ELSE {{ false }} END AS order_band FROM (SELECT "id", "total" FROM orders) o LIMIT 50;',
      );
    });

    it.each(["oracle-plugin", "mssql-plugin"])(
      "should_refuse_a_boolean_case_literal_when_plugin_is_%s",
      (packageName) => {
        // Given
        const spec = withBandCase({
          when: [
            {
              if: [{ column: "o.total", op: "gte", value: { literal: 1 } }],
              then: { literal: true },
            },
          ],
          else: undefined,
        });

        // When / Then
        expect(() => compileFor(spec, packageName)).toThrow(
          new Error(BOOLEAN_CASE),
        );
      },
    );

    it.each(["oracle-plugin", "mssql-plugin"])(
      "should_refuse_a_boolean_case_literal_in_else_only_when_plugin_is_%s",
      (packageName) => {
        // Given
        const spec = withBandCase({
          when: [
            {
              if: [{ column: "o.total", op: "gte", value: { literal: 1 } }],
              then: { column: "o.status" },
            },
          ],
          else: { literal: true },
        });

        // When / Then
        expect(() => compileFor(spec, packageName)).toThrow(
          new Error(BOOLEAN_CASE),
        );
      },
    );

    it("should_accept_twelve_case_expressions_in_one_level", () => {
      // Given
      const spec = {
        ...caseColumns,
        columns: Array.from({ length: 12 }, (_, index) => ({
          case: bandCase,
          as: `band_${index}`,
        })),
      };

      // When / Then
      expect(compileFor(spec, "mysql-plugin").match(/CASE WHEN/g)).toHaveLength(
        12,
      );
    });
  });

  describe("querySpecSchema refusals", () => {
    it("should_refuse_a_case_in_group_by_and_point_to_with", () => {
      // Given
      const spec = {
        ...caseColumns,
        columns: undefined,
        groupBy: [{ case: bandCase, as: "order_band" }],
        aggregates: [{ fn: "count" }],
      };

      // When / Then
      expect(issuesOf(spec)).toEqual([
        { path: ["groupBy", 0, "case"], message: CASE_IN_GROUP_BY },
      ]);
    });

    it.each([
      [
        "a CASE inside a CASE",
        withBandCase({
          else: { case: bandCase },
        }).columns,
        [
          {
            path: ["columns", 1, "case", "else"],
            message: NESTED_CASE,
          },
        ],
      ],
      [
        "a widget value as then",
        withBandCase({
          when: [
            {
              if: [{ column: "o.total", op: "isNull" }],
              then: { widget: "Input1", property: "text" },
            },
          ],
        }).columns,
        [
          {
            path: ["columns", 1, "case", "when", 0, "then"],
            message: CASE_OPERAND,
          },
        ],
      ],
      [
        "a null literal",
        withBandCase({ else: { literal: null } }).columns,
        [
          {
            path: ["columns", 1, "case", "else", "literal"],
            message: CASE_LITERAL,
          },
        ],
      ],
      [
        "literals of two types",
        withBandCase({ else: { literal: 0 } }).columns,
        [
          {
            path: ["columns", 1, "case", "else", "literal"],
            message: caseLiteralTypes("string", "number"),
          },
        ],
      ],
      [
        "skipWhenEmpty in a condition",
        withBandCase({
          when: [
            {
              if: [
                {
                  column: "o.status",
                  op: "eq",
                  value: { widget: "Status", property: "selectedOptionValue" },
                  skipWhenEmpty: true,
                },
              ],
              then: { literal: "x" },
            },
          ],
        }).columns,
        [
          {
            path: ["columns", 1, "case", "when", 0, "if", 0, "skipWhenEmpty"],
            message: "a CASE condition cannot use skipWhenEmpty",
          },
        ],
      ],
      [
        "inList in a condition",
        withBandCase({
          when: [
            {
              if: [
                {
                  column: "o.status",
                  op: "inList",
                  value: { widget: "Tags", property: "selectedOptionValues" },
                },
              ],
              then: { literal: "x" },
            },
          ],
        }).columns,
        [
          {
            path: ["columns", 1, "case", "when", 0, "if", 0, "op"],
            message: "a CASE condition cannot use inList",
          },
        ],
      ],
      [
        "nine when branches",
        withBandCase({
          when: Array.from({ length: 9 }, () => bandCase.when[0]),
        }).columns,
        [
          {
            path: ["columns", 1, "case", "when"],
            message: "Array must contain at most 8 element(s)",
          },
        ],
      ],
      [
        "no when branch",
        withBandCase({ when: [] }).columns,
        [
          {
            path: ["columns", 1, "case", "when"],
            message: "Array must contain at least 1 element(s)",
          },
        ],
      ],
      [
        "five conditions in a branch",
        withBandCase({
          when: [
            {
              if: Array.from({ length: 5 }, () => ({
                column: "o.total",
                op: "isNull",
              })),
              then: { literal: "x" },
            },
          ],
        }).columns,
        [
          {
            path: ["columns", 1, "case", "when", 0, "if"],
            message: "Array must contain at most 4 element(s)",
          },
        ],
      ],
      [
        "thirteen CASE expressions",
        Array.from({ length: 13 }, (_, index) => ({
          case: bandCase,
          as: `band_${index}`,
        })),
        [{ path: ["columns", 12, "case"], message: CASE_CAP }],
      ],
      [
        "a CASE column without as",
        ["o.id", { case: bandCase }],
        [{ path: ["columns", 1, "as"], message: "Required" }],
      ],
      [
        "an unqualified column in a condition",
        withBandCase({
          when: [
            {
              if: [{ column: "total", op: "isNull" }],
              then: { literal: "x" },
            },
          ],
        }).columns,
        [
          {
            path: ["columns", 1, "case", "when", 0, "if", 0, "column"],
            message: REF_MESSAGE,
          },
        ],
      ],
      [
        "an alias that no source declares in then",
        withBandCase({ else: { column: "x.status" } }).columns,
        [
          {
            path: ["columns", 1, "case", "else", "column"],
            message:
              '"x.status" uses the alias "x", which no source declares (aliases: o)',
          },
        ],
      ],
      [
        "an injection string as the CASE result name",
        ["o.id", { case: bandCase, as: "x; DROP TABLE y" }],
        [
          {
            path: ["columns", 1, "as"],
            message:
              "must be a lower-case name: a letter, then letters, digits or _, up to 63 characters",
          },
        ],
      ],
      [
        "template syntax in a CASE literal",
        withBandCase({ else: { literal: "{{ evil() }}" } }).columns,
        [
          {
            path: ["columns", 1, "case", "else", "literal"],
            message: "no template syntax",
          },
        ],
      ],
      [
        "an injection string in a then column",
        withBandCase({ else: { column: "o.id; DROP TABLE y" } }).columns,
        [
          {
            path: ["columns", 1, "case", "else", "column"],
            message: REF_MESSAGE,
          },
        ],
      ],
      [
        "an unknown key in a CASE",
        ["o.id", { case: { ...bandCase, then: "x" }, as: "order_band" }],
        [
          {
            path: ["columns", 1, "case"],
            message: "Unrecognized key(s) in object: 'then'",
          },
        ],
      ],
    ])("should_refuse_%s", (_label, columns, issues) => {
      expect(issuesOf({ ...caseColumns, columns })).toEqual(issues);
    });

    it("should_refuse_an_aggregate_with_both_column_and_case", () => {
      // Given
      const spec = {
        ...caseAggregates,
        aggregates: [
          { ...caseAggregates.aggregates[0], column: "o.total" },
          caseAggregates.aggregates[1],
        ],
      };

      // When / Then
      expect(issuesOf(spec)).toEqual([
        {
          path: ["aggregates", 0, "case"],
          message: "an aggregate takes column or case, not both",
        },
      ]);
    });

    it("should_refuse_a_case_column_in_single_table_mode", () => {
      // Given
      const spec = {
        ...base,
        operation: "SELECT",
        table: "orders",
        columns: [{ case: bandCase, as: "order_band" }],
      };

      // When / Then
      expect(issuesOf(spec)).toEqual([
        { path: ["columns", 0], message: "Invalid input" },
      ]);
    });
  });

  describe("the compiler fails closed on unparsed specs", () => {
    function compileCase(
      spec: Record<string, unknown>,
      packageName = "postgres-plugin",
    ) {
      return () =>
        compileQuery(spec as unknown as QuerySpec, {
          dialect: sqlDialectFor(packageName),
          packageName,
        });
    }

    it.each([
      [
        "a CASE inside a CASE",
        withBandCase({ else: { case: bandCase } }),
        NESTED_CASE,
      ],
      [
        "a null literal",
        withBandCase({ else: { literal: null } }),
        CASE_LITERAL,
      ],
      [
        "an object literal",
        withBandCase({ else: { literal: { a: 1 } } }),
        CASE_LITERAL,
      ],
      [
        "literals of two types",
        withBandCase({ else: { literal: 0 } }),
        caseLiteralTypes("string", "number"),
      ],
      [
        "a widget operand",
        withBandCase({ else: { widget: "W", property: "text" } }),
        CASE_OPERAND,
      ],
      [
        "an operand with column and literal",
        withBandCase({ else: { column: "o.status", literal: "x" } }),
        CASE_OPERAND,
      ],
      [
        "nine when branches",
        withBandCase({
          when: Array.from({ length: 9 }, () => bandCase.when[0]),
        }),
        "a CASE needs 1 to 8 when branches",
      ],
      [
        "a branch with no conditions",
        withBandCase({ when: [{ if: [], then: { literal: "x" } }] }),
        "a CASE branch needs 1 to 4 if conditions",
      ],
      [
        "skipWhenEmpty in a condition",
        withBandCase({
          when: [
            {
              if: [
                {
                  column: "o.status",
                  op: "eq",
                  value: { widget: "S", property: "text" },
                  skipWhenEmpty: true,
                },
              ],
              then: { literal: "x" },
            },
          ],
        }),
        "a CASE condition cannot use skipWhenEmpty",
      ],
      [
        "inList in a condition",
        withBandCase({
          when: [
            {
              if: [
                {
                  column: "o.status",
                  op: "inList",
                  value: { widget: "S", property: "selectedOptionValues" },
                },
              ],
              then: { literal: "x" },
            },
          ],
        }),
        "a CASE condition cannot use inList",
      ],
      [
        "an unknown filter op in a condition",
        withBandCase({
          when: [
            {
              if: [
                {
                  column: "o.status",
                  op: "constructor",
                  value: { literal: 1 },
                },
              ],
              then: { literal: "x" },
            },
          ],
        }),
        'unknown filter op "constructor"',
      ],
      [
        "an injection string in a then column",
        withBandCase({ else: { column: "o.id; DROP TABLE y" } }),
        'unsafe column reference: "o.id; DROP TABLE y"',
      ],
      [
        "a CASE in groupBy",
        {
          ...caseColumns,
          columns: undefined,
          groupBy: [{ case: bandCase, as: "order_band" }],
          aggregates: [{ fn: "count" }],
        },
        CASE_IN_GROUP_BY,
      ],
      [
        "thirteen CASE expressions",
        {
          ...caseColumns,
          columns: Array.from({ length: 13 }, (_, index) => ({
            case: bandCase,
            as: `band_${index}`,
          })),
        },
        CASE_CAP,
      ],
      [
        "an aggregate with column and case",
        {
          ...caseAggregates,
          aggregates: [{ ...caseAggregates.aggregates[0], column: "o.total" }],
          having: undefined,
          orderBy: undefined,
        },
        "an aggregate takes column or case, not both",
      ],
    ])("should_throw_on_%s", (_label, spec, message) => {
      expect(compileCase(spec)).toThrow(new Error(message));
    });

    it("should_refuse_a_case_aggregate_in_an_unparsed_single_table_spec", () => {
      // Given
      const spec = {
        ...base,
        operation: "SELECT",
        table: "orders",
        aggregates: [{ fn: "sum", case: bandCase, as: "x" }],
      } as unknown as QuerySpec;

      // When / Then
      for (const dialect of DIALECTS) {
        expect(() => compileQuery(spec, { dialect })).toThrow(
          new Error("a CASE is only available in a query with from"),
        );
      }
    });
  });
});
