import type { AppState } from "ee/reducers";
import { get } from "lodash";
import type { LintError } from "utils/DynamicBindingUtils";

const emptyLint: LintError[] = [];

export const getEntityLintErrors = (state: AppState, path?: string) => {
  if (!path) return emptyLint;
  return get(state.linting.errors, path, emptyLint);
};
