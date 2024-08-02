import type { DSLWidget } from "../../../types";

const bindingPrefix = `{{
    (
      (editedValue, currentRow, currentIndex) => (
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

const binding = "true";
export const currentRownInValidationsBindingInput = {
  children: [
    {
      widgetName: "Table",
      type: "TABLE_WIDGET_V2",
      primaryColumns: {
        step: {
          validation: {
            isColumnEditableCellValid: `${bindingPrefix}${binding}${oldBindingSuffix(
              "Table",
              "step",
            )}`,
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
            isColumnEditableCellValid: `${bindingPrefix}${binding}${newBindingSuffix(
              "Table",
              "step",
            )}`,
          },
        },
      },
    },
  ],
} as any as DSLWidget;
