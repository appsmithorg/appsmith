/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnPropertiesV2, DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateBindingPrefixSuffixForInlineEditValidationControl = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const tableId = widget.widgetName;

      const oldBindingPrefix = `{{((isNewRow)=>(`;
      const newBindingPrefix = `{{
          (
            (isNewRow, currentIndex, currentRow) => (
        `;

      const oldBindingSuffix = `))(${tableId}.isAddRowInProgress)}}`;
      const newBindingSuffix = `
        ))
        (
          ${tableId}.isAddRowInProgress,
          ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
          ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.index] ||
            Object.keys(${tableId}.processedTableData[0])
              .filter(key => ["__originalIndex__", "__primaryKey__"].indexOf(key) === -1)
              .reduce((prev, curr) => {
                prev[curr] = "";
                return prev;
              }, {}))
        )
      }}
      `;
      const applicableValidationNames = [
        "min",
        "max",
        "regex",
        "errorMessage",
        "isColumnEditableCellRequired",
      ];
      const primaryColumns = widget?.primaryColumns as ColumnPropertiesV2;

      Object.values(primaryColumns).forEach((column: any) => {
        if (column.hasOwnProperty("validation")) {
          const validations = column.validation;

          for (const validationName in validations) {
            if (applicableValidationNames.indexOf(validationName) == -1) {
              continue;
            }

            const validationValue = validations[validationName];

            if (typeof validationValue !== "string") {
              continue;
            }

            let compressedValidationValue = validationValue.replace(/\s/g, "");

            compressedValidationValue = compressedValidationValue.replace(
              oldBindingPrefix,
              newBindingPrefix,
            );
            compressedValidationValue = compressedValidationValue.replace(
              oldBindingSuffix,
              newBindingSuffix,
            );
            validations[validationName] = compressedValidationValue;
          }
        }
      });
    }
  });
};
