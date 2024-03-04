import { AutocompleteDataType } from "./AutocompleteDataType";
import type { Completion } from "./types";

export const createCompletionHeader = (name: string): Completion<any> => ({
  text: name,
  displayText: name,
  className: "CodeMirror-hint-header",
  data: { doc: "" },
  origin: "",
  type: AutocompleteDataType.UNKNOWN,
  isHeader: true,
});
