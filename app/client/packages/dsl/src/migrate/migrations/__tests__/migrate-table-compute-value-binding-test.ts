import { migrateTableComputeValueBinding } from "../090-migrate-table-compute-value-binding";
import type { DSLWidget } from "../../types";

describe("migrateTableComputeValueBinding", () => {
  it("should migrate table compute value bindings to use new fallback mechanism", () => {
    const dsl: DSLWidget = {
      widgetName: "Table1",
      type: "TABLE_WIDGET",
      primaryColumns: {
        column1: {
          computedValue:
            "{{Table1.processedTableData.map((currentRow, currentIndex) => (currentRow.value))}}",
        },
        column2: {
          computedValue: "static value",
        },
        column3: {
          computedValue:
            "{{Table1.processedTableData.map((currentRow, currentIndex) => (currentRow.name + ' ' + currentRow.id))}}",
        },
      },
      version: 1,
      children: [],
    };

    const migratedDsl = migrateTableComputeValueBinding(dsl);

    expect(migratedDsl.primaryColumns.column1.computedValue).toBe(
      "{{(() => { const tableData = Table1.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (currentRow.value)) : currentRow.value })()}}",
    );

    // Static value should remain unchanged
    expect(migratedDsl.primaryColumns.column2.computedValue).toBe(
      "static value",
    );

    expect(migratedDsl.primaryColumns.column3.computedValue).toBe(
      "{{(() => { const tableData = Table1.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (currentRow.name + ' ' + currentRow.id)) : currentRow.name + ' ' + currentRow.id })()}}",
    );
  });

  it("should handle nested table widgets", () => {
    const dsl: DSLWidget = {
      type: "CANVAS_WIDGET",
      children: [
        {
          widgetName: "Table1",
          type: "TABLE_WIDGET",
          primaryColumns: {
            column1: {
              computedValue:
                "{{Table1.processedTableData.map((currentRow, currentIndex) => (currentRow.value))}}",
            },
          },
          version: 1,
          children: [],
        },
      ],
      version: 1,
    };

    const migratedDsl = migrateTableComputeValueBinding(dsl);

    expect(migratedDsl.children![0].primaryColumns.column1.computedValue).toBe(
      "{{(() => { const tableData = Table1.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (currentRow.value)) : currentRow.value })()}}",
    );
  });

  it("should not modify non-table widgets", () => {
    const dsl: DSLWidget = {
      type: "CANVAS_WIDGET",
      children: [
        {
          type: "TEXT_WIDGET",
          text: "Hello",
          version: 1,
          children: [],
        },
      ],
      version: 1,
    };

    const migratedDsl = migrateTableComputeValueBinding(dsl);

    expect(migratedDsl).toEqual(dsl);
  });

  it("should handle empty or undefined computedValue", () => {
    const dsl: DSLWidget = {
      widgetName: "Table1",
      type: "TABLE_WIDGET",
      primaryColumns: {
        column1: {
          // No computedValue
        },
        column2: {
          computedValue: "",
        },
      },
      version: 1,
      children: [],
    };

    const migratedDsl = migrateTableComputeValueBinding(dsl);

    expect(migratedDsl.primaryColumns.column1).toEqual({});
    expect(migratedDsl.primaryColumns.column2.computedValue).toBe("");
  });
});
