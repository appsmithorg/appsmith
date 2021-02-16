export const getAllTableColumnKeys = (
  tableData: Array<Record<string, unknown>>,
) => {
  const columnKeys: string[] = [];
  for (let i = 0, tableRowCount = tableData.length; i < tableRowCount; i++) {
    const row = tableData[i];
    for (const key in row) {
      if (!columnKeys.includes(key)) {
        columnKeys.push(key);
      }
    }
  }
  return columnKeys;
};
