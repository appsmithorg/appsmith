/**
 * Generate parent row id from current row id and depth
 * @param rowId {string} The row id - example input: "1.1.1"
 * @param rowDepth {number} The row depth - example input: 2
 * @returns parent row's id - example output: "1.1"
 */
export const getParentId = (rowId: string, rowDepth: number) => {
  return rowId.split(".").slice(0, rowDepth).join(".");
};
