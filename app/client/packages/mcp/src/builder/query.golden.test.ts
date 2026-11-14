import {
  buildActionDto,
  compileQuery,
  querySpecSchema,
  sqlDialectFor,
  type QuerySpec,
  type SqlDialect,
} from "./query.js";

// Golden regression test for the structured SQL compiler (APP-16506).
// The expected bodies were recorded from the compiler at a9f88ad3, before the column-resolver refactor. Every change
// to query.ts must keep them byte-identical. A change that is meant to alter the output updates this file in its own
// commit, so the review shows each changed body.
// - `none` is a call with no options. EE workflow queries compiled this way.
// - `{ throws }` is the exact error message of a refusal.

const base = {
  name: "getRows",
  applicationId: "app1",
  pageId: "p1",
  datasourceId: "ds1",
};

type Outcome = string | { throws: string };
type Outcomes = Record<"none" | SqlDialect, Outcome>;

const DIALECTS: SqlDialect[] = [
  "postgres",
  "redshift",
  "mysql",
  "oracle",
  "other",
];

// APP-16506: the refusal of a system catalog table.
function CATALOG_MESSAGE(table: string): string {
  return `${JSON.stringify(table)} is in a system catalog, which the MCP does not query (a best-effort guard; the datasource's credentials decide what can be read). To see a datasource's tables and columns, call get_datasource_structure`;
}

function outcome(run: () => string): Outcome {
  try {
    return run();
  } catch (error) {
    return { throws: (error as Error).message };
  }
}

// Parses the spec as the tools do, then compiles it with no options and for each dialect.
function compileForEveryDialect(spec: Record<string, unknown>): Outcomes {
  const parsed = querySpecSchema.parse({ ...base, ...spec });
  const outcomes = {
    none: outcome(() => compileQuery(parsed)),
  } as Outcomes;

  for (const dialect of DIALECTS) {
    outcomes[dialect] = outcome(() => compileQuery(parsed, { dialect }));
  }

  return outcomes;
}

const GOLDEN_CASES = [
  {
    name: "select star",
    spec: {
      operation: "SELECT",
      table: "users",
    },
    expected: {
      none: "SELECT * FROM users;",
      postgres: "SELECT * FROM users;",
      redshift: "SELECT * FROM users;",
      mysql: "SELECT * FROM users;",
      oracle: "SELECT * FROM users;",
      other: "SELECT * FROM users;",
    },
  },
  {
    name: "columns, eq filter, limit",
    spec: {
      operation: "SELECT",
      table: "users",
      columns: ["id", "name"],
      filters: [
        {
          column: "status",
          op: "eq",
          value: {
            literal: "active",
          },
        },
      ],
      limit: 50,
    },
    expected: {
      none: 'SELECT id, name FROM users WHERE users.status = {{ "active" }} LIMIT 50;',
      postgres:
        'SELECT id, name FROM users WHERE "status" = {{ "active" }} LIMIT 50;',
      redshift:
        'SELECT id, name FROM users WHERE "status" = {{ "active" }} LIMIT 50;',
      mysql:
        'SELECT id, name FROM users WHERE users.status = {{ "active" }} LIMIT 50;',
      oracle:
        'SELECT id, name FROM users WHERE users.status = {{ "active" }} FETCH FIRST 50 ROWS ONLY;',
      other:
        'SELECT id, name FROM users WHERE users.status = {{ "active" }} LIMIT 50;',
    },
  },
  {
    name: "schema-qualified table, orderBy ASC and DESC, limit",
    spec: {
      operation: "SELECT",
      table: "public.orders",
      columns: ["id", "total", "createdAt"],
      orderBy: [
        {
          column: "createdAt",
          direction: "DESC",
        },
        {
          column: "id",
          direction: "ASC",
        },
      ],
      limit: 10,
    },
    expected: {
      none: 'SELECT id, total, createdAt FROM public.orders ORDER BY "createdAt" DESC, "id" ASC LIMIT 10;',
      postgres:
        'SELECT id, total, createdAt FROM public.orders ORDER BY "createdAt" DESC, "id" ASC LIMIT 10;',
      redshift:
        'SELECT id, total, createdAt FROM public.orders ORDER BY "createdAt" DESC, "id" ASC LIMIT 10;',
      mysql:
        "SELECT id, total, createdAt FROM public.orders ORDER BY createdAt DESC, id ASC LIMIT 10;",
      oracle:
        "SELECT id, total, createdAt FROM public.orders ORDER BY createdAt DESC, id ASC FETCH FIRST 10 ROWS ONLY;",
      other:
        'SELECT id, total, createdAt FROM public.orders ORDER BY "createdAt" DESC, "id" ASC LIMIT 10;',
    },
  },
  {
    name: "widget value in an eq filter",
    spec: {
      operation: "SELECT",
      table: "orders",
      filters: [
        {
          column: "id",
          op: "eq",
          value: {
            widget: "Table1",
            property: "selectedRow.id",
          },
        },
      ],
    },
    expected: {
      none: "SELECT * FROM orders WHERE orders.id = {{ Table1.selectedRow.id }};",
      postgres:
        'SELECT * FROM orders WHERE "id" = {{ Table1.selectedRow.id }};',
      redshift:
        'SELECT * FROM orders WHERE "id" = {{ Table1.selectedRow.id }};',
      mysql:
        "SELECT * FROM orders WHERE orders.id = {{ Table1.selectedRow.id }};",
      oracle:
        "SELECT * FROM orders WHERE orders.id = {{ Table1.selectedRow.id }};",
      other:
        "SELECT * FROM orders WHERE orders.id = {{ Table1.selectedRow.id }};",
    },
  },
  {
    name: "ne, gt, gte, lt, lte with number, boolean and null literals",
    spec: {
      operation: "SELECT",
      table: "items",
      filters: [
        {
          column: "kind",
          op: "ne",
          value: {
            literal: null,
          },
        },
        {
          column: "price",
          op: "gt",
          value: {
            literal: 1.5,
          },
        },
        {
          column: "qty",
          op: "gte",
          value: {
            literal: -2,
          },
        },
        {
          column: "rank",
          op: "lt",
          value: {
            literal: 100,
          },
        },
        {
          column: "active",
          op: "lte",
          value: {
            literal: true,
          },
        },
      ],
    },
    expected: {
      none: "SELECT * FROM items WHERE items.kind != {{ null }} AND items.price > {{ 1.5 }} AND items.qty >= {{ -2 }} AND items.rank < {{ 100 }} AND items.active <= {{ true }};",
      postgres:
        'SELECT * FROM items WHERE "kind" != {{ null }} AND "price" > {{ 1.5 }} AND "qty" >= {{ -2 }} AND "rank" < {{ 100 }} AND "active" <= {{ true }};',
      redshift:
        'SELECT * FROM items WHERE "kind" != {{ null }} AND "price" > {{ 1.5 }} AND "qty" >= {{ -2 }} AND "rank" < {{ 100 }} AND "active" <= {{ true }};',
      mysql:
        "SELECT * FROM items WHERE items.kind != {{ null }} AND items.price > {{ 1.5 }} AND items.qty >= {{ -2 }} AND items.rank < {{ 100 }} AND items.active <= {{ true }};",
      oracle:
        "SELECT * FROM items WHERE items.kind != {{ null }} AND items.price > {{ 1.5 }} AND items.qty >= {{ -2 }} AND items.rank < {{ 100 }} AND items.active <= {{ true }};",
      other:
        "SELECT * FROM items WHERE items.kind != {{ null }} AND items.price > {{ 1.5 }} AND items.qty >= {{ -2 }} AND items.rank < {{ 100 }} AND items.active <= {{ true }};",
    },
  },
  {
    name: "in filter with a widget value",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "id",
          op: "in",
          value: {
            widget: "Select1",
            property: "selectedOptionValue",
          },
        },
      ],
    },
    expected: {
      none: "SELECT * FROM users WHERE users.id IN ({{ Select1.selectedOptionValue }});",
      postgres:
        'SELECT * FROM users WHERE "id" IN ({{ Select1.selectedOptionValue }});',
      redshift:
        'SELECT * FROM users WHERE "id" IN ({{ Select1.selectedOptionValue }});',
      mysql:
        "SELECT * FROM users WHERE users.id IN ({{ Select1.selectedOptionValue }});",
      oracle:
        "SELECT * FROM users WHERE users.id IN ({{ Select1.selectedOptionValue }});",
      other:
        "SELECT * FROM users WHERE users.id IN ({{ Select1.selectedOptionValue }});",
    },
  },
  {
    name: "literal with quotes, backslash and unicode",
    spec: {
      operation: "SELECT",
      table: "people",
      filters: [
        {
          column: "name",
          op: "eq",
          value: {
            literal: 'O\'Brien "x" \\ é',
          },
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM people WHERE people.name = {{ "O\'Brien \\"x\\" \\\\ é" }};',
      postgres:
        'SELECT * FROM people WHERE "name" = {{ "O\'Brien \\"x\\" \\\\ é" }};',
      redshift:
        'SELECT * FROM people WHERE "name" = {{ "O\'Brien \\"x\\" \\\\ é" }};',
      mysql:
        'SELECT * FROM people WHERE people.name = {{ "O\'Brien \\"x\\" \\\\ é" }};',
      oracle:
        'SELECT * FROM people WHERE people.name = {{ "O\'Brien \\"x\\" \\\\ é" }};',
      other:
        'SELECT * FROM people WHERE people.name = {{ "O\'Brien \\"x\\" \\\\ é" }};',
    },
  },
  {
    name: "like with no match",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "email",
          op: "like",
          value: {
            literal: "a%@x.com",
          },
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM users WHERE users.email LIKE {{ "a%@x.com" }};',
      postgres: 'SELECT * FROM users WHERE "email" LIKE {{ "a%@x.com" }};',
      redshift: 'SELECT * FROM users WHERE "email" LIKE {{ "a%@x.com" }};',
      mysql: 'SELECT * FROM users WHERE users.email LIKE {{ "a%@x.com" }};',
      oracle: 'SELECT * FROM users WHERE users.email LIKE {{ "a%@x.com" }};',
      other: 'SELECT * FROM users WHERE users.email LIKE {{ "a%@x.com" }};',
    },
  },
  {
    name: "like contains, literal",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "name",
          op: "like",
          value: {
            literal: "ann",
          },
          match: "contains",
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM users WHERE users.name LIKE {{ "%ann%" }};',
      postgres: 'SELECT * FROM users WHERE "name" LIKE {{ "%ann%" }};',
      redshift: 'SELECT * FROM users WHERE "name" LIKE {{ "%ann%" }};',
      mysql: 'SELECT * FROM users WHERE users.name LIKE {{ "%ann%" }};',
      oracle: 'SELECT * FROM users WHERE users.name LIKE {{ "%ann%" }};',
      other: 'SELECT * FROM users WHERE users.name LIKE {{ "%ann%" }};',
    },
  },
  {
    name: "like prefix, widget",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "name",
          op: "like",
          value: {
            widget: "Search1",
            property: "text",
          },
          match: "prefix",
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM users WHERE users.name LIKE {{ (Search1.text ?? "") + "%" }};',
      postgres:
        'SELECT * FROM users WHERE "name" LIKE {{ (Search1.text ?? "") + "%" }};',
      redshift:
        'SELECT * FROM users WHERE "name" LIKE {{ (Search1.text ?? "") + "%" }};',
      mysql:
        'SELECT * FROM users WHERE users.name LIKE {{ (Search1.text ?? "") + "%" }};',
      oracle:
        'SELECT * FROM users WHERE users.name LIKE {{ (Search1.text ?? "") + "%" }};',
      other:
        'SELECT * FROM users WHERE users.name LIKE {{ (Search1.text ?? "") + "%" }};',
    },
  },
  {
    name: "like suffix, literal",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "email",
          op: "like",
          value: {
            literal: "@x.com",
          },
          match: "suffix",
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM users WHERE users.email LIKE {{ "%@x.com" }};',
      postgres: 'SELECT * FROM users WHERE "email" LIKE {{ "%@x.com" }};',
      redshift: 'SELECT * FROM users WHERE "email" LIKE {{ "%@x.com" }};',
      mysql: 'SELECT * FROM users WHERE users.email LIKE {{ "%@x.com" }};',
      oracle: 'SELECT * FROM users WHERE users.email LIKE {{ "%@x.com" }};',
      other: 'SELECT * FROM users WHERE users.email LIKE {{ "%@x.com" }};',
    },
  },
  {
    name: "like exact, widget",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "code",
          op: "like",
          value: {
            widget: "Code1",
            property: "text",
          },
          match: "exact",
        },
      ],
    },
    expected: {
      none: "SELECT * FROM users WHERE users.code LIKE {{ Code1.text }};",
      postgres: 'SELECT * FROM users WHERE "code" LIKE {{ Code1.text }};',
      redshift: 'SELECT * FROM users WHERE "code" LIKE {{ Code1.text }};',
      mysql: "SELECT * FROM users WHERE users.code LIKE {{ Code1.text }};",
      oracle: "SELECT * FROM users WHERE users.code LIKE {{ Code1.text }};",
      other: "SELECT * FROM users WHERE users.code LIKE {{ Code1.text }};",
    },
  },
  {
    name: "ilike contains, widget",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "name",
          op: "ilike",
          value: {
            widget: "Search1",
            property: "text",
          },
          match: "contains",
        },
      ],
    },
    expected: {
      none: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
      postgres:
        'SELECT * FROM users WHERE "name" ILIKE {{ "%" + (Search1.text ?? "") + "%" }};',
      redshift: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
      mysql: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
      oracle: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
      other: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
    },
  },
  {
    name: "ilike with no match, literal",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "name",
          op: "ilike",
          value: {
            literal: "Ann",
          },
        },
      ],
    },
    expected: {
      none: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
      postgres: 'SELECT * FROM users WHERE "name" ILIKE {{ "Ann" }};',
      redshift: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
      mysql: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
      oracle: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
      other: {
        throws:
          "ilike (filter on name) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations",
      },
    },
  },
  {
    name: "isNull and notNull",
    spec: {
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          column: "closedAt",
          op: "isNull",
        },
        {
          column: "owner",
          op: "notNull",
        },
      ],
    },
    expected: {
      none: "SELECT * FROM tickets WHERE tickets.closedAt IS NULL AND tickets.owner IS NOT NULL;",
      postgres:
        'SELECT * FROM tickets WHERE "closedat" IS NULL AND "owner" IS NOT NULL;',
      redshift:
        'SELECT * FROM tickets WHERE "closedat" IS NULL AND "owner" IS NOT NULL;',
      mysql:
        "SELECT * FROM tickets WHERE tickets.closedAt <=> NULL AND NOT (tickets.owner <=> NULL);",
      oracle:
        "SELECT * FROM tickets WHERE tickets.closedAt IS NULL AND tickets.owner IS NOT NULL;",
      other:
        "SELECT * FROM tickets WHERE tickets.closedAt IS NULL AND tickets.owner IS NOT NULL;",
    },
  },
  {
    name: "isNull on a keyword-named column",
    spec: {
      operation: "SELECT",
      table: "t",
      filters: [
        {
          column: "null",
          op: "isNull",
        },
      ],
    },
    expected: {
      none: "SELECT * FROM t WHERE t.null IS NULL;",
      postgres: 'SELECT * FROM t WHERE "null" IS NULL;',
      redshift: 'SELECT * FROM t WHERE "null" IS NULL;',
      mysql: "SELECT * FROM t WHERE t.null <=> NULL;",
      oracle: "SELECT * FROM t WHERE t.null IS NULL;",
      other: "SELECT * FROM t WHERE t.null IS NULL;",
    },
  },
  {
    name: "mixed-case filter column",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "Status",
          op: "eq",
          value: {
            literal: "open",
          },
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM users WHERE users.Status = {{ "open" }};',
      postgres: 'SELECT * FROM users WHERE "status" = {{ "open" }};',
      redshift: 'SELECT * FROM users WHERE "status" = {{ "open" }};',
      mysql: 'SELECT * FROM users WHERE users.Status = {{ "open" }};',
      oracle: 'SELECT * FROM users WHERE users.Status = {{ "open" }};',
      other: 'SELECT * FROM users WHERE users.Status = {{ "open" }};',
    },
  },
  {
    name: "inList with a widget",
    spec: {
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          column: "status",
          op: "inList",
          value: {
            widget: "Multi1",
            property: "selectedOptionValues",
          },
        },
      ],
    },
    expected: {
      none: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      postgres:
        'SELECT * FROM tickets WHERE CAST("status" AS TEXT) = ANY(CAST({{ (Multi1.selectedOptionValues == null || Multi1.selectedOptionValues.length === 0) ? null : Multi1.selectedOptionValues }} AS TEXT[]));',
      redshift: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      mysql: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      oracle: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      other: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
    },
  },
  {
    name: "skipWhenEmpty eq",
    spec: {
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          column: "priority",
          op: "eq",
          value: {
            widget: "Select1",
            property: "selectedOptionValue",
          },
          skipWhenEmpty: true,
        },
      ],
    },
    expected: {
      none: "SELECT * FROM tickets WHERE ({{ (Select1.selectedOptionValue == null || Select1.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR tickets.priority = {{ Select1.selectedOptionValue }});",
      postgres:
        'SELECT * FROM tickets WHERE ({{ (Select1.selectedOptionValue == null || Select1.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR "priority" = {{ (Select1.selectedOptionValue == null || Select1.selectedOptionValue.length === 0) ? null : Select1.selectedOptionValue }});',
      redshift:
        'SELECT * FROM tickets WHERE ({{ (Select1.selectedOptionValue == null || Select1.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR "priority" = {{ Select1.selectedOptionValue }});',
      mysql:
        "SELECT * FROM tickets WHERE ({{ (Select1.selectedOptionValue == null || Select1.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR tickets.priority = {{ Select1.selectedOptionValue }});",
      oracle:
        "SELECT * FROM tickets WHERE ({{ (Select1.selectedOptionValue == null || Select1.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR tickets.priority = {{ Select1.selectedOptionValue }});",
      other:
        "SELECT * FROM tickets WHERE ({{ (Select1.selectedOptionValue == null || Select1.selectedOptionValue.length === 0) ? 1 : 0 }} = 1 OR tickets.priority = {{ Select1.selectedOptionValue }});",
    },
  },
  {
    name: "skipWhenEmpty inList",
    spec: {
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          column: "status",
          op: "inList",
          value: {
            widget: "Multi1",
            property: "selectedOptionValues",
          },
          skipWhenEmpty: true,
        },
      ],
    },
    expected: {
      none: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      postgres:
        'SELECT * FROM tickets WHERE ({{ (Multi1.selectedOptionValues == null || Multi1.selectedOptionValues.length === 0) ? 1 : 0 }} = 1 OR CAST("status" AS TEXT) = ANY(CAST({{ (Multi1.selectedOptionValues == null || Multi1.selectedOptionValues.length === 0) ? null : Multi1.selectedOptionValues }} AS TEXT[])));',
      redshift: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      mysql: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      oracle: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      other: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
    },
  },
  {
    name: "skipWhenEmpty like contains",
    spec: {
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          column: "title",
          op: "like",
          value: {
            widget: "Search1",
            property: "text",
          },
          match: "contains",
          skipWhenEmpty: true,
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM tickets WHERE ({{ (Search1.text == null || Search1.text.length === 0) ? 1 : 0 }} = 1 OR tickets.title LIKE {{ "%" + (Search1.text ?? "") + "%" }});',
      postgres:
        'SELECT * FROM tickets WHERE ({{ (Search1.text == null || Search1.text.length === 0) ? 1 : 0 }} = 1 OR "title" LIKE {{ "%" + (Search1.text ?? "") + "%" }});',
      redshift:
        'SELECT * FROM tickets WHERE ({{ (Search1.text == null || Search1.text.length === 0) ? 1 : 0 }} = 1 OR "title" LIKE {{ "%" + (Search1.text ?? "") + "%" }});',
      mysql:
        'SELECT * FROM tickets WHERE ({{ (Search1.text == null || Search1.text.length === 0) ? 1 : 0 }} = 1 OR tickets.title LIKE {{ "%" + (Search1.text ?? "") + "%" }});',
      oracle:
        'SELECT * FROM tickets WHERE ({{ (Search1.text == null || Search1.text.length === 0) ? 1 : 0 }} = 1 OR tickets.title LIKE {{ "%" + (Search1.text ?? "") + "%" }});',
      other:
        'SELECT * FROM tickets WHERE ({{ (Search1.text == null || Search1.text.length === 0) ? 1 : 0 }} = 1 OR tickets.title LIKE {{ "%" + (Search1.text ?? "") + "%" }});',
    },
  },
  {
    name: "viewer scoping with appsmith.user.email",
    spec: {
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          column: "owner",
          op: "eq",
          value: {
            widget: "appsmith",
            property: "user.email",
          },
        },
      ],
    },
    expected: {
      none: "SELECT * FROM tickets WHERE tickets.owner = {{ appsmith.user.email }};",
      postgres:
        'SELECT * FROM tickets WHERE "owner" = {{ appsmith.user.email }};',
      redshift:
        'SELECT * FROM tickets WHERE "owner" = {{ appsmith.user.email }};',
      mysql:
        "SELECT * FROM tickets WHERE tickets.owner = {{ appsmith.user.email }};",
      oracle:
        "SELECT * FROM tickets WHERE tickets.owner = {{ appsmith.user.email }};",
      other:
        "SELECT * FROM tickets WHERE tickets.owner = {{ appsmith.user.email }};",
    },
  },
  {
    name: "anyOf group ANDed with a plain filter",
    spec: {
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          column: "open",
          op: "eq",
          value: {
            literal: true,
          },
        },
        {
          anyOf: [
            {
              column: "title",
              op: "like",
              value: {
                widget: "Search1",
                property: "text",
              },
              match: "contains",
            },
            {
              column: "owner",
              op: "eq",
              value: {
                widget: "Search1",
                property: "text",
              },
            },
          ],
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM tickets WHERE tickets.open = {{ true }} AND (tickets.title LIKE {{ "%" + (Search1.text ?? "") + "%" }} OR tickets.owner = {{ Search1.text }});',
      postgres:
        'SELECT * FROM tickets WHERE "open" = {{ true }} AND ("title" LIKE {{ "%" + (Search1.text ?? "") + "%" }} OR "owner" = {{ Search1.text }});',
      redshift:
        'SELECT * FROM tickets WHERE "open" = {{ true }} AND ("title" LIKE {{ "%" + (Search1.text ?? "") + "%" }} OR "owner" = {{ Search1.text }});',
      mysql:
        'SELECT * FROM tickets WHERE tickets.open = {{ true }} AND (tickets.title LIKE {{ "%" + (Search1.text ?? "") + "%" }} OR tickets.owner = {{ Search1.text }});',
      oracle:
        'SELECT * FROM tickets WHERE tickets.open = {{ true }} AND (tickets.title LIKE {{ "%" + (Search1.text ?? "") + "%" }} OR tickets.owner = {{ Search1.text }});',
      other:
        'SELECT * FROM tickets WHERE tickets.open = {{ true }} AND (tickets.title LIKE {{ "%" + (Search1.text ?? "") + "%" }} OR tickets.owner = {{ Search1.text }});',
    },
  },
  {
    name: "anyOf with isNull and inList",
    spec: {
      operation: "SELECT",
      table: "tickets",
      filters: [
        {
          anyOf: [
            {
              column: "status",
              op: "isNull",
            },
            {
              column: "status",
              op: "inList",
              value: {
                widget: "Multi1",
                property: "selectedOptionValues",
              },
            },
          ],
        },
      ],
    },
    expected: {
      none: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      postgres:
        'SELECT * FROM tickets WHERE ("status" IS NULL OR CAST("status" AS TEXT) = ANY(CAST({{ (Multi1.selectedOptionValues == null || Multi1.selectedOptionValues.length === 0) ? null : Multi1.selectedOptionValues }} AS TEXT[])));',
      redshift: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      mysql: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      oracle: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
      other: {
        throws:
          "inList (filter on status) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select",
      },
    },
  },
  {
    name: "filter on a column named like its table",
    spec: {
      operation: "SELECT",
      table: "public.users",
      filters: [
        {
          column: "Users",
          op: "eq",
          value: {
            literal: "x",
          },
        },
      ],
    },
    expected: {
      none: 'SELECT * FROM public.users WHERE public.users.Users = {{ "x" }};',
      postgres: {
        throws:
          "a filter cannot test a column named like its table (users) on PostgreSQL or Redshift, which would read it as the whole row",
      },
      redshift: {
        throws:
          "a filter cannot test a column named like its table (users) on PostgreSQL or Redshift, which would read it as the whole row",
      },
      mysql: 'SELECT * FROM public.users WHERE public.users.Users = {{ "x" }};',
      oracle:
        'SELECT * FROM public.users WHERE public.users.Users = {{ "x" }};',
      other: 'SELECT * FROM public.users WHERE public.users.Users = {{ "x" }};',
    },
  },
  {
    name: "coalesce in columns",
    spec: {
      operation: "SELECT",
      table: "users",
      columns: [
        "id",
        {
          column: "nickname",
          coalesce: {
            literal: "none",
          },
        },
      ],
      orderBy: [
        {
          column: "id",
          direction: "ASC",
        },
      ],
    },
    expected: {
      none: 'SELECT id, COALESCE(nickname, {{ "none" }}) AS nickname FROM users ORDER BY "id" ASC;',
      postgres:
        'SELECT id, COALESCE(nickname, {{ "none" }}) AS nickname FROM users ORDER BY "id" ASC;',
      redshift:
        'SELECT id, COALESCE(nickname, {{ "none" }}) AS nickname FROM users ORDER BY "id" ASC;',
      mysql:
        'SELECT id, COALESCE(nickname, {{ "none" }}) AS nickname FROM users ORDER BY id ASC;',
      oracle:
        'SELECT id, COALESCE(nickname, {{ "none" }}) AS nickname FROM users ORDER BY id ASC;',
      other:
        'SELECT id, COALESCE(nickname, {{ "none" }}) AS nickname FROM users ORDER BY "id" ASC;',
    },
  },
  {
    name: "distinct columns with orderBy and limit",
    spec: {
      operation: "SELECT",
      table: "orders",
      columns: ["region", "status"],
      distinct: true,
      orderBy: [
        {
          column: "region",
          direction: "ASC",
        },
      ],
      limit: 25,
    },
    expected: {
      none: 'SELECT DISTINCT region, status FROM orders ORDER BY "region" ASC LIMIT 25;',
      postgres:
        'SELECT DISTINCT region, status FROM orders ORDER BY "region" ASC LIMIT 25;',
      redshift:
        'SELECT DISTINCT region, status FROM orders ORDER BY "region" ASC LIMIT 25;',
      mysql:
        "SELECT DISTINCT region, status FROM orders ORDER BY region ASC LIMIT 25;",
      oracle:
        "SELECT DISTINCT region, status FROM orders ORDER BY region ASC FETCH FIRST 25 ROWS ONLY;",
      other:
        'SELECT DISTINCT region, status FROM orders ORDER BY "region" ASC LIMIT 25;',
    },
  },
  {
    name: "distinct with a coalesce column",
    spec: {
      operation: "SELECT",
      table: "orders",
      columns: [
        {
          column: "region",
          coalesce: {
            literal: "unknown",
          },
        },
      ],
      distinct: true,
    },
    expected: {
      none: 'SELECT DISTINCT COALESCE(region, {{ "unknown" }}) AS region FROM orders;',
      postgres:
        'SELECT DISTINCT COALESCE(region, {{ "unknown" }}) AS region FROM orders;',
      redshift:
        'SELECT DISTINCT COALESCE(region, {{ "unknown" }}) AS region FROM orders;',
      mysql:
        'SELECT DISTINCT COALESCE(region, {{ "unknown" }}) AS region FROM orders;',
      oracle:
        'SELECT DISTINCT COALESCE(region, {{ "unknown" }}) AS region FROM orders;',
      other:
        'SELECT DISTINCT COALESCE(region, {{ "unknown" }}) AS region FROM orders;',
    },
  },
  {
    name: "legacy aggregate count(*)",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregate: {
        fn: "count",
      },
    },
    expected: {
      none: "SELECT COUNT(*) AS count FROM users;",
      postgres: "SELECT COUNT(*) AS count FROM users;",
      redshift: "SELECT COUNT(*) AS count FROM users;",
      mysql: "SELECT COUNT(*) AS count FROM users;",
      oracle: "SELECT COUNT(*) AS count FROM users;",
      other: "SELECT COUNT(*) AS count FROM users;",
    },
  },
  {
    name: "legacy aggregate sum with groupBy and orderBy on the result",
    spec: {
      operation: "SELECT",
      table: "orders",
      aggregate: {
        fn: "sum",
        column: "amount",
      },
      groupBy: ["region"],
      orderBy: [
        {
          column: "sum",
          direction: "DESC",
        },
      ],
      limit: 5,
    },
    expected: {
      none: 'SELECT "region", SUM("amount") AS sum FROM orders GROUP BY "region" ORDER BY sum DESC LIMIT 5;',
      postgres:
        'SELECT "region", SUM("amount") AS sum FROM orders GROUP BY "region" ORDER BY sum DESC LIMIT 5;',
      redshift:
        'SELECT "region", SUM("amount") AS sum FROM orders GROUP BY "region" ORDER BY sum DESC LIMIT 5;',
      mysql:
        "SELECT region, SUM(amount) AS sum FROM orders GROUP BY region ORDER BY sum DESC LIMIT 5;",
      oracle:
        "SELECT region, SUM(amount) AS sum FROM orders GROUP BY region ORDER BY sum DESC FETCH FIRST 5 ROWS ONLY;",
      other:
        'SELECT "region", SUM("amount") AS sum FROM orders GROUP BY "region" ORDER BY sum DESC LIMIT 5;',
    },
  },
  {
    name: "legacy aggregate avg, coalesce group key, having on a group column",
    spec: {
      operation: "SELECT",
      table: "orders",
      filters: [
        {
          column: "paid",
          op: "eq",
          value: {
            literal: true,
          },
        },
      ],
      aggregate: {
        fn: "avg",
        column: "amount",
      },
      groupBy: [
        {
          column: "region",
          coalesce: {
            literal: "none",
          },
        },
        "status",
      ],
      having: [
        {
          column: "status",
          op: "ne",
          value: {
            literal: "void",
          },
        },
      ],
    },
    expected: {
      none: 'SELECT COALESCE("region", {{ "none" }}) AS "region", "status", AVG("amount") AS avg FROM orders WHERE orders.paid = {{ true }} GROUP BY "region", "status" HAVING "status" != {{ "void" }};',
      postgres:
        'SELECT COALESCE("region", {{ "none" }}) AS "region", "status", AVG("amount") AS avg FROM orders WHERE "paid" = {{ true }} GROUP BY "region", "status" HAVING "status" != {{ "void" }};',
      redshift:
        'SELECT COALESCE("region", {{ "none" }}) AS "region", "status", AVG("amount") AS avg FROM orders WHERE "paid" = {{ true }} GROUP BY "region", "status" HAVING "status" != {{ "void" }};',
      mysql:
        'SELECT COALESCE(region, {{ "none" }}) AS region, status, AVG(amount) AS avg FROM orders WHERE orders.paid = {{ true }} GROUP BY region, status HAVING status != {{ "void" }};',
      oracle:
        'SELECT COALESCE(region, {{ "none" }}) AS region, status, AVG(amount) AS avg FROM orders WHERE orders.paid = {{ true }} GROUP BY region, status HAVING status != {{ "void" }};',
      other:
        'SELECT COALESCE("region", {{ "none" }}) AS "region", "status", AVG("amount") AS avg FROM orders WHERE orders.paid = {{ true }} GROUP BY "region", "status" HAVING "status" != {{ "void" }};',
    },
  },
  {
    name: "legacy aggregate count with having on the aggregate",
    spec: {
      operation: "SELECT",
      table: "orders",
      aggregate: {
        fn: "count",
        column: "id",
      },
      groupBy: ["customerId"],
      having: [
        {
          column: "count",
          op: "gt",
          value: {
            literal: 3,
          },
        },
      ],
      orderBy: [
        {
          column: "customerId",
          direction: "ASC",
        },
      ],
    },
    expected: {
      none: 'SELECT "customerId", COUNT("id") AS count FROM orders GROUP BY "customerId" HAVING COUNT("id") > {{ 3 }} ORDER BY "customerId" ASC;',
      postgres:
        'SELECT "customerId", COUNT("id") AS count FROM orders GROUP BY "customerId" HAVING COUNT("id") > {{ 3 }} ORDER BY "customerId" ASC;',
      redshift:
        'SELECT "customerId", COUNT("id") AS count FROM orders GROUP BY "customerId" HAVING COUNT("id") > {{ 3 }} ORDER BY "customerId" ASC;',
      mysql:
        "SELECT customerId, COUNT(id) AS count FROM orders GROUP BY customerId HAVING COUNT(id) > {{ 3 }} ORDER BY customerId ASC;",
      oracle:
        "SELECT customerId, COUNT(id) AS count FROM orders GROUP BY customerId HAVING COUNT(id) > {{ 3 }} ORDER BY customerId ASC;",
      other:
        'SELECT "customerId", COUNT("id") AS count FROM orders GROUP BY "customerId" HAVING COUNT("id") > {{ 3 }} ORDER BY "customerId" ASC;',
    },
  },
  {
    name: "legacy aggregate, repeated group column without split",
    spec: {
      operation: "SELECT",
      table: "orders",
      aggregate: {
        fn: "count",
      },
      groupBy: ["region", "region"],
    },
    expected: {
      none: 'SELECT "region", "region", COUNT(*) AS count FROM orders GROUP BY "region", "region";',
      postgres:
        'SELECT "region", "region", COUNT(*) AS count FROM orders GROUP BY "region", "region";',
      redshift:
        'SELECT "region", "region", COUNT(*) AS count FROM orders GROUP BY "region", "region";',
      mysql:
        "SELECT region, region, COUNT(*) AS count FROM orders GROUP BY region, region;",
      oracle:
        "SELECT region, region, COUNT(*) AS count FROM orders GROUP BY region, region;",
      other:
        'SELECT "region", "region", COUNT(*) AS count FROM orders GROUP BY "region", "region";',
    },
  },
  {
    name: "aggregates list with abs, round floor and as",
    spec: {
      operation: "SELECT",
      table: "payments",
      aggregates: [
        {
          fn: "count",
        },
        {
          fn: "sum",
          column: "amount",
          abs: true,
        },
        {
          fn: "avg",
          column: "amount",
          round: "floor",
          as: "avg_amount",
        },
        {
          fn: "max",
          column: "paidAt",
          as: "last_paid",
        },
        {
          fn: "min",
          column: "paidAt",
          as: "first_paid",
        },
      ],
      groupBy: ["currency"],
      orderBy: [
        {
          column: "avg_amount",
          direction: "DESC",
        },
        {
          column: "currency",
          direction: "ASC",
        },
      ],
    },
    expected: {
      none: 'SELECT "currency", COUNT(*) AS count, SUM(ABS("amount")) AS sum, FLOOR(AVG("amount")) AS avg_amount, MAX("paidAt") AS last_paid, MIN("paidAt") AS first_paid FROM payments GROUP BY "currency" ORDER BY avg_amount DESC, "currency" ASC;',
      postgres:
        'SELECT "currency", COUNT(*) AS count, SUM(ABS("amount")) AS sum, FLOOR(AVG("amount")) AS avg_amount, MAX("paidAt") AS last_paid, MIN("paidAt") AS first_paid FROM payments GROUP BY "currency" ORDER BY avg_amount DESC, "currency" ASC;',
      redshift:
        'SELECT "currency", COUNT(*) AS count, SUM(ABS("amount")) AS sum, FLOOR(AVG("amount")) AS avg_amount, MAX("paidAt") AS last_paid, MIN("paidAt") AS first_paid FROM payments GROUP BY "currency" ORDER BY avg_amount DESC, "currency" ASC;',
      mysql:
        "SELECT currency, COUNT(*) AS count, SUM(ABS(amount)) AS sum, FLOOR(AVG(amount)) AS avg_amount, MAX(paidAt) AS last_paid, MIN(paidAt) AS first_paid FROM payments GROUP BY currency ORDER BY avg_amount DESC, currency ASC;",
      oracle:
        "SELECT currency, COUNT(*) AS count, SUM(ABS(amount)) AS sum, FLOOR(AVG(amount)) AS avg_amount, MAX(paidAt) AS last_paid, MIN(paidAt) AS first_paid FROM payments GROUP BY currency ORDER BY avg_amount DESC, currency ASC;",
      other:
        'SELECT "currency", COUNT(*) AS count, SUM(ABS("amount")) AS sum, FLOOR(AVG("amount")) AS avg_amount, MAX("paidAt") AS last_paid, MIN("paidAt") AS first_paid FROM payments GROUP BY "currency" ORDER BY avg_amount DESC, "currency" ASC;',
    },
  },
  {
    name: "aggregates with round ceil",
    spec: {
      operation: "SELECT",
      table: "payments",
      aggregates: [
        {
          fn: "avg",
          column: "amount",
          round: "ceil",
        },
      ],
    },
    expected: {
      none: {
        throws:
          'round "ceil" (on amount) is only available on a PostgreSQL, Redshift, MySQL or Oracle datasource; on other databases use round "floor" or no round',
      },
      postgres: 'SELECT CEIL(AVG("amount")) AS avg FROM payments;',
      redshift: 'SELECT CEIL(AVG("amount")) AS avg FROM payments;',
      mysql: "SELECT CEIL(AVG(amount)) AS avg FROM payments;",
      oracle: "SELECT CEIL(AVG(amount)) AS avg FROM payments;",
      other: {
        throws:
          'round "ceil" (on amount) is only available on a PostgreSQL, Redshift, MySQL or Oracle datasource; on other databases use round "floor" or no round',
      },
    },
  },
  {
    name: "aggregates with round round and abs",
    spec: {
      operation: "SELECT",
      table: "payments",
      aggregates: [
        {
          fn: "sum",
          column: "delta",
          abs: true,
          round: "round",
          as: "total",
        },
      ],
    },
    expected: {
      none: {
        throws:
          'round "round" (on delta) is only available on a PostgreSQL, Redshift, MySQL or Oracle datasource; on other databases use round "floor" or no round',
      },
      postgres: 'SELECT ROUND(SUM(ABS("delta"))) AS total FROM payments;',
      redshift: 'SELECT ROUND(SUM(ABS("delta"))) AS total FROM payments;',
      mysql: "SELECT ROUND(SUM(ABS(delta))) AS total FROM payments;",
      oracle: "SELECT ROUND(SUM(ABS(delta))) AS total FROM payments;",
      other: {
        throws:
          'round "round" (on delta) is only available on a PostgreSQL, Redshift, MySQL or Oracle datasource; on other databases use round "floor" or no round',
      },
    },
  },
  {
    name: "aggregates with having on a named aggregate and a widget value",
    spec: {
      operation: "SELECT",
      table: "orders",
      aggregates: [
        {
          fn: "count",
          as: "orders",
        },
        {
          fn: "sum",
          column: "amount",
          as: "revenue",
        },
      ],
      groupBy: ["region"],
      having: [
        {
          column: "revenue",
          op: "gte",
          value: {
            widget: "Min1",
            property: "text",
          },
        },
        {
          column: "orders",
          op: "lt",
          value: {
            literal: 1000,
          },
        },
      ],
    },
    expected: {
      none: 'SELECT "region", COUNT(*) AS orders, SUM("amount") AS revenue FROM orders GROUP BY "region" HAVING SUM("amount") >= {{ Min1.text }} AND COUNT(*) < {{ 1000 }};',
      postgres:
        'SELECT "region", COUNT(*) AS orders, SUM("amount") AS revenue FROM orders GROUP BY "region" HAVING SUM("amount") >= {{ Min1.text }} AND COUNT(*) < {{ 1000 }};',
      redshift:
        'SELECT "region", COUNT(*) AS orders, SUM("amount") AS revenue FROM orders GROUP BY "region" HAVING SUM("amount") >= {{ Min1.text }} AND COUNT(*) < {{ 1000 }};',
      mysql:
        "SELECT region, COUNT(*) AS orders, SUM(amount) AS revenue FROM orders GROUP BY region HAVING SUM(amount) >= {{ Min1.text }} AND COUNT(*) < {{ 1000 }};",
      oracle:
        "SELECT region, COUNT(*) AS orders, SUM(amount) AS revenue FROM orders GROUP BY region HAVING SUM(amount) >= {{ Min1.text }} AND COUNT(*) < {{ 1000 }};",
      other:
        'SELECT "region", COUNT(*) AS orders, SUM("amount") AS revenue FROM orders GROUP BY "region" HAVING SUM("amount") >= {{ Min1.text }} AND COUNT(*) < {{ 1000 }};',
    },
  },
  {
    name: "aggregates column named like its table",
    spec: {
      operation: "SELECT",
      table: "amount",
      aggregates: [
        {
          fn: "sum",
          column: "amount",
        },
      ],
    },
    expected: {
      none: 'SELECT SUM("amount") AS sum FROM amount;',
      postgres: {
        throws:
          "an aggregate cannot use a column named like its table (amount) on PostgreSQL or Redshift, which would read it as the whole row",
      },
      redshift: {
        throws:
          "an aggregate cannot use a column named like its table (amount) on PostgreSQL or Redshift, which would read it as the whole row",
      },
      mysql: "SELECT SUM(amount) AS sum FROM amount;",
      oracle: "SELECT SUM(amount) AS sum FROM amount;",
      other: 'SELECT SUM("amount") AS sum FROM amount;',
    },
  },
  {
    name: "groupBy column named like its table",
    spec: {
      operation: "SELECT",
      table: "s.region",
      aggregate: {
        fn: "count",
      },
      groupBy: ["region"],
    },
    expected: {
      none: 'SELECT "region", COUNT(*) AS count FROM s.region GROUP BY "region";',
      postgres: {
        throws:
          "groupBy and having cannot use a column named like its table (region) on PostgreSQL or Redshift, which would read it as the whole row",
      },
      redshift: {
        throws:
          "groupBy and having cannot use a column named like its table (region) on PostgreSQL or Redshift, which would read it as the whole row",
      },
      mysql: "SELECT region, COUNT(*) AS count FROM s.region GROUP BY region;",
      oracle: "SELECT region, COUNT(*) AS count FROM s.region GROUP BY region;",
      other:
        'SELECT "region", COUNT(*) AS count FROM s.region GROUP BY "region";',
    },
  },
  {
    name: "bucket week with count and orderBy on the bucket",
    spec: {
      operation: "SELECT",
      table: "signups",
      aggregates: [
        {
          fn: "count",
          as: "signups",
        },
      ],
      groupBy: [
        {
          column: "createdAt",
          bucket: "week",
          as: "week",
        },
      ],
      orderBy: [
        {
          column: "week",
          direction: "ASC",
        },
      ],
    },
    expected: {
      none: {
        throws:
          "bucket (on createdAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      postgres:
        "SELECT DATE_TRUNC('week', \"createdAt\") AS week, COUNT(*) AS signups FROM signups GROUP BY DATE_TRUNC('week', \"createdAt\") ORDER BY week ASC;",
      redshift:
        "SELECT DATE_TRUNC('week', \"createdAt\") AS week, COUNT(*) AS signups FROM signups GROUP BY DATE_TRUNC('week', \"createdAt\") ORDER BY week ASC;",
      mysql: {
        throws:
          "bucket (on createdAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      oracle: {
        throws:
          "bucket (on createdAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      other: {
        throws:
          "bucket (on createdAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
    },
  },
  {
    name: "bucket month, plain group key, having on the aggregate",
    spec: {
      operation: "SELECT",
      table: "invoices",
      filters: [
        {
          column: "status",
          op: "eq",
          value: {
            literal: "paid",
          },
        },
      ],
      aggregates: [
        {
          fn: "sum",
          column: "amount",
          as: "mrr",
        },
      ],
      groupBy: [
        {
          column: "periodStart",
          bucket: "month",
          as: "month",
        },
        "plan",
      ],
      having: [
        {
          column: "mrr",
          op: "gt",
          value: {
            literal: 0,
          },
        },
      ],
      orderBy: [
        {
          column: "month",
          direction: "DESC",
        },
      ],
      limit: 24,
    },
    expected: {
      none: {
        throws:
          "bucket (on periodStart) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      postgres:
        'SELECT DATE_TRUNC(\'month\', "periodStart") AS month, "plan", SUM("amount") AS mrr FROM invoices WHERE "status" = {{ "paid" }} GROUP BY DATE_TRUNC(\'month\', "periodStart"), "plan" HAVING SUM("amount") > {{ 0 }} ORDER BY month DESC LIMIT 24;',
      redshift:
        'SELECT DATE_TRUNC(\'month\', "periodStart") AS month, "plan", SUM("amount") AS mrr FROM invoices WHERE "status" = {{ "paid" }} GROUP BY DATE_TRUNC(\'month\', "periodStart"), "plan" HAVING SUM("amount") > {{ 0 }} ORDER BY month DESC LIMIT 24;',
      mysql: {
        throws:
          "bucket (on periodStart) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      oracle: {
        throws:
          "bucket (on periodStart) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      other: {
        throws:
          "bucket (on periodStart) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
    },
  },
  {
    name: "bucket quarter and year with legacy aggregate",
    spec: {
      operation: "SELECT",
      table: "sales",
      aggregate: {
        fn: "avg",
        column: "total",
      },
      groupBy: [
        {
          column: "soldAt",
          bucket: "year",
          as: "yr",
        },
        {
          column: "soldAt",
          bucket: "quarter",
          as: "qtr",
        },
        {
          column: "soldAt",
          bucket: "day",
          as: "dy",
        },
      ],
    },
    expected: {
      none: {
        throws:
          "bucket (on soldAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      postgres:
        'SELECT DATE_TRUNC(\'year\', "soldAt") AS yr, DATE_TRUNC(\'quarter\', "soldAt") AS qtr, DATE_TRUNC(\'day\', "soldAt") AS dy, AVG("total") AS avg FROM sales GROUP BY DATE_TRUNC(\'year\', "soldAt"), DATE_TRUNC(\'quarter\', "soldAt"), DATE_TRUNC(\'day\', "soldAt");',
      redshift:
        'SELECT DATE_TRUNC(\'year\', "soldAt") AS yr, DATE_TRUNC(\'quarter\', "soldAt") AS qtr, DATE_TRUNC(\'day\', "soldAt") AS dy, AVG("total") AS avg FROM sales GROUP BY DATE_TRUNC(\'year\', "soldAt"), DATE_TRUNC(\'quarter\', "soldAt"), DATE_TRUNC(\'day\', "soldAt");',
      mysql: {
        throws:
          "bucket (on soldAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      oracle: {
        throws:
          "bucket (on soldAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      other: {
        throws:
          "bucket (on soldAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
    },
  },
  {
    name: "split with count and having ne empty",
    spec: {
      operation: "SELECT",
      table: "tickets",
      aggregate: {
        fn: "count",
      },
      groupBy: [
        {
          column: "tags",
          split: ",",
        },
      ],
      having: [
        {
          column: "tags",
          op: "ne",
          value: {
            literal: "",
          },
        },
      ],
      orderBy: [
        {
          column: "count",
          direction: "DESC",
        },
      ],
    },
    expected: {
      none: {
        throws:
          "split (on tags) is only available on a PostgreSQL datasource, which can unnest an array",
      },
      postgres:
        'SELECT TRIM(mcp_split.mcp_split_value) AS "tags", COUNT(*) AS count FROM tickets CROSS JOIN LATERAL unnest(string_to_array("tags", {{ "," }})) AS mcp_split(mcp_split_value) GROUP BY TRIM(mcp_split.mcp_split_value) HAVING TRIM(mcp_split.mcp_split_value) != {{ "" }} ORDER BY count DESC;',
      redshift: {
        throws:
          "split (on tags) is only available on a PostgreSQL datasource, which can unnest an array",
      },
      mysql: {
        throws:
          "split (on tags) is only available on a PostgreSQL datasource, which can unnest an array",
      },
      oracle: {
        throws:
          "split (on tags) is only available on a PostgreSQL datasource, which can unnest an array",
      },
      other: {
        throws:
          "split (on tags) is only available on a PostgreSQL datasource, which can unnest an array",
      },
    },
  },
  {
    name: "split with a filter, a plain group key and aggregates",
    spec: {
      operation: "SELECT",
      table: "app.tickets",
      filters: [
        {
          column: "open",
          op: "eq",
          value: {
            literal: true,
          },
        },
      ],
      aggregates: [
        {
          fn: "count",
          as: "n",
        },
      ],
      groupBy: [
        "team",
        {
          column: "labels",
          split: ";",
        },
      ],
      orderBy: [
        {
          column: "n",
          direction: "DESC",
        },
      ],
      limit: 20,
    },
    expected: {
      none: {
        throws:
          "split (on labels) is only available on a PostgreSQL datasource, which can unnest an array",
      },
      postgres:
        'SELECT "team", TRIM(mcp_split.mcp_split_value) AS "labels", COUNT(*) AS n FROM app.tickets CROSS JOIN LATERAL unnest(string_to_array("labels", {{ ";" }})) AS mcp_split(mcp_split_value) WHERE "open" = {{ true }} GROUP BY "team", TRIM(mcp_split.mcp_split_value) ORDER BY n DESC LIMIT 20;',
      redshift: {
        throws:
          "split (on labels) is only available on a PostgreSQL datasource, which can unnest an array",
      },
      mysql: {
        throws:
          "split (on labels) is only available on a PostgreSQL datasource, which can unnest an array",
      },
      oracle: {
        throws:
          "split (on labels) is only available on a PostgreSQL datasource, which can unnest an array",
      },
      other: {
        throws:
          "split (on labels) is only available on a PostgreSQL datasource, which can unnest an array",
      },
    },
  },
  {
    name: "INSERT with literals",
    spec: {
      operation: "INSERT",
      table: "users",
      values: [
        {
          column: "name",
          value: {
            literal: "Ada",
          },
        },
        {
          column: "age",
          value: {
            literal: 30,
          },
        },
        {
          column: "admin",
          value: {
            literal: false,
          },
        },
      ],
    },
    expected: {
      none: 'INSERT INTO users (name, age, admin) VALUES ({{ "Ada" }}, {{ 30 }}, {{ false }});',
      postgres:
        'INSERT INTO users (name, age, admin) VALUES ({{ "Ada" }}, {{ 30 }}, {{ false }});',
      redshift:
        'INSERT INTO users (name, age, admin) VALUES ({{ "Ada" }}, {{ 30 }}, {{ false }});',
      mysql:
        'INSERT INTO users (name, age, admin) VALUES ({{ "Ada" }}, {{ 30 }}, {{ false }});',
      oracle:
        'INSERT INTO users (name, age, admin) VALUES ({{ "Ada" }}, {{ 30 }}, {{ false }});',
      other:
        'INSERT INTO users (name, age, admin) VALUES ({{ "Ada" }}, {{ 30 }}, {{ false }});',
    },
  },
  {
    name: "INSERT into a schema table with widget values",
    spec: {
      operation: "INSERT",
      table: "crm.contacts",
      values: [
        {
          column: "email",
          value: {
            widget: "Email1",
            property: "text",
          },
        },
        {
          column: "note",
          value: {
            literal: null,
          },
        },
      ],
    },
    expected: {
      none: "INSERT INTO crm.contacts (email, note) VALUES ({{ Email1.text }}, {{ null }});",
      postgres:
        "INSERT INTO crm.contacts (email, note) VALUES ({{ Email1.text }}, {{ null }});",
      redshift:
        "INSERT INTO crm.contacts (email, note) VALUES ({{ Email1.text }}, {{ null }});",
      mysql:
        "INSERT INTO crm.contacts (email, note) VALUES ({{ Email1.text }}, {{ null }});",
      oracle:
        "INSERT INTO crm.contacts (email, note) VALUES ({{ Email1.text }}, {{ null }});",
      other:
        "INSERT INTO crm.contacts (email, note) VALUES ({{ Email1.text }}, {{ null }});",
    },
  },
  {
    name: "UPDATE with an eq filter",
    spec: {
      operation: "UPDATE",
      table: "users",
      values: [
        {
          column: "name",
          value: {
            widget: "Name1",
            property: "text",
          },
        },
      ],
      filters: [
        {
          column: "id",
          op: "eq",
          value: {
            widget: "Table1",
            property: "selectedRow.id",
          },
        },
      ],
    },
    expected: {
      none: "UPDATE users SET name = {{ Name1.text }} WHERE users.id = {{ Table1.selectedRow.id }};",
      postgres:
        'UPDATE users SET name = {{ Name1.text }} WHERE "id" = {{ Table1.selectedRow.id }};',
      redshift:
        'UPDATE users SET name = {{ Name1.text }} WHERE "id" = {{ Table1.selectedRow.id }};',
      mysql:
        "UPDATE users SET name = {{ Name1.text }} WHERE users.id = {{ Table1.selectedRow.id }};",
      oracle:
        "UPDATE users SET name = {{ Name1.text }} WHERE users.id = {{ Table1.selectedRow.id }};",
      other:
        "UPDATE users SET name = {{ Name1.text }} WHERE users.id = {{ Table1.selectedRow.id }};",
    },
  },
  {
    name: "UPDATE with anyOf, isNull and like exact",
    spec: {
      operation: "UPDATE",
      table: "tickets",
      values: [
        {
          column: "status",
          value: {
            literal: "closed",
          },
        },
      ],
      filters: [
        {
          column: "deletedAt",
          op: "isNull",
        },
        {
          anyOf: [
            {
              column: "code",
              op: "like",
              value: {
                literal: "A-1",
              },
              match: "exact",
            },
            {
              column: "id",
              op: "in",
              value: {
                widget: "Table1",
                property: "selectedRow.id",
              },
            },
          ],
        },
      ],
    },
    expected: {
      none: 'UPDATE tickets SET status = {{ "closed" }} WHERE tickets.deletedAt IS NULL AND (tickets.code LIKE {{ "A-1" }} OR tickets.id IN ({{ Table1.selectedRow.id }}));',
      postgres:
        'UPDATE tickets SET status = {{ "closed" }} WHERE "deletedat" IS NULL AND ("code" LIKE {{ "A-1" }} OR "id" IN ({{ Table1.selectedRow.id }}));',
      redshift:
        'UPDATE tickets SET status = {{ "closed" }} WHERE "deletedat" IS NULL AND ("code" LIKE {{ "A-1" }} OR "id" IN ({{ Table1.selectedRow.id }}));',
      mysql:
        'UPDATE tickets SET status = {{ "closed" }} WHERE tickets.deletedAt <=> NULL AND (tickets.code LIKE {{ "A-1" }} OR tickets.id IN ({{ Table1.selectedRow.id }}));',
      oracle:
        'UPDATE tickets SET status = {{ "closed" }} WHERE tickets.deletedAt IS NULL AND (tickets.code LIKE {{ "A-1" }} OR tickets.id IN ({{ Table1.selectedRow.id }}));',
      other:
        'UPDATE tickets SET status = {{ "closed" }} WHERE tickets.deletedAt IS NULL AND (tickets.code LIKE {{ "A-1" }} OR tickets.id IN ({{ Table1.selectedRow.id }}));',
    },
  },
  {
    name: "UPDATE with no filter",
    spec: {
      operation: "UPDATE",
      table: "settings",
      values: [
        {
          column: "theme",
          value: {
            literal: "dark",
          },
        },
      ],
    },
    expected: {
      none: 'UPDATE settings SET theme = {{ "dark" }};',
      postgres: 'UPDATE settings SET theme = {{ "dark" }};',
      redshift: 'UPDATE settings SET theme = {{ "dark" }};',
      mysql: 'UPDATE settings SET theme = {{ "dark" }};',
      oracle: 'UPDATE settings SET theme = {{ "dark" }};',
      other: 'UPDATE settings SET theme = {{ "dark" }};',
    },
  },
  {
    name: "DELETE with an eq filter",
    spec: {
      operation: "DELETE",
      table: "users",
      filters: [
        {
          column: "id",
          op: "eq",
          value: {
            widget: "Table1",
            property: "selectedRow.id",
          },
        },
      ],
    },
    expected: {
      none: "DELETE FROM users WHERE users.id = {{ Table1.selectedRow.id }};",
      postgres: 'DELETE FROM users WHERE "id" = {{ Table1.selectedRow.id }};',
      redshift: 'DELETE FROM users WHERE "id" = {{ Table1.selectedRow.id }};',
      mysql: "DELETE FROM users WHERE users.id = {{ Table1.selectedRow.id }};",
      oracle: "DELETE FROM users WHERE users.id = {{ Table1.selectedRow.id }};",
      other: "DELETE FROM users WHERE users.id = {{ Table1.selectedRow.id }};",
    },
  },
  {
    name: "DELETE with notNull and lte",
    spec: {
      operation: "DELETE",
      table: "audit.logs",
      filters: [
        {
          column: "archivedAt",
          op: "notNull",
        },
        {
          column: "createdAt",
          op: "lte",
          value: {
            widget: "Date1",
            property: "selectedDate",
          },
        },
      ],
    },
    expected: {
      none: "DELETE FROM audit.logs WHERE audit.logs.archivedAt IS NOT NULL AND audit.logs.createdAt <= {{ Date1.selectedDate }};",
      postgres:
        'DELETE FROM audit.logs WHERE "archivedat" IS NOT NULL AND "createdat" <= {{ Date1.selectedDate }};',
      redshift:
        'DELETE FROM audit.logs WHERE "archivedat" IS NOT NULL AND "createdat" <= {{ Date1.selectedDate }};',
      mysql:
        "DELETE FROM audit.logs WHERE NOT (audit.logs.archivedAt <=> NULL) AND audit.logs.createdAt <= {{ Date1.selectedDate }};",
      oracle:
        "DELETE FROM audit.logs WHERE audit.logs.archivedAt IS NOT NULL AND audit.logs.createdAt <= {{ Date1.selectedDate }};",
      other:
        "DELETE FROM audit.logs WHERE audit.logs.archivedAt IS NOT NULL AND audit.logs.createdAt <= {{ Date1.selectedDate }};",
    },
  },
  {
    name: "DELETE with no filter",
    spec: {
      operation: "DELETE",
      table: "tmp",
    },
    expected: {
      none: "DELETE FROM tmp;",
      postgres: "DELETE FROM tmp;",
      redshift: "DELETE FROM tmp;",
      mysql: "DELETE FROM tmp;",
      oracle: "DELETE FROM tmp;",
      other: "DELETE FROM tmp;",
    },
  },
  {
    name: "INSERT ignores plain columns",
    spec: {
      operation: "INSERT",
      table: "users",
      columns: ["id"],
      values: [
        {
          column: "name",
          value: {
            literal: "x",
          },
        },
      ],
    },
    expected: {
      none: 'INSERT INTO users (name) VALUES ({{ "x" }});',
      postgres: 'INSERT INTO users (name) VALUES ({{ "x" }});',
      redshift: 'INSERT INTO users (name) VALUES ({{ "x" }});',
      mysql: 'INSERT INTO users (name) VALUES ({{ "x" }});',
      oracle: 'INSERT INTO users (name) VALUES ({{ "x" }});',
      other: 'INSERT INTO users (name) VALUES ({{ "x" }});',
    },
  },
  {
    name: "having eq on a group column and lte on an aggregate",
    spec: {
      operation: "SELECT",
      table: "orders",
      aggregates: [
        {
          fn: "count",
          as: "n",
        },
        {
          fn: "sum",
          column: "amount",
          as: "total",
        },
      ],
      groupBy: ["region"],
      having: [
        {
          column: "region",
          op: "eq",
          value: {
            literal: "EU",
          },
        },
        {
          column: "total",
          op: "lte",
          value: {
            literal: 500,
          },
        },
      ],
    },
    expected: {
      none: 'SELECT "region", COUNT(*) AS n, SUM("amount") AS total FROM orders GROUP BY "region" HAVING "region" = {{ "EU" }} AND SUM("amount") <= {{ 500 }};',
      postgres:
        'SELECT "region", COUNT(*) AS n, SUM("amount") AS total FROM orders GROUP BY "region" HAVING "region" = {{ "EU" }} AND SUM("amount") <= {{ 500 }};',
      redshift:
        'SELECT "region", COUNT(*) AS n, SUM("amount") AS total FROM orders GROUP BY "region" HAVING "region" = {{ "EU" }} AND SUM("amount") <= {{ 500 }};',
      mysql:
        'SELECT region, COUNT(*) AS n, SUM(amount) AS total FROM orders GROUP BY region HAVING region = {{ "EU" }} AND SUM(amount) <= {{ 500 }};',
      oracle:
        'SELECT region, COUNT(*) AS n, SUM(amount) AS total FROM orders GROUP BY region HAVING region = {{ "EU" }} AND SUM(amount) <= {{ 500 }};',
      other:
        'SELECT "region", COUNT(*) AS n, SUM("amount") AS total FROM orders GROUP BY "region" HAVING "region" = {{ "EU" }} AND SUM("amount") <= {{ 500 }};',
    },
  },
  {
    name: "day bucket",
    spec: {
      operation: "SELECT",
      table: "events",
      aggregates: [
        {
          fn: "count",
          as: "events",
        },
      ],
      groupBy: [
        {
          column: "occurredAt",
          bucket: "day",
          as: "day",
        },
      ],
      orderBy: [
        {
          column: "day",
          direction: "DESC",
        },
      ],
    },
    expected: {
      none: {
        throws:
          "bucket (on occurredAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      postgres:
        "SELECT DATE_TRUNC('day', \"occurredAt\") AS day, COUNT(*) AS events FROM events GROUP BY DATE_TRUNC('day', \"occurredAt\") ORDER BY day DESC;",
      redshift:
        "SELECT DATE_TRUNC('day', \"occurredAt\") AS day, COUNT(*) AS events FROM events GROUP BY DATE_TRUNC('day', \"occurredAt\") ORDER BY day DESC;",
      mysql: {
        throws:
          "bucket (on occurredAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      oracle: {
        throws:
          "bucket (on occurredAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
      other: {
        throws:
          "bucket (on occurredAt) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC",
      },
    },
  },
  {
    name: "limit 1",
    spec: {
      operation: "SELECT",
      table: "users",
      columns: ["id"],
      limit: 1,
    },
    expected: {
      none: "SELECT id FROM users LIMIT 1;",
      postgres: "SELECT id FROM users LIMIT 1;",
      redshift: "SELECT id FROM users LIMIT 1;",
      mysql: "SELECT id FROM users LIMIT 1;",
      oracle: "SELECT id FROM users FETCH FIRST 1 ROWS ONLY;",
      other: "SELECT id FROM users LIMIT 1;",
    },
  },
  {
    name: "limit 1000",
    spec: {
      operation: "SELECT",
      table: "users",
      limit: 1000,
    },
    expected: {
      none: "SELECT * FROM users LIMIT 1000;",
      postgres: "SELECT * FROM users LIMIT 1000;",
      redshift: "SELECT * FROM users LIMIT 1000;",
      mysql: "SELECT * FROM users LIMIT 1000;",
      oracle: "SELECT * FROM users FETCH FIRST 1000 ROWS ONLY;",
      other: "SELECT * FROM users LIMIT 1000;",
    },
  },
  {
    name: "anyOf inside a DELETE",
    spec: {
      operation: "DELETE",
      table: "comments",
      filters: [
        {
          anyOf: [
            {
              column: "status",
              op: "eq",
              value: {
                literal: "spam",
              },
            },
            {
              column: "flagged",
              op: "eq",
              value: {
                literal: true,
              },
            },
          ],
        },
        {
          column: "postId",
          op: "eq",
          value: {
            widget: "Table1",
            property: "selectedRow.id",
          },
        },
      ],
    },
    expected: {
      none: 'DELETE FROM comments WHERE (comments.status = {{ "spam" }} OR comments.flagged = {{ true }}) AND comments.postId = {{ Table1.selectedRow.id }};',
      postgres:
        'DELETE FROM comments WHERE ("status" = {{ "spam" }} OR "flagged" = {{ true }}) AND "postid" = {{ Table1.selectedRow.id }};',
      redshift:
        'DELETE FROM comments WHERE ("status" = {{ "spam" }} OR "flagged" = {{ true }}) AND "postid" = {{ Table1.selectedRow.id }};',
      mysql:
        'DELETE FROM comments WHERE (comments.status = {{ "spam" }} OR comments.flagged = {{ true }}) AND comments.postId = {{ Table1.selectedRow.id }};',
      oracle:
        'DELETE FROM comments WHERE (comments.status = {{ "spam" }} OR comments.flagged = {{ true }}) AND comments.postId = {{ Table1.selectedRow.id }};',
      other:
        'DELETE FROM comments WHERE (comments.status = {{ "spam" }} OR comments.flagged = {{ true }}) AND comments.postId = {{ Table1.selectedRow.id }};',
    },
  },
  // APP-16506 catalog refusal: a pg_ name is refused on PostgreSQL and Redshift only.
  {
    name: "pg_ table",
    spec: {
      operation: "SELECT",
      table: "pg_user",
    },
    expected: {
      none: "SELECT * FROM pg_user;",
      postgres: {
        throws: CATALOG_MESSAGE("pg_user"),
      },
      redshift: {
        throws: CATALOG_MESSAGE("pg_user"),
      },
      mysql: "SELECT * FROM pg_user;",
      oracle: "SELECT * FROM pg_user;",
      other: "SELECT * FROM pg_user;",
    },
  },
  // APP-16506 catalog refusal: Redshift system tables (stl_, stv_, svv_, svl_) on Redshift only.
  {
    name: "Redshift stl_ table",
    spec: {
      operation: "SELECT",
      table: "stl_query",
    },
    expected: {
      none: "SELECT * FROM stl_query;",
      postgres: "SELECT * FROM stl_query;",
      redshift: {
        throws: CATALOG_MESSAGE("stl_query"),
      },
      mysql: "SELECT * FROM stl_query;",
      oracle: "SELECT * FROM stl_query;",
      other: "SELECT * FROM stl_query;",
    },
  },
  // APP-16506 catalog refusal: Oracle's SYSTEM schema, ignoring case, on Oracle only.
  {
    name: "Oracle SYSTEM schema",
    spec: {
      operation: "SELECT",
      table: "System.help",
    },
    expected: {
      none: "SELECT * FROM System.help;",
      postgres: "SELECT * FROM System.help;",
      redshift: "SELECT * FROM System.help;",
      mysql: "SELECT * FROM System.help;",
      oracle: {
        throws: CATALOG_MESSAGE("System.help"),
      },
      other: "SELECT * FROM System.help;",
    },
  },
];

const GOLDEN_REFUSALS = [
  // APP-16506 catalog refusal: system schemas, ignoring case, on every database.
  {
    name: "information_schema table",
    spec: {
      operation: "SELECT",
      table: "information_schema.tables",
    },
    issues: [
      {
        path: ["table"],
        message: CATALOG_MESSAGE("information_schema.tables"),
      },
    ],
  },
  {
    name: "upper-case pg_catalog table",
    spec: {
      operation: "SELECT",
      table: "PG_CATALOG.pg_class",
    },
    issues: [
      {
        path: ["table"],
        message: CATALOG_MESSAGE("PG_CATALOG.pg_class"),
      },
    ],
  },
  {
    name: "sys schema in a three-part name",
    spec: {
      operation: "DELETE",
      table: "master.sys.objects",
    },
    issues: [
      {
        path: ["table"],
        message: CATALOG_MESSAGE("master.sys.objects"),
      },
    ],
  },
  {
    name: "table missing",
    spec: {
      operation: "SELECT",
    },
    issues: [
      {
        path: ["table"],
        message: "Required",
      },
    ],
  },
  {
    name: "unsafe table name",
    spec: {
      operation: "SELECT",
      table: "users; DROP TABLE x",
    },
    issues: [
      {
        path: ["table"],
        message: "must be table or schema.table (plain identifiers)",
      },
    ],
  },
  {
    name: "unsafe column in columns",
    spec: {
      operation: "SELECT",
      table: "users",
      columns: ["id, password"],
    },
    issues: [
      {
        path: ["columns", 0],
        message: "must be a plain SQL identifier",
      },
    ],
  },
  {
    name: "unsafe filter column",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "a.b",
          op: "eq",
          value: {
            literal: 1,
          },
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "column"],
        message: "must be a plain SQL identifier",
      },
    ],
  },
  {
    name: "unknown filter op",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "a",
          op: "between",
          value: {
            literal: 1,
          },
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "op"],
        message:
          "Invalid enum value. Expected 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'inList' | 'isNull' | 'notNull', received 'between'",
      },
    ],
  },
  {
    name: "template syntax in a literal",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "a",
          op: "eq",
          value: {
            literal: "{{ evil() }}",
          },
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "value", "literal"],
        message: "no template syntax",
      },
    ],
  },
  {
    name: "limit over the cap",
    spec: {
      operation: "SELECT",
      table: "users",
      limit: 1001,
    },
    issues: [
      {
        path: ["limit"],
        message: "Number must be less than or equal to 1000",
      },
    ],
  },
  {
    name: "lower-case orderBy direction",
    spec: {
      operation: "SELECT",
      table: "users",
      orderBy: [
        {
          column: "id",
          direction: "asc",
        },
      ],
    },
    issues: [
      {
        path: ["orderBy", 0, "direction"],
        message: "Invalid enum value. Expected 'ASC' | 'DESC', received 'asc'",
      },
    ],
  },
  {
    name: "reserved word as a result name",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
          as: "select",
        },
      ],
    },
    issues: [
      {
        path: ["aggregates", 0, "as"],
        message: '"select" is a reserved SQL word; pick another name',
      },
    ],
  },
  {
    name: "bucket without as",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
        },
      ],
      groupBy: [
        {
          column: "createdAt",
          bucket: "week",
        },
      ],
    },
    issues: [
      {
        path: ["groupBy", 0, "as"],
        message:
          'bucket needs as, the name of its result column (such as "week")',
      },
    ],
  },
  {
    name: "having without an aggregate",
    spec: {
      operation: "SELECT",
      table: "users",
      having: [
        {
          column: "x",
          op: "eq",
          value: {
            literal: 1,
          },
        },
      ],
    },
    issues: [
      {
        path: ["having"],
        message: "having needs an aggregate",
      },
    ],
  },
  {
    name: "match on eq",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "a",
          op: "eq",
          value: {
            literal: "x",
          },
          match: "contains",
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "match"],
        message: "match is only valid with like or ilike",
      },
    ],
  },
  {
    name: "inList with a literal",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "a",
          op: "inList",
          value: {
            literal: "x",
          },
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "value"],
        message:
          "inList needs a { widget, property } value that holds a list (e.g. a multi-select's selectedOptionValues)",
      },
    ],
  },
  {
    name: "skipWhenEmpty on appsmith.*",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "owner",
          op: "eq",
          value: {
            widget: "appsmith",
            property: "user.email",
          },
          skipWhenEmpty: true,
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "skipWhenEmpty"],
        message:
          "skipWhenEmpty cannot be used on an appsmith.* value — it may be scoping rows to the viewer",
      },
    ],
  },
  {
    name: "skipWhenEmpty inside anyOf",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          anyOf: [
            {
              column: "a",
              op: "eq",
              value: {
                widget: "S",
                property: "text",
              },
              skipWhenEmpty: true,
            },
            {
              column: "b",
              op: "eq",
              value: {
                literal: 1,
              },
            },
          ],
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "anyOf", 0, "skipWhenEmpty"],
        message:
          "skipWhenEmpty cannot be used inside anyOf: in an OR, a skipped member would match every row",
      },
    ],
  },
  {
    name: "orderBy on a write",
    spec: {
      operation: "DELETE",
      table: "users",
      orderBy: [
        {
          column: "id",
          direction: "ASC",
        },
      ],
    },
    issues: [
      {
        path: ["orderBy"],
        message: "orderBy is only valid on a SELECT query",
      },
    ],
  },
  {
    name: "wildcard like on a write",
    spec: {
      operation: "DELETE",
      table: "users",
      filters: [
        {
          column: "a",
          op: "like",
          value: {
            literal: "x",
          },
          match: "contains",
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "match"],
        message:
          'a wildcard match is only valid on a SELECT query (an empty value would match every row); use match: "exact" on a write',
      },
    ],
  },
  {
    name: "distinct without columns",
    spec: {
      operation: "SELECT",
      table: "users",
      distinct: true,
    },
    issues: [
      {
        path: ["distinct"],
        message: "distinct needs a non-empty columns list",
      },
    ],
  },
  {
    name: "aggregate and aggregates together",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregate: {
        fn: "count",
      },
      aggregates: [
        {
          fn: "count",
          as: "n",
        },
      ],
    },
    issues: [
      {
        path: ["aggregates"],
        message: "use aggregate or aggregates, not both",
      },
    ],
  },
  {
    name: "having on a bucket",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
        },
      ],
      groupBy: [
        {
          column: "createdAt",
          bucket: "week",
          as: "week",
        },
      ],
      having: [
        {
          column: "week",
          op: "gt",
          value: {
            literal: 1,
          },
        },
      ],
    },
    issues: [
      {
        path: ["having", 0, "column"],
        message:
          "having cannot test a bucket or its column (createdAt); filter createdAt in filters instead",
      },
    ],
  },
  {
    name: "split in columns",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregate: {
        fn: "count",
      },
      columns: [
        {
          column: "tags",
          split: ",",
        },
      ],
      groupBy: ["team"],
    },
    issues: [
      {
        path: ["columns", 0, "coalesce"],
        message:
          "coalesce in columns is ignored when an aggregate is set; put the column in groupBy instead",
      },
      {
        path: ["columns", 0, "split"],
        message: "split is only valid in groupBy",
      },
    ],
  },
  {
    name: "anyOf nested inside anyOf",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          anyOf: [
            {
              anyOf: [
                {
                  column: "a",
                  op: "eq",
                  value: {
                    literal: 1,
                  },
                },
                {
                  column: "b",
                  op: "eq",
                  value: {
                    literal: 2,
                  },
                },
              ],
            },
            {
              column: "c",
              op: "eq",
              value: {
                literal: 3,
              },
            },
          ],
        },
      ],
    },
    issues: [
      {
        path: ["filters", 0, "anyOf", 0, "column"],
        message: "Required",
      },
      {
        path: ["filters", 0, "anyOf", 0, "op"],
        message: "Required",
      },
      {
        path: ["filters", 0, "anyOf", 0],
        message: "Unrecognized key(s) in object: 'anyOf'",
      },
    ],
  },
];

const GOLDEN_FAIL_CLOSED = [
  // APP-16506 catalog refusal, for a caller that skipped parsing.
  {
    name: "information_schema table in an unparsed spec",
    spec: {
      operation: "SELECT",
      table: "information_schema.columns",
    },
    throws: CATALOG_MESSAGE("information_schema.columns"),
  },
  {
    name: "unsafe orderBy column",
    spec: {
      operation: "SELECT",
      table: "users",
      orderBy: [
        {
          column: "id; DROP TABLE x",
          direction: "ASC",
        },
      ],
    },
    throws: 'unsafe identifier: "id; DROP TABLE x"',
  },
  {
    name: "unsafe groupBy column",
    dialect: "postgres",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregate: {
        fn: "count",
      },
      groupBy: ['a" OR 1=1 --'],
    },
    throws: 'unsafe identifier: "a\\" OR 1=1 --"',
  },
  {
    name: "unsafe aggregate column",
    dialect: "mysql",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregate: {
        fn: "sum",
        column: "1); DROP TABLE x; --",
      },
    },
    throws: 'unsafe identifier: "1); DROP TABLE x; --"',
  },
  {
    name: "unknown aggregate fn",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "constructor",
          column: "a",
        },
      ],
    },
    throws: 'unknown aggregate fn "constructor"',
  },
  {
    name: "invalid result name",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
          as: "x FROM y",
        },
      ],
    },
    throws: 'invalid result name: "x FROM y"',
  },
  {
    name: "split result name as an aggregate as",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
          as: "mcp_split",
        },
      ],
    },
    throws: 'invalid result name: "mcp_split"',
  },
  {
    name: "both aggregate forms",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregate: {
        fn: "count",
      },
      aggregates: [
        {
          fn: "count",
        },
      ],
    },
    throws: "use aggregate or aggregates, not both",
  },
  {
    name: "distinct without columns",
    spec: {
      operation: "SELECT",
      table: "users",
      distinct: true,
    },
    throws: "distinct needs a non-empty columns list",
  },
  {
    name: "distinct with groupBy",
    spec: {
      operation: "SELECT",
      table: "users",
      distinct: true,
      columns: ["a"],
      groupBy: ["a"],
    },
    throws: "distinct cannot be used with aggregate, aggregates or groupBy",
  },
  {
    name: "skipWhenEmpty inside anyOf",
    spec: {
      operation: "DELETE",
      table: "users",
      filters: [
        {
          anyOf: [
            {
              column: "a",
              op: "eq",
              value: {
                widget: "S",
                property: "text",
              },
              skipWhenEmpty: true,
            },
            {
              column: "b",
              op: "eq",
              value: {
                literal: 1,
              },
            },
          ],
        },
      ],
    },
    throws:
      "skipWhenEmpty cannot be used inside anyOf: in an OR, a skipped member would match every row",
  },
  {
    name: "filter without a value",
    spec: {
      operation: "DELETE",
      table: "users",
      filters: [
        {
          column: "id",
          op: "eq",
        },
      ],
    },
    throws: "filter on id needs a value for eq",
  },
  {
    name: "inList with a literal",
    dialect: "postgres",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "id",
          op: "inList",
          value: {
            literal: "x",
          },
        },
      ],
    },
    throws: "filter on id needs a { widget, property } value for inList",
  },
  {
    name: "skipWhenEmpty with a literal",
    dialect: "postgres",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "id",
          op: "eq",
          value: {
            literal: "x",
          },
          skipWhenEmpty: true,
        },
      ],
    },
    throws: "filter on id needs a { widget, property } value for skipWhenEmpty",
  },
  {
    name: "wildcard match on a number literal",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "a",
          op: "like",
          value: {
            literal: 5,
          },
          match: "contains",
        },
      ],
    },
    throws: 'match "contains" needs a string literal',
  },
  {
    name: "having without an aggregate",
    spec: {
      operation: "SELECT",
      table: "users",
      having: [
        {
          column: "a",
          op: "eq",
          value: {
            literal: 1,
          },
        },
      ],
    },
    throws: "having needs an aggregate",
  },
  {
    name: "having on a bucket",
    dialect: "postgres",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
        },
      ],
      groupBy: [
        {
          column: "createdAt",
          bucket: "week",
          as: "week",
        },
      ],
      having: [
        {
          column: "week",
          op: "gt",
          value: {
            literal: 1,
          },
        },
      ],
    },
    throws:
      "having cannot test a bucket or its column (createdAt); filter createdAt in filters instead",
  },
  {
    name: "unknown having op",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregate: {
        fn: "count",
      },
      having: [
        {
          column: "count",
          op: "like",
          value: {
            literal: 1,
          },
        },
      ],
    },
    throws: 'unknown having op "like"',
  },
  {
    name: "unknown bucket unit",
    dialect: "postgres",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
        },
      ],
      groupBy: [
        {
          column: "createdAt",
          bucket: "hour",
          as: "h",
        },
      ],
    },
    throws: 'unknown bucket "hour"',
  },
  {
    name: "bucket without as",
    dialect: "postgres",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
        },
      ],
      groupBy: [
        {
          column: "createdAt",
          bucket: "week",
        },
      ],
    },
    throws: "invalid result name: undefined",
  },
  {
    name: "split in columns",
    spec: {
      operation: "SELECT",
      table: "users",
      columns: [
        {
          column: "tags",
          split: ",",
        },
      ],
    },
    throws: "split is only valid in groupBy",
  },
  {
    name: "bucket in columns",
    spec: {
      operation: "SELECT",
      table: "users",
      columns: [
        {
          column: "at",
          bucket: "week",
          as: "w",
        },
      ],
    },
    throws: "bucket is only valid in groupBy",
  },
  {
    name: "abs on count",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
          column: "a",
          abs: true,
        },
      ],
    },
    throws: "abs is not valid with count",
  },
  {
    name: "round on count",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "count",
          round: "floor",
        },
      ],
    },
    throws: "round is only valid with sum or avg",
  },
  {
    name: "round on min",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "min",
          column: "a",
          round: "floor",
        },
      ],
    },
    throws: "round is only valid with sum or avg",
  },
  {
    name: "sum without a column",
    spec: {
      operation: "SELECT",
      table: "users",
      aggregates: [
        {
          fn: "sum",
        },
      ],
    },
    throws: "sum aggregation requires a column",
  },
  {
    name: "unsafe widget name",
    spec: {
      operation: "SELECT",
      table: "users",
      filters: [
        {
          column: "a",
          op: "eq",
          value: {
            widget: "x }} {{ y",
            property: "text",
          },
        },
      ],
    },
    throws: "unsafe binding emitted: {{ x }} {{ y.text }}",
  },
  {
    name: "INSERT without values",
    spec: {
      operation: "INSERT",
      table: "users",
    },
    throws: "INSERT requires values",
  },
  {
    name: "UPDATE without values",
    spec: {
      operation: "UPDATE",
      table: "users",
      values: [],
    },
    throws: "UPDATE requires values",
  },
];

const GOLDEN_DTOS = [
  {
    name: "SELECT, no plugin",
    operation: "SELECT",
    expected: {
      name: "getRows",
      pageId: "p1",
      datasource: {
        id: "ds1",
      },
      executeOnLoad: true,
      actionConfiguration: {
        body: "SELECT * FROM users LIMIT 5;",
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
      },
    },
  },
  {
    name: "SELECT, postgres-plugin",
    operation: "SELECT",
    packageName: "postgres-plugin",
    expected: {
      name: "getRows",
      pageId: "p1",
      datasource: {
        id: "ds1",
      },
      executeOnLoad: true,
      actionConfiguration: {
        body: "SELECT * FROM users LIMIT 5;",
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
      },
    },
  },
  {
    name: "SELECT, mysql-plugin",
    operation: "SELECT",
    packageName: "mysql-plugin",
    expected: {
      name: "getRows",
      pageId: "p1",
      datasource: {
        id: "ds1",
      },
      executeOnLoad: true,
      actionConfiguration: {
        body: "SELECT * FROM users LIMIT 5;",
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
      },
    },
  },
  {
    name: "SELECT, oracle-plugin",
    operation: "SELECT",
    packageName: "oracle-plugin",
    expected: {
      name: "getRows",
      pageId: "p1",
      datasource: {
        id: "ds1",
      },
      executeOnLoad: true,
      actionConfiguration: {
        formData: {
          body: {
            data: "SELECT * FROM users FETCH FIRST 5 ROWS ONLY;",
          },
          preparedStatement: {
            data: true,
          },
        },
      },
    },
  },
  {
    name: "DELETE, oracle-plugin",
    operation: "DELETE",
    packageName: "oracle-plugin",
    expected: {
      name: "getRows",
      pageId: "p1",
      datasource: {
        id: "ds1",
      },
      executeOnLoad: false,
      actionConfiguration: {
        formData: {
          body: {
            data: "DELETE FROM users WHERE users.id = {{ 1 }};",
          },
          preparedStatement: {
            data: true,
          },
        },
      },
    },
  },
  {
    name: "DELETE, mssql-plugin",
    operation: "DELETE",
    packageName: "mssql-plugin",
    expected: {
      name: "getRows",
      pageId: "p1",
      datasource: {
        id: "ds1",
      },
      executeOnLoad: false,
      actionConfiguration: {
        body: "DELETE FROM users WHERE users.id = {{ 1 }};",
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
      },
    },
  },
];

describe("APP-16506 golden: compiled bodies stay the same", () => {
  it.each(GOLDEN_CASES)("$name", ({ expected, spec }) => {
    expect(compileForEveryDialect(spec)).toEqual(expected);
  });
});

describe("APP-16506 golden: querySpecSchema refusals stay the same", () => {
  it.each(GOLDEN_REFUSALS)("$name", ({ issues, spec }) => {
    const result = querySpecSchema.safeParse({ ...base, ...spec });

    expect(result.success).toBe(false);
    expect(
      result.success
        ? []
        : result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
    ).toEqual(issues);
  });
});

// Specs built by hand, without querySpecSchema. The compiler must still refuse each one, with the same message.
describe("APP-16506 golden: the compiler fails closed on unparsed specs", () => {
  it.each(GOLDEN_FAIL_CLOSED)("$name", (entry) => {
    const spec = { ...base, ...entry.spec } as unknown as QuerySpec;
    const options =
      "dialect" in entry ? { dialect: entry.dialect as SqlDialect } : undefined;

    expect(() => compileQuery(spec, options)).toThrow(new Error(entry.throws));
  });
});

describe("APP-16506 golden: buildActionDto stays the same", () => {
  it.each(GOLDEN_DTOS)("$name", (entry) => {
    const spec = querySpecSchema.parse({
      ...base,
      ...(entry.operation === "SELECT"
        ? { operation: "SELECT", table: "users", limit: 5 }
        : {
            operation: "DELETE",
            table: "users",
            filters: [{ column: "id", op: "eq", value: { literal: 1 } }],
          }),
    });
    const packageName = "packageName" in entry ? entry.packageName : undefined;
    const body = compileQuery(spec, {
      dialect: sqlDialectFor(packageName),
    });

    expect(buildActionDto(spec, body, packageName)).toEqual(entry.expected);
  });
});

// APP-16506 B: queries with `from` and `joins`, compiled as the tools compile them, with the plugin's package name.
// Only the five plugins that bind every value accept them. `none` is a call with no options, as EE workflow queries
// make before the datasource is known.
const PLUGINS = [
  "postgres-plugin",
  "mysql-plugin",
  "mariadb-plugin",
  "oracle-plugin",
  "mssql-plugin",
  "redshift-plugin",
  "snowflake-plugin",
] as const;

type PluginOutcomes = Record<"none" | (typeof PLUGINS)[number], Outcome>;

const ALIASED_MODE_MESSAGE =
  "from and joins need a PostgreSQL, MySQL, MariaDB, Oracle or SQL Server datasource that the server can identify. Redshift and Snowflake are not supported: their plugins put values into the SQL text instead of binding them";

function compileForEveryPlugin(spec: Record<string, unknown>): PluginOutcomes {
  const parsed = querySpecSchema.parse({ ...base, ...spec });
  const outcomes = {
    none: outcome(() => compileQuery(parsed)),
  } as PluginOutcomes;

  for (const packageName of PLUGINS) {
    outcomes[packageName] = outcome(() =>
      compileQuery(parsed, {
        dialect: sqlDialectFor(packageName),
        packageName,
      }),
    );
  }

  return outcomes;
}

const GOLDEN_PLUGIN_CASES = [
  {
    name: "left join on two pairs, coalesce, notNull and a viewer filter",
    spec: {
      operation: "SELECT",
      from: { table: "sales.orders", as: "o" },
      joins: [
        {
          type: "left",
          table: "sales.customers",
          as: "c",
          on: [
            { left: "c.id", right: "o.customer_id" },
            { left: "c.region", right: "o.region" },
          ],
        },
      ],
      columns: [
        "o.id",
        { column: "c.name", as: "customer" },
        { column: "c.tier", coalesce: { literal: "none" } },
      ],
      filters: [
        { column: "o.total", op: "gte", value: { literal: 100 } },
        { column: "c.email", op: "notNull" },
        {
          column: "o.owner",
          op: "eq",
          value: { widget: "appsmith", property: "user.email" },
        },
      ],
      orderBy: [{ column: "customer", direction: "ASC" }],
      limit: 25,
    },
    expected: {
      none: { throws: ALIASED_MODE_MESSAGE },
      "postgres-plugin":
        'SELECT o."id" AS id, c."name" AS customer, COALESCE(c."tier", {{ "none" }}) AS tier FROM (SELECT "customer_id", "region", "id", "total", "owner" FROM sales.orders) o LEFT JOIN (SELECT "id", "region", "name", "tier", "email" FROM sales.customers) c ON c."id" = o."customer_id" AND c."region" = o."region" WHERE o."total" >= {{ 100 }} AND c."email" IS NOT NULL AND o."owner" = {{ appsmith.user.email }} ORDER BY customer ASC LIMIT 25;',
      "mysql-plugin":
        'SELECT o.id AS id, c.name AS customer, COALESCE(c.tier, {{ "none" }}) AS tier FROM sales.orders o LEFT JOIN sales.customers c ON c.id = o.customer_id AND c.region = o.region WHERE o.total >= {{ 100 }} AND NOT (c.email <=> NULL) AND o.owner = {{ appsmith.user.email }} ORDER BY customer ASC LIMIT 25;',
      "mariadb-plugin":
        'SELECT o.id AS id, c.name AS customer, COALESCE(c.tier, {{ "none" }}) AS tier FROM sales.orders o LEFT JOIN sales.customers c ON c.id = o.customer_id AND c.region = o.region WHERE o.total >= {{ 100 }} AND NOT (c.email <=> NULL) AND o.owner = {{ appsmith.user.email }} ORDER BY customer ASC LIMIT 25;',
      "oracle-plugin":
        'SELECT o.id AS id, c.name AS customer, COALESCE(c.tier, {{ "none" }}) AS tier FROM sales.orders o LEFT JOIN sales.customers c ON c.id = o.customer_id AND c.region = o.region WHERE o.total >= {{ 100 }} AND c.email IS NOT NULL AND o.owner = {{ appsmith.user.email }} ORDER BY customer ASC FETCH FIRST 25 ROWS ONLY;',
      "mssql-plugin":
        'SELECT TOP (25) o."id" AS id, c."name" AS customer, COALESCE(c."tier", {{ "none" }}) AS tier FROM sales.orders o LEFT JOIN sales.customers c ON c."id" = o."customer_id" AND c."region" = o."region" WHERE o."total" >= {{ 100 }} AND c."email" IS NOT NULL AND o."owner" = {{ appsmith.user.email }} ORDER BY customer ASC;',
      "redshift-plugin": { throws: ALIASED_MODE_MESSAGE },
      "snowflake-plugin": { throws: ALIASED_MODE_MESSAGE },
    },
  },
  {
    name: "inner join with groupBy, aggregates and having",
    spec: {
      operation: "SELECT",
      from: { table: "orders", as: "o" },
      joins: [
        {
          type: "inner",
          table: "items",
          as: "i",
          on: [{ left: "i.order_id", right: "o.id" }],
        },
      ],
      groupBy: [{ column: "o.status", as: "status" }],
      aggregates: [
        { fn: "count", as: "line_count" },
        { fn: "avg", column: "i.price", round: "floor", as: "avg_price" },
      ],
      having: [{ column: "line_count", op: "gte", value: { literal: 2 } }],
      orderBy: [{ column: "line_count", direction: "DESC" }],
      limit: 100,
    },
    expected: {
      none: { throws: ALIASED_MODE_MESSAGE },
      "postgres-plugin":
        'SELECT o."status" AS status, COUNT(*) AS line_count, FLOOR(AVG(i."price")) AS avg_price FROM (SELECT "id", "status" FROM orders) o INNER JOIN (SELECT "order_id", "price" FROM items) i ON i."order_id" = o."id" GROUP BY o."status" HAVING COUNT(*) >= {{ 2 }} ORDER BY line_count DESC LIMIT 100;',
      "mysql-plugin":
        "SELECT o.status AS status, COUNT(*) AS line_count, FLOOR(AVG(i.price)) AS avg_price FROM orders o INNER JOIN items i ON i.order_id = o.id GROUP BY o.status HAVING COUNT(*) >= {{ 2 }} ORDER BY line_count DESC LIMIT 100;",
      "mariadb-plugin":
        "SELECT o.status AS status, COUNT(*) AS line_count, FLOOR(AVG(i.price)) AS avg_price FROM orders o INNER JOIN items i ON i.order_id = o.id GROUP BY o.status HAVING COUNT(*) >= {{ 2 }} ORDER BY line_count DESC LIMIT 100;",
      "oracle-plugin":
        "SELECT o.status AS status, COUNT(*) AS line_count, FLOOR(AVG(i.price)) AS avg_price FROM orders o INNER JOIN items i ON i.order_id = o.id GROUP BY o.status HAVING COUNT(*) >= {{ 2 }} ORDER BY line_count DESC FETCH FIRST 100 ROWS ONLY;",
      "mssql-plugin":
        'SELECT TOP (100) o."status" AS status, COUNT(*) AS line_count, FLOOR(AVG(i."price")) AS avg_price FROM orders o INNER JOIN items i ON i."order_id" = o."id" GROUP BY o."status" HAVING COUNT(*) >= {{ 2 }} ORDER BY line_count DESC;',
      "redshift-plugin": { throws: ALIASED_MODE_MESSAGE },
      "snowflake-plugin": { throws: ALIASED_MODE_MESSAGE },
    },
  },
  {
    name: "mixed-case columns keep their case",
    spec: {
      operation: "SELECT",
      from: { table: "orders", as: "o" },
      joins: [
        {
          type: "inner",
          table: "customers",
          as: "c",
          on: [{ left: "c.id", right: "o.customerId" }],
        },
      ],
      columns: [
        { column: "o.createdAt", as: "created_at" },
        { column: "c.fullName", as: "full_name" },
      ],
      orderBy: [{ column: "created_at", direction: "DESC" }],
      limit: 10,
    },
    expected: {
      none: { throws: ALIASED_MODE_MESSAGE },
      "postgres-plugin":
        'SELECT o."createdAt" AS created_at, c."fullName" AS full_name FROM (SELECT "customerId", "createdAt" FROM orders) o INNER JOIN (SELECT "id", "fullName" FROM customers) c ON c."id" = o."customerId" ORDER BY created_at DESC LIMIT 10;',
      "mysql-plugin":
        "SELECT o.createdAt AS created_at, c.fullName AS full_name FROM orders o INNER JOIN customers c ON c.id = o.customerId ORDER BY created_at DESC LIMIT 10;",
      "mariadb-plugin":
        "SELECT o.createdAt AS created_at, c.fullName AS full_name FROM orders o INNER JOIN customers c ON c.id = o.customerId ORDER BY created_at DESC LIMIT 10;",
      "oracle-plugin":
        "SELECT o.createdAt AS created_at, c.fullName AS full_name FROM orders o INNER JOIN customers c ON c.id = o.customerId ORDER BY created_at DESC FETCH FIRST 10 ROWS ONLY;",
      "mssql-plugin":
        'SELECT TOP (10) o."createdAt" AS created_at, c."fullName" AS full_name FROM orders o INNER JOIN customers c ON c."id" = o."customerId" ORDER BY created_at DESC;',
      "redshift-plugin": { throws: ALIASED_MODE_MESSAGE },
      "snowflake-plugin": { throws: ALIASED_MODE_MESSAGE },
    },
  },
  // APP-16506 C: CASE in columns, with a condition group and a column operand.
  {
    name: "CASE column",
    spec: {
      operation: "SELECT",
      from: { table: "orders", as: "o" },
      columns: [
        "o.id",
        {
          case: {
            when: [
              {
                if: [
                  { column: "o.total", op: "gte", value: { literal: 1000 } },
                ],
                then: { literal: "large" },
              },
              {
                if: [
                  { column: "o.total", op: "isNull" },
                  {
                    anyOf: [
                      {
                        column: "o.status",
                        op: "eq",
                        value: { literal: "new" },
                      },
                      { column: "o.status", op: "isNull" },
                    ],
                  },
                ],
                then: { column: "o.status" },
              },
            ],
            else: { literal: "small" },
          },
          as: "order_band",
        },
      ],
      limit: 50,
    },
    expected: {
      none: { throws: ALIASED_MODE_MESSAGE },
      "postgres-plugin":
        'SELECT o."id" AS id, CASE WHEN o."total" >= {{ 1000 }} THEN {{ "large" }} WHEN o."total" IS NULL AND (o."status" = {{ "new" }} OR o."status" IS NULL) THEN o."status" ELSE {{ "small" }} END AS order_band FROM (SELECT "id", "total", "status" FROM orders) o LIMIT 50;',
      "mysql-plugin":
        'SELECT o.id AS id, CASE WHEN o.total >= {{ 1000 }} THEN {{ "large" }} WHEN o.total <=> NULL AND (o.status = {{ "new" }} OR o.status <=> NULL) THEN o.status ELSE {{ "small" }} END AS order_band FROM orders o LIMIT 50;',
      "mariadb-plugin":
        'SELECT o.id AS id, CASE WHEN o.total >= {{ 1000 }} THEN {{ "large" }} WHEN o.total <=> NULL AND (o.status = {{ "new" }} OR o.status <=> NULL) THEN o.status ELSE {{ "small" }} END AS order_band FROM orders o LIMIT 50;',
      "oracle-plugin":
        'SELECT o.id AS id, CASE WHEN o.total >= {{ 1000 }} THEN {{ "large" }} WHEN o.total IS NULL AND (o.status = {{ "new" }} OR o.status IS NULL) THEN o.status ELSE {{ "small" }} END AS order_band FROM orders o FETCH FIRST 50 ROWS ONLY;',
      "mssql-plugin":
        'SELECT TOP (50) o."id" AS id, CASE WHEN o."total" >= {{ 1000 }} THEN {{ "large" }} WHEN o."total" IS NULL AND (o."status" = {{ "new" }} OR o."status" IS NULL) THEN o."status" ELSE {{ "small" }} END AS order_band FROM orders o;',
      "redshift-plugin": { throws: ALIASED_MODE_MESSAGE },
      "snowflake-plugin": { throws: ALIASED_MODE_MESSAGE },
    },
  },
  // APP-16506 C: CASE as an aggregate input, repeated in HAVING.
  {
    name: "CASE aggregate inputs with having",
    spec: {
      operation: "SELECT",
      from: { table: "orders", as: "o" },
      groupBy: ["o.region"],
      aggregates: [
        {
          fn: "sum",
          case: {
            when: [
              {
                if: [
                  { column: "o.status", op: "eq", value: { literal: "paid" } },
                ],
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
    },
    expected: {
      none: { throws: ALIASED_MODE_MESSAGE },
      "postgres-plugin":
        'SELECT o."region" AS region, SUM(CASE WHEN o."status" = {{ "paid" }} THEN o."total" ELSE {{ 0 }} END) AS paid_total, COUNT(CASE WHEN o."refunded" IS NOT NULL THEN {{ 1 }} END) AS refunds FROM (SELECT "region", "status", "total", "refunded" FROM orders) o GROUP BY o."region" HAVING SUM(CASE WHEN o."status" = {{ "paid" }} THEN o."total" ELSE {{ 0 }} END) > {{ 0 }} ORDER BY paid_total DESC LIMIT 20;',
      "mysql-plugin":
        'SELECT o.region AS region, SUM(CASE WHEN o.status = {{ "paid" }} THEN o.total ELSE {{ 0 }} END) AS paid_total, COUNT(CASE WHEN NOT (o.refunded <=> NULL) THEN {{ 1 }} END) AS refunds FROM orders o GROUP BY o.region HAVING SUM(CASE WHEN o.status = {{ "paid" }} THEN o.total ELSE {{ 0 }} END) > {{ 0 }} ORDER BY paid_total DESC LIMIT 20;',
      "mariadb-plugin":
        'SELECT o.region AS region, SUM(CASE WHEN o.status = {{ "paid" }} THEN o.total ELSE {{ 0 }} END) AS paid_total, COUNT(CASE WHEN NOT (o.refunded <=> NULL) THEN {{ 1 }} END) AS refunds FROM orders o GROUP BY o.region HAVING SUM(CASE WHEN o.status = {{ "paid" }} THEN o.total ELSE {{ 0 }} END) > {{ 0 }} ORDER BY paid_total DESC LIMIT 20;',
      "oracle-plugin":
        'SELECT o.region AS region, SUM(CASE WHEN o.status = {{ "paid" }} THEN o.total ELSE {{ 0 }} END) AS paid_total, COUNT(CASE WHEN o.refunded IS NOT NULL THEN {{ 1 }} END) AS refunds FROM orders o GROUP BY o.region HAVING SUM(CASE WHEN o.status = {{ "paid" }} THEN o.total ELSE {{ 0 }} END) > {{ 0 }} ORDER BY paid_total DESC FETCH FIRST 20 ROWS ONLY;',
      "mssql-plugin":
        'SELECT TOP (20) o."region" AS region, SUM(CASE WHEN o."status" = {{ "paid" }} THEN o."total" ELSE {{ 0 }} END) AS paid_total, COUNT(CASE WHEN o."refunded" IS NOT NULL THEN {{ 1 }} END) AS refunds FROM orders o GROUP BY o."region" HAVING SUM(CASE WHEN o."status" = {{ "paid" }} THEN o."total" ELSE {{ 0 }} END) > {{ 0 }} ORDER BY paid_total DESC;',
      "redshift-plugin": { throws: ALIASED_MODE_MESSAGE },
      "snowflake-plugin": { throws: ALIASED_MODE_MESSAGE },
    },
  },
];

describe("APP-16506 golden: from and joins per plugin", () => {
  it.each(GOLDEN_PLUGIN_CASES)("$name", ({ expected, spec }) => {
    expect(compileForEveryPlugin(spec)).toEqual(expected);
  });
});
