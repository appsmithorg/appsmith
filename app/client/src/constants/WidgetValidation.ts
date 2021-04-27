import { WidgetProps } from "widgets/BaseWidget";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { EXECUTION_PARAM_KEY } from "constants/AppsmithActionConstants/ActionConstants";

// Always add a validator function in ./worker/validation for these types
export enum ValidationTypes {
  TEXT = "TEXT",
  REGEX = "REGEX",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  OBJECT = "OBJECT",
  ARRAY = "ARRAY",
  OBJECT_ARRAY = "OBJECT_ARRAY",
  DATE_ISO_STRING = "DATE_ISO_STRING",
  DEFAULT_OPTION_VALUE = "DEFAULT_OPTION_VALUE",
  DEFAULT_SELECTED_ROW = "DEFAULT_SELECTED_ROW",
  SELECTED_TAB = "SELECTED_TAB",
  DATE_STRING = "DATE_STRING",
  DEFAULT_DATE = "DEFAULT_DATE",
  ACTION_SELECTOR = "ACTION_SELECTOR",
  ARRAY_ACTION_SELECTOR = "ARRAY_ACTION_SELECTOR",
}

export type ValidationResponse = {
  isValid: boolean;
  parsed: any;
  message?: string;
  transformed?: any;
};

export type Validator = (
  value: any,
  props: WidgetProps,
  dataTree?: DataTree,
  property?: string,
) => ValidationResponse;

export const ISO_DATE_FORMAT = "YYYY-MM-DDTHH:mm:ss.sssZ";

export const JAVASCRIPT_KEYWORDS = {
  true: "true",
  await: "await",
  break: "break",
  case: "case",
  catch: "catch",
  class: "class",
  const: "const",
  continue: "continue",
  debugger: "debugger",
  default: "default",
  delete: "delete",
  do: "do",
  else: "else",
  enum: "enum",
  export: "export",
  extends: "extends",
  false: "false",
  finally: "finally",
  for: "for",
  function: "function",
  if: "if",
  implements: "implements",
  import: "import",
  in: "in",
  instanceof: "instanceof",
  interface: "interface",
  let: "let",
  new: "new",
  null: "null",
  package: "package",
  private: "private",
  protected: "protected",
  public: "public",
  return: "return",
  static: "static",
  super: "super",
  switch: "switch",
  this: "this",
  throw: "throw",
  try: "try",
  typeof: "typeof",
  var: "var",
  void: "void",
  while: "while",
  with: "with",
  yield: "yield",
};

export const DATA_TREE_KEYWORDS = {
  actionPaths: "actionPaths",
  appsmith: "appsmith",
  pageList: "pageList",
  [EXECUTION_PARAM_KEY]: EXECUTION_PARAM_KEY,
};
