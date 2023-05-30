import { getLintErrorsFromTree } from "Linting";
import type { LintTreeRequestPayload, LintTreeResponse } from "Linting/types";

export function lintTree(data: LintTreeRequestPayload): LintTreeResponse {
  const lintTreeResponse: LintTreeResponse = {
    errors: {},
    updatedJSEntities: [],
  };
  try {
    const {
      asyncJSFunctionsInDataFields,
      cloudHosting,
      configTree,
      jsPropertiesState,
      pathsToLint,
      unevalTree: unEvalTree,
    } = data as LintTreeRequestPayload;
    const { errors: lintErrors, updatedJSEntities } = getLintErrorsFromTree({
      pathsToLint,
      unEvalTree,
      jsPropertiesState,
      cloudHosting,
      asyncJSFunctionsInDataFields,
      configTree,
    });

    lintTreeResponse.errors = lintErrors;
    lintTreeResponse.updatedJSEntities = updatedJSEntities;
  } catch (e) {}
  return lintTreeResponse;
}
