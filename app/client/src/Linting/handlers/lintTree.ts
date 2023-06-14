import type { LintTreeResponse } from "Linting/types";
import { getLintErrorsFromTree } from "Linting/utils/lintTree";

export function lintTree(data: any): LintTreeResponse {
  const lintTreeResponse: LintTreeResponse = {
    errors: {},
    updatedJSEntities: [],
    jsPropertiesState: {},
  };
  try {
    const { cloudHosting, configTree, unevalTree: unEvalTree } = data;
    const { errors: lintErrors, updatedJSEntities } = getLintErrorsFromTree({
      unEvalTree,
      cloudHosting,
      configTree,
    } as any);
    lintTreeResponse.errors = lintErrors;
    lintTreeResponse.updatedJSEntities = updatedJSEntities;
  } catch (e) {}
  return lintTreeResponse;
}
