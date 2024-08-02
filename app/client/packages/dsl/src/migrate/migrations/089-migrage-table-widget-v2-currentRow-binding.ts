import {
  ORIGINAL_INDEX_KEY,
  PRIMARY_COLUMN_KEY_VALUE,
} from "widgets/TableWidgetV2/constants";
import type { ColumnProperties, DSLWidget, WidgetProps } from "../types";
import { isDynamicValue, traverseDSLAndMigrate } from "../utils";

const bindingPrefix = `{{
    (
      (editedValue, currentRow, currentIndex, isNewRow) => (
  `;
const oldBindingSuffix = (tableId: string, columnName: string) => {
  return `
      ))
      (
        (${tableId}.isAddRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
        ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.index] ||
          Object.keys(${tableId}.processedTableData[0])
            .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
            .reduce((prev, curr) => {
              prev[curr] = "";
              return prev;
            }, {})),
        ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
        ${tableId}.isAddRowInProgress
      )
    }}
    `;
};
const newBindingSuffix = (tableId: string, columnName: string) => {
  return `
      ))
      (
        (${tableId}.isAddRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
        ${tableId}.isAddRowInProgress
          ? ${tableId}.newRow
          : (
            ${tableId}.processedTableData[${tableId}.editableCell["${ORIGINAL_INDEX_KEY}"]]
              || Object.keys(${tableId}.processedTableData[0])
                .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
                .reduce((prev, curr) => {
                  prev[curr] = "";
                  return prev;
                }, {})),
        ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
        ${tableId}.isAddRowInProgress
      )
    }}
    `;
};

const PROPERTIES_TO_UPDATE = [
  // common validations
  "regex",
  "isColumnEditableCellValid",
  "errorMessage",
  "isColumnEditableCellRequired",
  // date validations
  "minDate",
  "maxDate",
  // number validations
  "min",
  "max",
];
export const migrateTableWidgetV2CurrentRowInValidationsBinding = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type !== "TABLE_WIDGET_V2") return;

    const primaryColumns: Record<string, ColumnProperties> =
      widget.primaryColumns as Record<string, ColumnProperties>;
    Object.values(primaryColumns).forEach((colProperties) => {
      if (!colProperties.validation) return;

      PROPERTIES_TO_UPDATE.forEach((property) => {
        const isValidationValueDynamic =
          colProperties.validation[property] &&
          isDynamicValue(colProperties.validation[property]);
        if (!isValidationValueDynamic) return;

        const propertyValue = colProperties.validation[property];

        const binding = propertyValue
          .replace(bindingPrefix, "")
          .replace(oldBindingSuffix(widget.widgetName, colProperties), "");

        colProperties.validation[property] =
          `${bindingPrefix}${binding}${newBindingSuffix(widget.widgetName, colProperties)}`;
      });
    });
  });
};
