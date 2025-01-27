import type { DSLWidget } from "../../../types";

const oldBindingPrefix = (tableName: string) => {
  return `{{${tableName}.processedTableData.map((currentRow, currentIndex) => (`;
};

const newBindingPrefix = (tableName: string) => {
  return `{{${tableName}.processedTableData.map((currentRow, currentIndex) => { try { return (`;
};

const oldBindingSuffix = `))}}`;
const newBindingSuffix = `); } catch (e) { return null; }})}}`;

const computation = "currentRow.id + '_' + currentIndex";

export const validationTryCatchInput = {
  children: [
    {
      widgetName: "Table1",
      type: "TABLE_WIDGET_V2",
      primaryColumns: {
        customColumn1: {
          computedValue: `${oldBindingPrefix("Table1")}${computation}${oldBindingSuffix}`,
        },
        customColumn2: {
          computedValue: "static value", // Should not be modified
        },
      },
    },
  ],
} as any as DSLWidget;

export const validationTryCatchOutput = {
  children: [
    {
      widgetName: "Table1",
      type: "TABLE_WIDGET_V2",
      primaryColumns: {
        customColumn1: {
          computedValue: `${newBindingPrefix("Table1")}${computation}${newBindingSuffix}`,
        },
        customColumn2: {
          computedValue: "static value", // Not modified
        },
      },
    },
  ],
} as any as DSLWidget;
