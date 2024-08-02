import {
  ORIGINAL_INDEX_KEY,
  PRIMARY_COLUMN_KEY_VALUE,
} from "widgets/TableWidgetV2/constants";
import type { ColumnProperties, DSLWidget, WidgetProps } from "../types";
import { isDynamicValue, traverseDSLAndMigrate } from "../utils";

const bindingPrefixForInlineEditValidationControl = `{{
    (
      (isNewRow, currentIndex, currentRow) => (
  `;

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
      ${tableId}.isAddRowInProgress
        ? ${tableId}.newRow
        : (
          ${tableId}.processedTableData[${tableId}.editableCell.${ORIGINAL_INDEX_KEY}]
          || Object.keys(${tableId}.processedTableData[0])
              .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
              .reduce((prev, curr) => {
                prev[curr] = "";
                return prev;
              }, {}))
    )
  }}`;
};

const bindingPrefixForInlineEditValidProperty = `{{
    (
      (editedValue, currentRow, currentIndex, isNewRow) => (
  `;

const oldBindingSuffixForInlineEditValidProperty = (
  tableId: string,
  columnName: string,
) => {
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
const newBindingSuffixForInlineEditValidProperty = (
  tableId: string,
  columnName: string,
) => {
  return `
    ))
    (
      (${tableId}.isAddRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
      ${tableId}.isAddRowInProgress
        ? ${tableId}.newRow
        : (
          ${tableId}.processedTableData[${tableId}.editableCell.${ORIGINAL_INDEX_KEY}]
            || Object.keys(${tableId}.processedTableData[0])
              .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
              .reduce((prev, curr) => {
                prev[curr] = "";
                return prev;
              }, {})),
      ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
      ${tableId}.isAddRowInProgress
    )
  }}`;
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
  colProperties: any,
  widget: WidgetProps,
) {
  TABLE_INLINE_EDIT_VALIDATION_CONTROL_PROPERTIES_TO_UPDATE.forEach(
    (property) => {
      updateColProperty(
        colProperties,
        property,
        bindingPrefixForInlineEditValidationControl,
        oldBindingSuffixForInlineEditValidationControl(widget.widgetName),
        bindingPrefixForInlineEditValidationControl,
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
    bindingPrefixForInlineEditValidProperty,
    oldBindingSuffixForInlineEditValidProperty(
      widget.widgetName,
      colProperties,
    ),
    bindingPrefixForInlineEditValidProperty,
    newBindingSuffixForInlineEditValidProperty(
      widget.widgetName,
      colProperties,
    ),
  );
}

function updateColProperty(
  colProperties: ColumnProperties,
  property: string,
  oldBindingPrefix: string,
  oldsuffixPrefix: string,
  newBindingPrefix: string,
  newsuffixPrefix: string,
) {
  const isValidationValueDynamic =
    colProperties.validation[property] &&
    isDynamicValue(colProperties.validation[property]);
  if (!isValidationValueDynamic) return;

  const propertyValue = colProperties.validation[property];

  const binding = propertyValue
    .replace(oldBindingPrefix, "")
    .replace(oldsuffixPrefix, "");

  colProperties.validation[property] =
    `${newBindingPrefix}${binding}${newsuffixPrefix}`;
}
