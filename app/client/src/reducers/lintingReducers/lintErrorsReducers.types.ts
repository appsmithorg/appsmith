import type { Severity } from "entities/AppsmithConsole";
import type { SetLintErrorsAction } from "actions/lintingActions";

// Import base types
export interface DataTreeError {
  raw: string;
  errorMessage: Error;
  severity: Severity.WARNING | Severity.ERROR;
}

export enum PropertyEvaluationErrorType {
  VALIDATION = "VALIDATION",
  PARSE = "PARSE",
  LINT = "LINT",
}

export interface LintError extends DataTreeError {
  errorType: PropertyEvaluationErrorType.LINT;
  errorSegment: string;
  originalBinding: string;
  variables: (string | undefined | null)[];
  code: string;
  line: number;
  ch: number;
  originalPath?: string;
  lintLength?: number;
}

export type LintErrorsStore = Record<string, LintError[]>;

// Re-export imported types for backward compatibility
export type { SetLintErrorsAction, Severity };
