export const tableComputeBindingInputDsl = {
  widgetName: "Table1",
  type: "TABLE_WIDGET_V2",
  primaryColumns: {
    column1: {
      computedValue:
        "{{Table1.processedTableData.map((currentRow, currentIndex) => (currentRow.value))}}",
    },
    column2: {
      computedValue: "static value",
    },
  },
  version: 1,
  children: [],
};

export const tableComputeBindingOutputDsl = {
  ...tableComputeBindingInputDsl,
  primaryColumns: {
    column1: {
      computedValue:
        "{{(() => { const tableData = Table1.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (currentRow.value)) : currentRow.value })()}}",
    },
    column2: {
      computedValue: "static value",
    },
  },
};
