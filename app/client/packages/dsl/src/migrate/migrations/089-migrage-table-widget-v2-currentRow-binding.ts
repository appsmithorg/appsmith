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

    Object.entries(primaryColumns).forEach(([colName, colProperties]) => {
      if (!colProperties.validation) return;

      handleInlineEditValidationControl(
        widget.widgetName,
        colName,
        colProperties,
      );
      handleInlineEditValidValidationControl(
        widget.widgetName,
        colName,
        colProperties,
      );
    });
  });
};

function handleInlineEditValidationControl(
  tableName: string,
  colName: string,
  colProperties: ColumnProperties,
) {
  TABLE_INLINE_EDIT_VALIDATION_CONTROL_PROPERTIES_TO_UPDATE.forEach(
    (property) => {
      updateColProperty(tableName, colName, colProperties, property);
    },
  );
}

function handleInlineEditValidValidationControl(
  tableName: string,
  colName: string,
  colProperties: ColumnProperties,
) {
  updateColProperty(
    tableName,
    colName,
    colProperties,
    "isColumnEditableCellValid",
  );
}

function getBindingPrefixSuffix(
  tableName: string,
  colName: string,
  property: string,
  getOldBinding: boolean,
) {
  if (getOldBinding) {
    if (property === "isColumnEditableCellValid") {
      return oldBindingSuffixForInlineEditValidProperty(tableName, colName);
    }

    return oldBindingSuffixForInlineEditValidationControl(tableName);
  } else {
    if (property === "isColumnEditableCellValid") {
      return newBindingSuffixForInlineEditValidProperty(tableName, colName);
    }

    return newBindingSuffixForInlineEditValidationControl(tableName);
  }
}

function updateColProperty(
  tableName: string,
  colName: string,
  colProperties: ColumnProperties,
  propertyToUpdate: string,
) {
  const oldBindingSuffix = getBindingPrefixSuffix(
    tableName,
    colName,
    propertyToUpdate,
    true,
  );
  const newBindingSuffix = getBindingPrefixSuffix(
    tableName,
    colName,
    propertyToUpdate,
    false,
  );

  const isValidationValueDynamic =
    propertyToUpdate in colProperties.validation &&
    colProperties.validation[propertyToUpdate] &&
    isDynamicValue(colProperties.validation[propertyToUpdate]);

  if (!isValidationValueDynamic) return;

  const propertyValue = colProperties.validation[propertyToUpdate];

  colProperties.validation[propertyToUpdate] = propertyValue.replace(
    oldBindingSuffix,
    newBindingSuffix,
  );
}
