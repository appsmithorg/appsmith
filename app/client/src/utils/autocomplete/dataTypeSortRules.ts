import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";

export const PriorityOrder: Record<AutocompleteDataType, string[]> = {
  STRING: ["selectedRow", "data", "text"],
  NUMBER: ["selectedRow", "data", "text"],
  OBJECT: [],
  ARRAY: [],
  FUNCTION: ["run()"],
  BOOLEAN: ["selectedRow", "data"],
  UNKNOWN: ["selectedRow", "data", "run()"],
};

export const DataTreeFunctionSortOrder = [
  "storeValue()",
  "showAlert()",
  "navigateTo()",
  "showModal()",
  "setInterval()",
];
