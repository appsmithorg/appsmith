import { AppState } from "@appsmith/reducers";
import { get } from "lodash";
import { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";

export const getAllLintErrors = (state: AppState): LintErrors =>
  state.linting.errors;

export const getEntityLintErrors = (state: AppState, path: string) => {
  return get(state.linting.errors, path) ?? [];
};
