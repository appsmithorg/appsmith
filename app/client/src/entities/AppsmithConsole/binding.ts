import { ActionableError } from "entities/AppsmithConsole";

export enum BindingError {
  SYNTAX = "binding:syntax",
  UNKNOWN_VARIABLE = "binding:unknown_variable",
  DISALLOWED_FUNCTION = "binding:disallowed_function",
}

interface BaseBindingError extends ActionableError {
  lineNumber: number;
  position: number;
}

export interface SyntaxError extends BaseBindingError {
  type: BindingError.SYNTAX;
}

export interface UnknownVariableError extends BaseBindingError {
  type: BindingError.UNKNOWN_VARIABLE;
  variableName: string;
}

export interface DisallowedFunctionError extends BaseBindingError {
  type: BindingError.DISALLOWED_FUNCTION;
  functionName: string;
}
