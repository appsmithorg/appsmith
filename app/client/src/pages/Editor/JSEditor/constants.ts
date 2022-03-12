import { OptionProps } from "components/ads";
import { JSActionDropdownOption } from "./utils";

export const ECMA_VERSION = 11;
export const RUN_BUTTON_DEFAULTS = {
  HEIGHT: "30px",
  CTA_TEXT: "RUN",
  // space between button and dropdown
  GAP_SIZE: "10px",
};
export const NO_SELECTION_DROPDOWN_OPTION: JSActionDropdownOption = {
  label: "No function selected",
  value: "",
  data: null,
};
export const NO_FUNCTION_DROPDOWN_OPTION: JSActionDropdownOption = {
  label: "No function available",
  value: "",
  data: null,
};
export const SETTINGS_HEADINGS = [
  {
    text: "Function Name",
    hasInfo: false,
    key: "func_name",
  },
  {
    text: "Run on page load",
    hasInfo: true,
    info: "Allow function run when page loads",
    key: "run_on_pageload",
  },
  {
    text: "Confirm before calling ",
    hasInfo: true,
    info: "Ask for confirmation before executing function",
    key: "run_before_calling",
  },
];
export const RADIO_OPTIONS: OptionProps[] = [
  {
    label: "Yes",
    value: "true",
  },
  {
    label: "No",
    value: "false",
  },
];
export const RUN_GUTTER_ID = "run-gutter";
export const RUN_GUTTER_CLASSNAME = "run-marker-gutter";
export const JS_OBJECT_HOTKEYS_CLASSNAME = "js-object-hotkeys";

/* Indicates the mode the code should be parsed in. 
This influences global strict mode and parsing of import and export declarations.
*/
export enum SourceType {
  script = "script",
  module = "module",
}
export enum NodeTypes {
  MemberExpression = "MemberExpression",
  Identifier = "Identifier",
  VariableDeclarator = "VariableDeclarator",
  FunctionDeclaration = "FunctionDeclaration",
  FunctionExpression = "FunctionExpression",
  AssignmentPattern = "AssignmentPattern",
  Literal = "Literal",
  ExportDefaultDeclaration = "ExportDefaultDeclaration",
  Property = "Property",
}
