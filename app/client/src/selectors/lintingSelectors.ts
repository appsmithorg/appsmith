import type { AppState } from "@appsmith/reducers";
import { get } from "lodash";
import type { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";
import type { LintError } from "utils/DynamicBindingUtils";

export const getAllLintErrors = (state: AppState): LintErrors =>
  state.linting.errors;

const emptyLint: LintError[] = [];

export const getEntityLintErrors = (state: AppState, path?: string) => {
  if (!path) return emptyLint;
  return get(state.linting.errors, path, emptyLint);
};
