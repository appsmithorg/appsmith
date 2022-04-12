import {
  defaultSelectedRowValidation,
  updateIconNameHook,
} from "./propertyUtils";
import _ from "lodash";

const tableWProps = {
  multiRowSelection: false,
  widgetName: "Table1",
  defaultPageSize: 0,
  columnOrder: ["step", "task", "status", "action"],
  isVisibleDownload: true,
  dynamicPropertyPathList: [],
  displayName: "Table",
  iconSVG: "/static/media/icon.db8a9cbd.svg",
  topRow: 54,
  bottomRow: 82,
  isSortable: true,
  parentRowSpace: 10,
  type: "TABLE_WIDGET",
  defaultSelectedRow: "0",
  hideCard: false,
  parentColumnSpace: 25.6875,
  dynamicTriggerPathList: [],
  dynamicBindingPathList: [
    {
      key: "primaryColumns.step.computedValue",
    },
    {
      key: "primaryColumns.task.computedValue",
    },
    {
      key: "primaryColumns.status.computedValue",
    },
    {
      key: "primaryColumns.action.computedValue",
    },
  ],
  leftColumn: 25,
  primaryColumns: {
    step: {
      index: 0,
      width: 150,
      id: "step",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "PARAGRAPH",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "step",
      computedValue:
        "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.step))}}",
    },
    task: {
      index: 1,
      width: 150,
      id: "task",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "PARAGRAPH",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "task",
      computedValue:
        "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.task))}}",
    },
    status: {
      index: 2,
      width: 150,
      id: "status",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "PARAGRAPH",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "status",
      computedValue:
        "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.status))}}",
    },
    action: {
      index: 3,
      width: 150,
      id: "action",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "button",
      textSize: "PARAGRAPH",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDisabled: false,
      isDerived: false,
      label: "action",
      onClick:
        "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
      computedValue:
        "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.action))}}",
    },
  },
  delimiter: ",",
  key: "fzi9jh5j7j",
  derivedColumns: {},
  rightColumn: 50,
  textSize: "PARAGRAPH",
  widgetId: "2tk8bgzwaz",
  isVisibleFilters: true,
  tableData: [
    {
      step: "#1",
      task: "Drop a table",
      status: "✅",
      action: "",
    },
    {
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
      action: "",
    },
    {
      step: "#3",
      task: "Bind the query using => fetch_users.data",
      status: "--",
      action: "",
    },
  ],
  isVisible: true,
  label: "Data",
  searchKey: "",
  version: 3,
  totalRecordsCount: 0,
  parentId: "0",
  renderMode: "CANVAS",
  isLoading: false,
  horizontalAlignment: "LEFT",
  isVisibleSearch: true,
  isVisiblePagination: true,
  verticalAlignment: "CENTER",
  columnSizeMap: {
    task: 245,
    step: 62,
    status: 75,
  },
  childStylesheet: {
    button: {
      buttonColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    },
    menuButton: {
      menuColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    },
    iconButton: {
      menuColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    },
  },
};

describe("unit test case for property utils", () => {
  it("case: check if the defaultSelectedRowValiation returns parsed value as undefined", () => {
    const value = defaultSelectedRowValidation("", tableWProps as any, _);

    expect(value.isValid).toBeTruthy();
    expect(value.parsed).toEqual(undefined);
  });
  it("case: when columnType is menuButton, iconName should be empty string", () => {
    const propertiesToUpdate = updateIconNameHook(
      tableWProps as any,
      "primaryColumns.action.columnType",
      "menuButton",
    );
    const output = [
      {
        propertyPath: "derivedColumns.action.menuColor",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( appsmith.theme.colors.primaryColor))}}",
      },
      {
        propertyPath: "primaryColumns.action.menuColor",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( appsmith.theme.colors.primaryColor))}}",
      },
      {
        propertyPath: "derivedColumns.action.borderRadius",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( appsmith.theme.borderRadius.appBorderRadius))}}",
      },
      {
        propertyPath: "primaryColumns.action.borderRadius",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( appsmith.theme.borderRadius.appBorderRadius))}}",
      },
      {
        propertyPath: "derivedColumns.action.boxShadow",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( 'none'))}}",
      },
      {
        propertyPath: "primaryColumns.action.boxShadow",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( 'none'))}}",
      },
      {
        propertyPath: "primaryColumns.action.columnType",
        propertyValue: "menuButton",
      },
      {
        propertyPath: "primaryColumns.action.iconName",
        propertyValue: "",
      },
    ];
    expect(propertiesToUpdate).toEqual(output);
  });
  it("case: when columnType is iconButton, iconName value should be add", () => {
    const propertiesToUpdate = updateIconNameHook(
      tableWProps as any,
      "primaryColumns.action.columnType",
      "iconButton",
    );
    const output = [
      {
        propertyPath: "derivedColumns.action.menuColor",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( appsmith.theme.colors.primaryColor))}}",
      },
      {
        propertyPath: "primaryColumns.action.menuColor",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( appsmith.theme.colors.primaryColor))}}",
      },
      {
        propertyPath: "derivedColumns.action.borderRadius",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( appsmith.theme.borderRadius.appBorderRadius))}}",
      },
      {
        propertyPath: "primaryColumns.action.borderRadius",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( appsmith.theme.borderRadius.appBorderRadius))}}",
      },
      {
        propertyPath: "derivedColumns.action.boxShadow",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( 'none'))}}",
      },
      {
        propertyPath: "primaryColumns.action.boxShadow",
        propertyValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( 'none'))}}",
      },
      {
        propertyPath: "primaryColumns.action.columnType",
        propertyValue: "iconButton",
      },
      {
        propertyPath: "primaryColumns.action.iconName",
        propertyValue: "add",
      },
    ];
    expect(propertiesToUpdate).toEqual(output);
  });
});
