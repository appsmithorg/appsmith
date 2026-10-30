import {
  buildActionDto,
  compileQuery,
  markMcpAuthoredBody,
  mcpAuthoredBody,
  querySpecSchema,
  sqlDialectFor,
  withoutMcpMarker,
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
    ["oracle-plugin", "other"],
    [undefined, "other"],
  ])("maps plugin %s to dialect %s", (packageName, dialect) => {
    expect(sqlDialectFor(packageName)).toBe(dialect);
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
      'SELECT "tag", COUNT(*) AS count FROM tickets GROUP BY "tag" HAVING COUNT(*) > {{ 5 }} ORDER BY "count" DESC;',
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
      'SELECT TRIM(mcp_split.mcp_split_value) AS "feature_tags", COUNT(*) AS count FROM tickets CROSS JOIN LATERAL unnest(string_to_array("feature_tags", {{ "," }})) AS mcp_split(mcp_split_value) GROUP BY TRIM(mcp_split.mcp_split_value) HAVING TRIM(mcp_split.mcp_split_value) != {{ "N/A" }} ORDER BY "count" DESC;',
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
});
