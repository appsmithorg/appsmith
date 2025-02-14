/**
 * Processes an array of values or labels against a source data array.
 *
 * This function checks if all elements in the `valuesOrLabels` array are identical
 * and if the first element exists as a key in the objects of `sourceData`.
 * If both conditions are met, it returns an array of values from `sourceData`
 * corresponding to that key. Otherwise, it returns the original `valuesOrLabels` array.
 *
 * @example
 * const valuesOrLabels = ['name', 'name', 'name'];
 * const sourceData = [{ name: 'Alice' }, { name: 'Bob' }];
 * // Returns: ['Alice', 'Bob']
 * processOptionArray(valuesOrLabels, sourceData);
 *
 * @example
 * const valuesOrLabels = ['age', 'age', 'age'];
 * const sourceData = [{ name: 'Alice' }, { name: 'Bob' }];
 * // Returns: ['age', 'age', 'age']
 * processOptionArray(valuesOrLabels, sourceData);
 *
 * @example
 * const valuesOrLabels = ['name', 'age', 'name'];
 * const sourceData = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
 * // Returns: ['name', 'age', 'name']
 * processOptionArray(valuesOrLabels, sourceData);
 */
export const processOptionArray = (
  valuesOrLabels: string[],
  sourceData: Record<string, unknown>[],
) => {
  if (!sourceData.length) return [];

  const allEqual = valuesOrLabels.every((item, _, arr) => item === arr[0]);
  const keyExistsInSource = valuesOrLabels[0] in sourceData[0];

  return allEqual && keyExistsInSource
    ? sourceData.map((d) => d[valuesOrLabels[0]])
    : valuesOrLabels;
};
