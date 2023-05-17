import type { BaseAclProps } from "../types";

/**
 * Generate filtered data
 * @param arr {{id: string, name: string}[]} The original array of objects
 * @param filterBy {{id: string, name: string}} The object that has to be used for filtering the array
 * @param equalCheck {boolean} Check for how the filtering has to be done
 * @returns filtered array of objects
 */
export const getFilteredData = (
  arr: BaseAclProps[],
  filterBy: BaseAclProps,
  equalCheck: boolean,
) => {
  let filteredArr = [];
  if (equalCheck) {
    filteredArr = arr.filter((data) => data.id === filterBy.id);
  } else {
    filteredArr = arr.filter((data) => data.id !== filterBy.id);
  }
  return filteredArr;
};
