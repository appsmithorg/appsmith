import { AutocompleteDataType } from "utils/autocomplete/TernServer";

export const PriorityOrder: Record<AutocompleteDataType, string[]> = {
  STRING: ["selectedRow", "data"],
  NUMBER: ["selectedRow", "data"],
  OBJECT: [],
  ARRAY: [],
  FUNCTION: ["run()"],
  BOOLEAN: ["selectedRow", "data"],
  UNKNOWN: ["selectedRow", "data", "run()"],
};
