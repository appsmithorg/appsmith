import type { DefaultRootState } from "react-redux";
import { get } from "lodash";
import type { LintError } from "utils/DynamicBindingUtils";

const emptyLint: LintError[] = [];

export const getEntityLintErrors = (state: DefaultRootState, path?: string) => {
  if (!path) return emptyLint;

  return get(state.linting.errors, path, emptyLint);
};
