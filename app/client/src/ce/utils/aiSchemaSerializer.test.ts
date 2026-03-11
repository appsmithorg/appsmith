import {
  extractReferencedTableNames,
  serializeTable,
  serializeDatasourceSchema,
} from "./aiSchemaSerializer";
import type { DatasourceStructure, DatasourceTable } from "entities/Datasource";

describe("aiSchemaSerializer", () => {
  describe("extractReferencedTableNames", () => {
    const allTableNames = ["users", "orders", "products", "categories"];

    it("returns empty set for empty SQL", () => {
      expect(extractReferencedTableNames("", allTableNames).size).toBe(0);
    });

    it("returns empty set for empty table names", () => {
      expect(extractReferencedTableNames("SELECT * FROM users", []).size).toBe(
        0,
      );
    });

    it("finds table names in simple SELECT", () => {
      const result = extractReferencedTableNames(
        "SELECT * FROM users WHERE id = 1",
        allTableNames,
      );

      expect(result).toEqual(new Set(["users"]));
    });

    it("finds multiple table names in JOIN", () => {
      const result = extractReferencedTableNames(
        "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id",
        allTableNames,
      );

      expect(result).toEqual(new Set(["users", "orders"]));
    });

    it("is case-insensitive", () => {
      const result = extractReferencedTableNames(
        "SELECT * FROM USERS",
        allTableNames,
      );

      expect(result).toEqual(new Set(["users"]));
    });

    it("does not match partial names", () => {
      const result = extractReferencedTableNames(
        "SELECT * FROM user_settings",
        allTableNames,
      );

      expect(result).toEqual(new Set());
    });

    it("matches table names after commas and parentheses", () => {
      const result = extractReferencedTableNames(
        "INSERT INTO orders (user_id) SELECT id FROM users",
        allTableNames,
      );

      expect(result).toEqual(new Set(["orders", "users"]));
    });
  });

  describe("serializeTable", () => {
    it("serializes a simple table", () => {
      const table: DatasourceTable = {
        type: "TABLE",
        name: "users",
        columns: [
          { name: "id", type: "INTEGER" },
          { name: "name", type: "VARCHAR" },
        ],
        keys: [],
        templates: [],
      };

      expect(serializeTable(table)).toBe(
        "TABLE users (id INTEGER, name VARCHAR)",
      );
    });

    it("marks primary key columns", () => {
      const table: DatasourceTable = {
        type: "TABLE",
        name: "users",
        columns: [
          { name: "id", type: "INTEGER" },
          { name: "name", type: "VARCHAR" },
        ],
        keys: [
          {
            name: "users_pkey",
            type: "primary key",
            columnNames: ["id"],
            fromColumns: [],
          },
        ],
        templates: [],
      };

      expect(serializeTable(table)).toBe(
        "TABLE users (id INTEGER PK, name VARCHAR)",
      );
    });

    it("marks foreign key columns with references", () => {
      const table: DatasourceTable = {
        type: "TABLE",
        name: "orders",
        columns: [
          { name: "id", type: "INTEGER" },
          { name: "user_id", type: "INTEGER" },
          { name: "total", type: "DECIMAL" },
        ],
        keys: [
          {
            name: "orders_pkey",
            type: "primary key",
            columnNames: ["id"],
            fromColumns: [],
          },
          {
            name: "orders_user_fk",
            type: "foreign key",
            columnNames: ["user_id"],
            fromColumns: ["users.id"],
          },
        ],
        templates: [],
      };

      expect(serializeTable(table)).toBe(
        "TABLE orders (id INTEGER PK, user_id INTEGER FK->users.id, total DECIMAL)",
      );
    });

    it("handles table with no columns", () => {
      const table: DatasourceTable = {
        type: "TABLE",
        name: "empty",
        columns: [],
        keys: [],
        templates: [],
      };

      expect(serializeTable(table)).toBe("TABLE empty ()");
    });
  });

  describe("serializeDatasourceSchema", () => {
    const smallSchema: DatasourceStructure = {
      tables: [
        {
          type: "TABLE",
          name: "users",
          columns: [
            { name: "id", type: "INTEGER" },
            { name: "name", type: "VARCHAR" },
          ],
          keys: [
            {
              name: "users_pkey",
              type: "primary key",
              columnNames: ["id"],
              fromColumns: [],
            },
          ],
          templates: [],
        },
        {
          type: "TABLE",
          name: "orders",
          columns: [
            { name: "id", type: "INTEGER" },
            { name: "user_id", type: "INTEGER" },
          ],
          keys: [
            {
              name: "orders_user_fk",
              type: "foreign key",
              columnNames: ["user_id"],
              fromColumns: ["users.id"],
            },
          ],
          templates: [],
        },
      ],
    };

    it("returns undefined for undefined structure", () => {
      expect(serializeDatasourceSchema(undefined, "")).toBeUndefined();
    });

    it("returns undefined for empty tables", () => {
      expect(serializeDatasourceSchema({ tables: [] }, "")).toBeUndefined();
    });

    it("returns undefined for structure with no tables property", () => {
      expect(serializeDatasourceSchema({}, "")).toBeUndefined();
    });

    it("serializes a small schema in full (tier 1)", () => {
      const result = serializeDatasourceSchema(smallSchema, "");

      expect(result).toContain("Database has 2 tables.");
      expect(result).toContain("TABLE users (id INTEGER PK, name VARCHAR)");
      expect(result).toContain(
        "TABLE orders (id INTEGER, user_id INTEGER FK->users.id)",
      );
    });

    it("prioritizes referenced tables when over budget (tier 2)", () => {
      // Create a schema that exceeds a tiny budget
      const result = serializeDatasourceSchema(
        smallSchema,
        "SELECT * FROM users",
        150, // Very small budget to force tier 2
      );

      // Should include users table (referenced) and mention orders as other
      expect(result).toBeDefined();
      expect(result).toContain("users");
    });

    it("includes FK-related tables in priority", () => {
      // When we reference orders, the FK to users.id should pull in users too
      const result = serializeDatasourceSchema(
        smallSchema,
        "SELECT * FROM orders",
        500,
      );

      expect(result).toBeDefined();
      expect(result).toContain("TABLE orders");
      // users should be included because orders has FK to users
      expect(result).toContain("TABLE users");
    });

    it("truncates when tier 2 still exceeds budget (tier 3)", () => {
      const result = serializeDatasourceSchema(
        smallSchema,
        "SELECT * FROM users",
        80, // Extremely small budget
      );

      expect(result).toBeDefined();
      // Should be truncated to budget length
      expect(result!.length).toBeLessThanOrEqual(80);
    });

    it("handles single table schema", () => {
      const singleTable: DatasourceStructure = {
        tables: [
          {
            type: "TABLE",
            name: "settings",
            columns: [
              { name: "key", type: "VARCHAR" },
              { name: "value", type: "TEXT" },
            ],
            keys: [],
            templates: [],
          },
        ],
      };

      const result = serializeDatasourceSchema(singleTable, "");

      expect(result).toContain("Database has 1 table.");
      expect(result).toContain("TABLE settings (key VARCHAR, value TEXT)");
    });

    it("uses default budget of 10000", () => {
      const result = serializeDatasourceSchema(smallSchema, "");

      // Small schema should fit within default budget
      expect(result).toBeDefined();
      expect(result!.length).toBeLessThanOrEqual(10000);
    });
  });
});
