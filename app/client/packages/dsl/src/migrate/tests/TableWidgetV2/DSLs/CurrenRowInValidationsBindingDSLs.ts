import type { DSLWidget } from "../../../types";

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
          .filter(key => ["__originalIndex__", "__primaryKey__"].indexOf(key) === -1)
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
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.__originalIndex__] ||
        Object.keys(${tableId}.processedTableData[0])
          .filter(key => ["__originalIndex__", "__primaryKey__"].indexOf(key) === -1)
          .reduce((prev, curr) => {
            prev[curr] = "";
            return prev;
          }, {}))
    )
  }}
  `;
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

const newBindingSuffixForInlineEditValidProperty = (
  tableId: string,
  columnName: string,
) => {
  return `
    ))
    (
      (${tableId}.isAddRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.__originalIndex__] ||
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

const binding = "JSObject.myFun(currentRow)";
export const currentRownInValidationsBindingInput = {
  children: [
    {
      widgetName: "Table",
      type: "TABLE_WIDGET_V2",
      primaryColumns: {
        step: {
          validation: {
            isColumnEditableCellValid: `${bindingPrefixForInlineEditValidProperty}${binding}${oldBindingSuffixForInlineEditValidProperty(
              "Table",
              "step",
            )}`,
            errorMessage: `${bindingPrefixForInlineEditValidationControl}${binding}${oldBindingSuffixForInlineEditValidationControl("Table")}`,
            isColumnEditableCellRequired: `${bindingPrefixForInlineEditValidationControl}${binding}${oldBindingSuffixForInlineEditValidationControl("Table")}`,
            min: `${bindingPrefixForInlineEditValidationControl}${binding}${oldBindingSuffixForInlineEditValidationControl("Table")}`,
            max: `${bindingPrefixForInlineEditValidationControl}${binding}${oldBindingSuffixForInlineEditValidationControl("Table")}`,
            regex: `${bindingPrefixForInlineEditValidationControl}${binding}${oldBindingSuffixForInlineEditValidationControl("Table")}`,
          },
        },
      },
    },
  ],
} as any as DSLWidget;

export const currentRownInValidationsBindingOutput = {
  children: [
    {
      widgetName: "Table",
      type: "TABLE_WIDGET_V2",
      primaryColumns: {
        step: {
          validation: {
            isColumnEditableCellValid: `${bindingPrefixForInlineEditValidProperty}${binding}${newBindingSuffixForInlineEditValidProperty(
              "Table",
              "step",
            )}`,
            errorMessage: `${bindingPrefixForInlineEditValidationControl}${binding}${newBindingSuffixForInlineEditValidationControl("Table")}`,
            isColumnEditableCellRequired: `${bindingPrefixForInlineEditValidationControl}${binding}${newBindingSuffixForInlineEditValidationControl("Table")}`,
            min: `${bindingPrefixForInlineEditValidationControl}${binding}${newBindingSuffixForInlineEditValidationControl("Table")}`,
            max: `${bindingPrefixForInlineEditValidationControl}${binding}${newBindingSuffixForInlineEditValidationControl("Table")}`,
            regex: `${bindingPrefixForInlineEditValidationControl}${binding}${newBindingSuffixForInlineEditValidationControl("Table")}`,
          },
        },
      },
    },
  ],
} as any as DSLWidget;
