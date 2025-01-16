import type { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

export const PriorityOrder: Record<AutocompleteDataType, string[]> = {
  STRING: ["selectedRow", "data", "text", "selectedOptionValue", "value"],
  NUMBER: ["selectedRow", "pageOffset", "pageSize", "data", "text"],
  OBJECT: ["FormData"],
  ARRAY: ["selectedOptionValues", "selectedValues"],
  FUNCTION: ["run()"],
  BOOLEAN: ["isValid", "selectedRow", "data", "isChecked", "isSwitchedOn"],
  UNKNOWN: [
    "selectedRow",
    "data",
    "run()",
    "pageSize",
    "pageOffset",
    "selectedOptionValue",
    "text",
    "value",
  ],
};

export const DataTreeFunctionSortOrder = [
  "storeValue()",
  "showAlert()",
  "navigateTo()",
  "showModal()",
  "setInterval()",
];

export const blockedCompletions = ["Function()", "MainContainer"];
