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
  inputDsl as parentRowSpaceInputDsl,
  outputDsl as parentRowSpaceOutputDsl,
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
import {
  inputDsl as updateHeaderOptionsInputDsl,
  outputDsl as updateHeaderOptionsOutputDsl,
} from "./DSLs/UpdateHeaderOptionsDSLs";

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
    const newDsl = migrateTableWidgetParentRowSpaceProperty(
      parentRowSpaceInputDsl,
    );

    expect(JSON.stringify(newDsl) === JSON.stringify(parentRowSpaceOutputDsl));
  });

  it("TableWidget : should update header options visibilities", () => {
    const newDsl = migrateTableWidgetHeaderVisibilityProperties(
      updateHeaderOptionsInputDsl,
    );

    expect(
      JSON.stringify(newDsl) === JSON.stringify(updateHeaderOptionsOutputDsl),
    );
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
