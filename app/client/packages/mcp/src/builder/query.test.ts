import {
  buildActionDto,
  compileQuery,
  querySpecSchema,
  sqlDialectFor,
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
      "SELECT * FROM tickets WHERE ({{ (StatusSelect.selectedOptionValue == null || StatusSelect.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR status = {{ (StatusSelect.selectedOptionValue == null || StatusSelect.selectedOptionValue.length === 0) ? null : StatusSelect.selectedOptionValue }});",
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
      "SELECT * FROM tickets WHERE ({{ (StatusSelect.selectedOptionValue == null || StatusSelect.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR status = {{ StatusSelect.selectedOptionValue }});",
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
      "SELECT * FROM tickets WHERE CAST(tag AS TEXT) = ANY(CAST({{ (TagsSelect.selectedOptionValues == null || TagsSelect.selectedOptionValues.length === 0) ? null : TagsSelect.selectedOptionValues }} AS TEXT[]));",
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
      /^SELECT \* FROM tickets WHERE \(\{\{ \(TagsSelect\.selectedOptionValues == null .* \? 1 : 0 \}\} = 1 OR CAST\(tag AS TEXT\) = ANY\(.*\)\) AND \(\{\{ \(StatusSelect\.selectedOptionValue == null .* = 1 OR status = .*\);$/,
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
      "SELECT * FROM tickets WHERE status = {{ StatusSelect.selectedOptionValue }} AND tier IN ({{ TierSelect.selectedOptionValue }});",
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
      'SELECT * FROM tickets WHERE status = {{ "New" }} AND tickets.l2owner IS NULL;',
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
      'UPDATE users SET status = {{ "inactive" }} WHERE "email" IS NULL AND ID > {{ 3 }};',
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
  it("leaves value filters on Redshift as on other databases", () => {
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
      compileQuery(spec, { dialect: "other" }),
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
      'UPDATE tickets SET status = {{ "Pending on L2" }} WHERE id = {{ 7 }} AND tickets.l2owner IS NULL;',
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
      'SELECT * FROM tickets WHERE (status = {{ "New" }} OR status = {{ "Pending on L2" }} OR status = {{ "Pending on L1" }}) AND ("l2owner" IS NULL OR l2owner = {{ "" }});',
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
      "SELECT * FROM tickets WHERE archived = {{ false }} AND (org_id = {{ Customers.selectedRow.org_id }} OR requester_email = {{ Customers.selectedRow.email }});",
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
      'UPDATE tickets SET status = {{ "Closed" }} WHERE id > {{ 0 }} AND (status = {{ "Solved" }} OR status = {{ "Spam" }});',
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
      `SELECT * FROM tickets WHERE (subject = {{ "x' OR '1'='1" }} OR subject = {{ "a -- b %" }});`,
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
      'DELETE FROM drafts WHERE (drafts.submitted_at IS NULL OR status = {{ "abandoned" }});',
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
      'SELECT * FROM tickets WHERE (tickets.l2owner <=> NULL OR l2owner = {{ "" }});',
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
