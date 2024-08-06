import type { ColumnProperties, DSLWidget, WidgetProps } from "../types";
import { isDynamicValue, traverseDSLAndMigrate } from "../utils";

const ORIGINAL_INDEX_KEY = "__originalIndex__";
const PRIMARY_COLUMN_KEY_VALUE = "__primaryKey__";

const oldBindingSuffixForInlineEditValidationControl = (tableId: string) => {
  return `
    ))
    (
      ${tableId}.isAddRowInProgress,
      ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.index] ||
        Object.keys(${tableId}.processedTableData[0])
          .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
          .reduce((prev, curr) => {
            prev[curr] = "";
            return prev;
          }, {}))
    )
  }}
  `;
};

const newBindingSuffixForInlineEditValidationControl = (tableId: string) => {
  return `
    ))
    (
      ${tableId}.isAddRowInProgress,
      ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.${ORIGINAL_INDEX_KEY}] ||
        Object.keys(${tableId}.processedTableData[0])
          .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
          .reduce((prev, curr) => {
            prev[curr] = "";
            return prev;
          }, {}))
    )
  }}
  `;
};

const oldBindingSuffixForInlineEditValidProperty = (
  tableId: string,
  columnName: string,
) => {
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
const newBindingSuffixForInlineEditValidProperty = (
  tableId: string,
  columnName: string,
) => {
  return `
    ))
    (
      (${tableId}.isAddRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.${ORIGINAL_INDEX_KEY}] ||
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

const TABLE_INLINE_EDIT_VALIDATION_CONTROL_PROPERTIES_TO_UPDATE = [
  "regex",
  "errorMessage",
  "isColumnEditableCellRequired",
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

      handleInlineEditValidationControl(colProperties, widget);
      handleInlineEditValidValidationControl(colProperties, widget);
    });
  });
};

function handleInlineEditValidationControl(
  colProperties: ColumnProperties,
  widget: WidgetProps,
) {
  TABLE_INLINE_EDIT_VALIDATION_CONTROL_PROPERTIES_TO_UPDATE.forEach(
    (property) => {
      updateColProperty(
        colProperties,
        property,
        oldBindingSuffixForInlineEditValidationControl(widget.widgetName),
        newBindingSuffixForInlineEditValidationControl(widget.widgetName),
      );
    },
  );
}

function handleInlineEditValidValidationControl(
  colProperties: ColumnProperties,
  widget: WidgetProps,
) {
  updateColProperty(
    colProperties,
    "isColumnEditableCellValid",
    oldBindingSuffixForInlineEditValidProperty(
      widget.widgetName,
      colProperties,
    ),
    newBindingSuffixForInlineEditValidProperty(
      widget.widgetName,
      colProperties,
    ),
  );
}

function updateColProperty(
  colProperties: ColumnProperties,
  property: string,
  oldBindingSuffix: string,
  newBindingSuffix: string,
) {
  const isValidationValueDynamic =
    property in colProperties.validation &&
    colProperties.validation[property] &&
    isDynamicValue(colProperties.validation[property]);
  if (!isValidationValueDynamic) return;

  const propertyValue = colProperties.validation[property];
  colProperties.validation[property] = propertyValue.replace(
    oldBindingSuffix,
    newBindingSuffix,
  );
}
