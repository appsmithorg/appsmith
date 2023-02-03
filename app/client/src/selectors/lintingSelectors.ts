import { AppState } from "@appsmith/reducers";
import { get } from "lodash";
import { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";

const emptyLint: LintErrors = {};

export const getEntityLintErrors = (state: AppState, path?: string) => {
  if (!path) return emptyLint;
  return get(state.linting.errors, path, emptyLint);
};
