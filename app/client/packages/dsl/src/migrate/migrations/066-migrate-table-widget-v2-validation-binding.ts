import type { DSLWidget, WidgetProps } from "../types";
import { isDynamicValue, traverseDSLAndMigrate } from "../utils";

const oldBindingPrefix = `{{
  (
    (editedValue, currentRow, currentIndex) => (
`;

const newBindingPrefix = `{{
  (
    (editedValue, currentRow, currentIndex, isNewRow) => (
`;

const oldBindingSuffix = (tableId: string, columnName: string) => `
  ))
  (
    ${tableId}.columnEditableCellValue.${columnName} || "",
    ${tableId}.processedTableData[${tableId}.editableCell.index] ||
      Object.keys(${tableId}.processedTableData[0])
        .filter(key => ["__originalIndex__", "__primaryKey__"].indexOf(key) === -1)
        .reduce((prev, curr) => {
          prev[curr] = "";
          return prev;
        }, {}),
    ${tableId}.editableCell.index)
}}
`;

const newBindingSuffix = (tableId: string, columnName: string) => {
  return `
    ))
    (
      (${tableId}.isAddRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.index] ||
        Object.keys(${tableId}.processedTableData[0])
          .filter(key => ["__originalIndex__", "__primaryKey__"].indexOf(key) === -1)
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

export const migrateTableWidgetV2ValidationBinding = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const primaryColumns = widget.primaryColumns;

      for (const column in primaryColumns) {
        if (
          primaryColumns.hasOwnProperty(column) &&
          primaryColumns[column].validation &&
          primaryColumns[column].validation.isColumnEditableCellValid &&
          isDynamicValue(
            primaryColumns[column].validation.isColumnEditableCellValid,
          )
        ) {
          const propertyValue =
            primaryColumns[column].validation.isColumnEditableCellValid;

          const binding = propertyValue
            .replace(oldBindingPrefix, "")
            .replace(oldBindingSuffix(widget.widgetName, column), "");

          primaryColumns[column].validation.isColumnEditableCellValid =
            newBindingPrefix +
            binding +
            newBindingSuffix(widget.widgetName, column);
        }
      }
    }
  });
};
