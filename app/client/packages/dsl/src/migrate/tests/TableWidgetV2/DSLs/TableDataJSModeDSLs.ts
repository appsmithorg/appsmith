import type { DSLWidget } from "../../../types";

export const tableV2DataJSModeInput = {
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
    {
      widgetName: "Table1",
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
      dynamicPropertyPathList: [{ key: "test" }],
    },
    {
      widgetName: "Text",
      type: "TEXT_WIDGET",
      dynamicPropertyPathList: [{ key: "test" }],
    },
  ],
} as any as DSLWidget;

export const tableV2DataJSModeOutput = {
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
      dynamicPropertyPathList: [{ key: "tableData" }],
    },
    {
      widgetName: "Table1",
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
      dynamicPropertyPathList: [{ key: "test" }, { key: "tableData" }],
    },
    {
      widgetName: "Text",
      type: "TEXT_WIDGET",
      dynamicPropertyPathList: [{ key: "test" }],
    },
  ],
} as any as DSLWidget;
