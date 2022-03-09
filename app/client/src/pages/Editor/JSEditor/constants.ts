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
export const RUN_GUTTER_ID = "run-gutter";
export const RUN_GUTTER_CLASSNAME = "run-marker-gutter";

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
