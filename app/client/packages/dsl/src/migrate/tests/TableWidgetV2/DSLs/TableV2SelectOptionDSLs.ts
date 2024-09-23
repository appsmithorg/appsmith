import type { DSLWidget } from "../../../types";

export const tableV2SelectOptionInput = {
  children: [
    {
      widgetName: "Table",
      type: "TABLE_WIDGET_V2",
      primaryColumns: {
        step: {
          columnType: "select",
          selectOptions: "[{label: 1, value: 2}]",
        },
        task: {
          columnType: "select",
          selectOptions: "{{[{label: 1, value: 2}]}}",
        },
        status: {
          columnType: "text",
          selectOptions: "{{[{label: 1, value: 2}]}}",
        },
      },
    },
  ],
} as any as DSLWidget;

export const tableV2SelectOptionOutput = {
  children: [
    {
      widgetName: "Table",
      type: "TABLE_WIDGET_V2",
      primaryColumns: {
        step: {
          columnType: "select",
          selectOptions: "[{label: 1, value: 2}]",
        },
        task: {
          columnType: "select",
          selectOptions:
            "{{Table.processedTableData.map((currentRow, currentIndex) => ( [{label: 1, value: 2}]))}}",
        },
        status: {
          columnType: "text",
          selectOptions: "{{[{label: 1, value: 2}]}}",
        },
      },
    },
  ],
} as any as DSLWidget;
