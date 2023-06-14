import type { LintTreeResponse } from "Linting/types";
import { getLintErrorsFromTree } from "Linting/utils/lintTree";

export function lintTree(data: any): LintTreeResponse {
  const lintTreeResponse: LintTreeResponse = {
    errors: {},
    lintedJSPaths: [],
    jsPropertiesState: {},
  };
  try {
    const { cloudHosting, configTree, unevalTree: unEvalTree } = data;
    const { errors: lintErrors, lintedJSPaths } = getLintErrorsFromTree({
      unEvalTree,
      cloudHosting,
      configTree,
    } as any);
    lintTreeResponse.errors = lintErrors;
    lintTreeResponse.lintedJSPaths = lintedJSPaths;
  } catch (e) {}
  return lintTreeResponse;
}
