import { removeSpecialChars } from "utils/helpers";

export const getAllTableColumnKeys = (
  tableData: Array<Record<string, unknown>>,
) => {
  const columnKeys: string[] = [];
  for (let i = 0, tableRowCount = tableData.length; i < tableRowCount; i++) {
    const row = tableData[i];
    for (const key in row) {
      // Replace all special characters to _, limit key length to 200 characters.
      const sanitizedKey = removeSpecialChars(key, 200);
      if (!columnKeys.includes(sanitizedKey)) {
        columnKeys.push(sanitizedKey);
      }
    }
  }
  return columnKeys;
};
