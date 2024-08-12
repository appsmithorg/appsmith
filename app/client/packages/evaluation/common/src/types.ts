import type { EvalErrorTypes } from "./enums";

export interface OverrideDependency {
  DEFAULT: string;
  META: string;
}

export interface BindingsInfo {
  references: string[];
  errors: EvalError[];
}

export interface EvalError {
  type: EvalErrorTypes;
  message: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>;
}

export type DataTreeEntity = any;
export type JSActionEntity = any;
