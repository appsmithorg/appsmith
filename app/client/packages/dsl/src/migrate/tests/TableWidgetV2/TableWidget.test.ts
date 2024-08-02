/* eslint-disable @typescript-eslint/no-explicit-any */
import { tableWidgetPropertyPaneMigrations } from "../../migrations/009-table-widget-property-pane-migration";
import { migrateTableWidgetParentRowSpaceProperty } from "../../migrations/022-migrate-table-widget-parent-row-space-property";
import { migrateTableWidgetHeaderVisibilityProperties } from "../../migrations/024-migrate-table-widget-header-visibility-properties";
import { migrateTableSanitizeColumnKeys } from "../../migrations/037-migrate-table-sanitize-column-keys";
import { migrateTableWidgetSelectedRowBindings } from "../../migrations/039-migrate-table-widget-selected-row-bindings";
import { migrateTableWidgetV2ValidationBinding } from "../../migrations/066-migrate-table-widget-v2-validation-binding";
import { migrateTableWidgetV2SelectOption } from "../../migrations/071-migrate-table-widget-v2-select-option";
import { migrateTableWidgetTableDataJsMode } from "../../migrations/079-migrate-table-widget-table-data-js-mode";
import { migrateTableWidgetV2CurrentRowInValidationsBinding } from "../../migrations/089-migrage-table-widget-v2-currentRow-binding";
import type { DSLWidget } from "../../types";
import {
  currentRownInValidationsBindingInput,
  currentRownInValidationsBindingOutput,
} from "./DSLs/CurrenRowInValidationsBindingDSLs";
import {
  isEditableCellInput,
  isEditableCellOutput,
} from "./DSLs/IsColumnEditableCellValidDSLs";
import {
  input1,
  input2,
  input3,
  output1,
  output2,
  output3,
} from "./DSLs/PropertyPaneUpgradeDSLs";
import {
  inputDsl as selectedRowInputDsl,
  outputDsl as selectedRowOutputDsl,
} from "./DSLs/SelectedRowBindingsDSLs";
import {
  tableV2DataJSModeInput,
  tableV2DataJSModeOutput,
} from "./DSLs/TableDataJSModeDSLs";
import {
  badDsl,
  fixedDsl,
  inputDsl,
  outputDsl,
} from "./DSLs/TableSanitizeColumnKeysDSLs";
import {
  tableV2SelectOptionInput,
  tableV2SelectOptionOutput,
} from "./DSLs/TableV2SelectOptionDSLs";

describe("Table Widget Property Pane Upgrade", () => {
  it("To test primaryColumns are created for a simple table", () => {
    const newDsl = tableWidgetPropertyPaneMigrations(input1);
    expect(JSON.stringify(newDsl) === JSON.stringify(output1));
  });
  it("To test columnActions are migrated derived primaryColumns", () => {
    const newDsl = tableWidgetPropertyPaneMigrations(input2);
    expect(JSON.stringify(newDsl) === JSON.stringify(output2));
  });
  it("To test table action are migrated", () => {
    const newDsl = tableWidgetPropertyPaneMigrations(input3);
    expect(JSON.stringify(newDsl) === JSON.stringify(output3));
  });

  it("To test table parentRowSpace is updated", () => {
    const inputDsl: DSLWidget = {
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 1224,
      snapColumns: 16,
      detachFromLayout: true,
      widgetId: "0",
      topRow: 0,
      bottomRow: 1840,
      containerStyle: "none",
      snapRows: 33,
      parentRowSpace: 1,
      type: "CANVAS_WIDGET",
      canExtend: true,
      version: 7,
      minHeight: 1292,
      parentColumnSpace: 1,
      dynamicBindingPathList: [],
      leftColumn: 0,
      isLoading: false,
      parentId: "",
      renderMode: "CANVAS",
      children: [
        {
          isVisible: true,
          label: "Data",
          widgetName: "Table1",
          searchKey: "",
          tableData:
            '[\n  {\n    "id": 2381224,\n    "email": "michael.lawson@reqres.in",\n    "userName": "Michael Lawson",\n    "productName": "Chicken Sandwich",\n    "orderAmount": 4.99\n  },\n  {\n    "id": 2736212,\n    "email": "lindsay.ferguson@reqres.in",\n    "userName": "Lindsay Ferguson",\n    "productName": "Tuna Salad",\n    "orderAmount": 9.99\n  },\n  {\n    "id": 6788734,\n    "email": "tobias.funke@reqres.in",\n    "userName": "Tobias Funke",\n    "productName": "Beef steak",\n    "orderAmount": 19.99\n  }\n]',
          type: "TABLE_WIDGET",
          isLoading: false,
          parentColumnSpace: 74,
          parentRowSpace: 40,
          leftColumn: 0,
          rightColumn: 8,
          topRow: 19,
          bottomRow: 26,
          parentId: "0",
          widgetId: "fs785w9gcy",
          dynamicBindingPathList: [],
          primaryColumns: {
            id: {
              index: 0,
              width: 150,
              id: "id",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "id",
              computedValue: "",
            },
            email: {
              index: 1,
              width: 150,
              id: "email",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "email",
              computedValue: "",
            },
            userName: {
              index: 2,
              width: 150,
              id: "userName",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "userName",
              computedValue: "",
            },
            productName: {
              index: 3,
              width: 150,
              id: "productName",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "productName",
              computedValue: "",
            },
            orderAmount: {
              index: 4,
              width: 150,
              id: "orderAmount",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "orderAmount",
              computedValue: "",
            },
          },
          textSize: "PARAGRAPH",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          renderMode: "CANVAS",
          version: 1,
        },
      ],
    };
    const outputDsl: DSLWidget = {
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 1224,
      snapColumns: 16,
      detachFromLayout: true,
      widgetId: "0",
      topRow: 0,
      bottomRow: 1840,
      containerStyle: "none",
      snapRows: 33,
      parentRowSpace: 1,
      type: "CANVAS_WIDGET",
      canExtend: true,
      version: 7,
      minHeight: 1292,
      parentColumnSpace: 1,
      dynamicBindingPathList: [],
      leftColumn: 0,
      isLoading: false,
      parentId: "",
      renderMode: "CANVAS",
      children: [
        {
          isVisible: true,
          label: "Data",
          widgetName: "Table1",
          searchKey: "",
          tableData:
            '[\n  {\n    "id": 2381224,\n    "email": "michael.lawson@reqres.in",\n    "userName": "Michael Lawson",\n    "productName": "Chicken Sandwich",\n    "orderAmount": 4.99\n  },\n  {\n    "id": 2736212,\n    "email": "lindsay.ferguson@reqres.in",\n    "userName": "Lindsay Ferguson",\n    "productName": "Tuna Salad",\n    "orderAmount": 9.99\n  },\n  {\n    "id": 6788734,\n    "email": "tobias.funke@reqres.in",\n    "userName": "Tobias Funke",\n    "productName": "Beef steak",\n    "orderAmount": 19.99\n  }\n]',
          type: "TABLE_WIDGET",
          isLoading: false,
          parentColumnSpace: 74,
          parentRowSpace: 10,
          leftColumn: 0,
          rightColumn: 8,
          topRow: 19,
          bottomRow: 26,
          parentId: "0",
          widgetId: "fs785w9gcy",
          dynamicBindingPathList: [],
          primaryColumns: {
            id: {
              index: 0,
              width: 150,
              id: "id",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "id",
              computedValue: "",
            },
            email: {
              index: 1,
              width: 150,
              id: "email",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "email",
              computedValue: "",
            },
            userName: {
              index: 2,
              width: 150,
              id: "userName",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "userName",
              computedValue: "",
            },
            productName: {
              index: 3,
              width: 150,
              id: "productName",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "productName",
              computedValue: "",
            },
            orderAmount: {
              index: 4,
              width: 150,
              id: "orderAmount",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "orderAmount",
              computedValue: "",
            },
          },
          textSize: "PARAGRAPH",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          renderMode: "CANVAS",
          version: 1,
        },
      ],
    };
    const newDsl = migrateTableWidgetParentRowSpaceProperty(inputDsl);
    expect(JSON.stringify(newDsl) === JSON.stringify(outputDsl));
  });

  it("TableWidget : should update header options visibilities", () => {
    const inputDsl: DSLWidget = {
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 1224,
      snapColumns: 16,
      detachFromLayout: true,
      widgetId: "0",
      topRow: 0,
      bottomRow: 1840,
      containerStyle: "none",
      snapRows: 33,
      parentRowSpace: 1,
      type: "CANVAS_WIDGET",
      canExtend: true,
      version: 7,
      minHeight: 1292,
      parentColumnSpace: 1,
      dynamicBindingPathList: [],
      leftColumn: 0,
      isLoading: false,
      parentId: "",
      renderMode: "CANVAS",
      children: [
        {
          isVisible: true,
          label: "Data",
          widgetName: "Table1",
          searchKey: "",
          tableData:
            '[\n  {\n    "id": 2381224,\n    "email": "michael.lawson@reqres.in",\n    "userName": "Michael Lawson",\n    "productName": "Chicken Sandwich",\n    "orderAmount": 4.99\n  },\n  {\n    "id": 2736212,\n    "email": "lindsay.ferguson@reqres.in",\n    "userName": "Lindsay Ferguson",\n    "productName": "Tuna Salad",\n    "orderAmount": 9.99\n  },\n  {\n    "id": 6788734,\n    "email": "tobias.funke@reqres.in",\n    "userName": "Tobias Funke",\n    "productName": "Beef steak",\n    "orderAmount": 19.99\n  }\n]',
          type: "TABLE_WIDGET",
          isLoading: false,
          parentColumnSpace: 74,
          parentRowSpace: 40,
          leftColumn: 0,
          rightColumn: 8,
          topRow: 19,
          bottomRow: 26,
          parentId: "0",
          widgetId: "fs785w9gcy",
          dynamicBindingPathList: [],
          primaryColumns: {
            id: {
              index: 0,
              width: 150,
              id: "id",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "id",
              computedValue: "",
            },
            email: {
              index: 1,
              width: 150,
              id: "email",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "email",
              computedValue: "",
            },
            userName: {
              index: 2,
              width: 150,
              id: "userName",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "userName",
              computedValue: "",
            },
            productName: {
              index: 3,
              width: 150,
              id: "productName",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "productName",
              computedValue: "",
            },
            orderAmount: {
              index: 4,
              width: 150,
              id: "orderAmount",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "orderAmount",
              computedValue: "",
            },
          },
          textSize: "PARAGRAPH",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          renderMode: "CANVAS",
          version: 1,
        },
      ],
    };
    const outputDsl: DSLWidget = {
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 1224,
      snapColumns: 16,
      detachFromLayout: true,
      widgetId: "0",
      topRow: 0,
      bottomRow: 1840,
      containerStyle: "none",
      snapRows: 33,
      parentRowSpace: 1,
      type: "CANVAS_WIDGET",
      canExtend: true,
      version: 7,
      minHeight: 1292,
      parentColumnSpace: 1,
      dynamicBindingPathList: [],
      leftColumn: 0,
      isLoading: false,
      parentId: "",
      renderMode: "CANVAS",
      children: [
        {
          isVisible: true,
          label: "Data",
          widgetName: "Table1",
          searchKey: "",
          tableData:
            '[\n  {\n    "id": 2381224,\n    "email": "michael.lawson@reqres.in",\n    "userName": "Michael Lawson",\n    "productName": "Chicken Sandwich",\n    "orderAmount": 4.99\n  },\n  {\n    "id": 2736212,\n    "email": "lindsay.ferguson@reqres.in",\n    "userName": "Lindsay Ferguson",\n    "productName": "Tuna Salad",\n    "orderAmount": 9.99\n  },\n  {\n    "id": 6788734,\n    "email": "tobias.funke@reqres.in",\n    "userName": "Tobias Funke",\n    "productName": "Beef steak",\n    "orderAmount": 19.99\n  }\n]',
          type: "TABLE_WIDGET",
          isLoading: false,
          parentColumnSpace: 74,
          parentRowSpace: 10,
          leftColumn: 0,
          rightColumn: 8,
          topRow: 19,
          bottomRow: 26,
          parentId: "0",
          widgetId: "fs785w9gcy",
          dynamicBindingPathList: [],
          primaryColumns: {
            id: {
              index: 0,
              width: 150,
              id: "id",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "id",
              computedValue: "",
            },
            email: {
              index: 1,
              width: 150,
              id: "email",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "email",
              computedValue: "",
            },
            userName: {
              index: 2,
              width: 150,
              id: "userName",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "userName",
              computedValue: "",
            },
            productName: {
              index: 3,
              width: 150,
              id: "productName",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "productName",
              computedValue: "",
            },
            orderAmount: {
              index: 4,
              width: 150,
              id: "orderAmount",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textColor: "#231F20",
              textSize: "PARAGRAPH",
              fontStyle: "REGULAR",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isDerived: false,
              label: "orderAmount",
              computedValue: "",
            },
          },
          textSize: "PARAGRAPH",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          renderMode: "CANVAS",
          isVisibleSearch: true,
          isVisibleFilters: true,
          isVisibleDownload: true,
          isVisibleCompactMode: true,
          isVisiblePagination: true,
          version: 1,
        },
      ],
    };
    const newDsl = migrateTableWidgetHeaderVisibilityProperties(inputDsl);
    expect(JSON.stringify(newDsl) === JSON.stringify(outputDsl));
  });
});

describe("Table Widget Migration - #migrateTableSanitizeColumnKeys", () => {
  it("sanitizes primaryColumns, dynamicBindingPathList, columnOrder", () => {
    const newDsl = migrateTableSanitizeColumnKeys(inputDsl);
    const correctedDsl = migrateTableSanitizeColumnKeys(badDsl);
    expect(newDsl).toStrictEqual(outputDsl);
    expect(correctedDsl).toStrictEqual(fixedDsl);
  });
});

describe("Table Widget selectedRow bindings update", () => {
  it("To test selectedRow bindings are updated for primaryColumns and derivedColumns", () => {
    const newDsl = migrateTableWidgetSelectedRowBindings(selectedRowInputDsl);
    expect(newDsl).toStrictEqual(selectedRowOutputDsl);
  });
});

describe("migrateTableWidgetV2ValidationBinding", () => {
  it("should test that binding of isColumnEditableCellValid is getting updated", () => {
    expect(migrateTableWidgetV2ValidationBinding(isEditableCellInput)).toEqual(
      isEditableCellOutput,
    );
  });
});

describe("migrateTableWidgetV2SelectOption", () => {
  it("should test that binding of selectOption is getting updated", () => {
    expect(migrateTableWidgetV2SelectOption(tableV2SelectOptionInput)).toEqual(
      tableV2SelectOptionOutput,
    );
  });
});

describe("migrateTableWidgetTableDataJsMode", () => {
  it("should test that tableData js mode is enabled", () => {
    expect(migrateTableWidgetTableDataJsMode(tableV2DataJSModeInput)).toEqual(
      tableV2DataJSModeOutput,
    );
  });
});

describe("migrateTableWidgetV2CurrentRowInValidationsBinding", () => {
  it("should test that tableData js mode is enabled", () => {
    expect(
      migrateTableWidgetV2CurrentRowInValidationsBinding(
        currentRownInValidationsBindingInput,
      ),
    ).toEqual(currentRownInValidationsBindingOutput);
  });
});
