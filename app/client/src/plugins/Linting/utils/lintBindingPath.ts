import type { LintError } from "utils/DynamicBindingUtils";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { getScriptToEval, getScriptType } from "workers/Evaluation/evaluate";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import type { lintBindingPathProps } from "../types";
import getLintingErrors from "./getLintingErrors";
import { getJSToLint } from "./getJSToLint";

export default function lintBindingPath({
  dynamicBinding,
  entity,
  fullPropertyPath,
  globalData,
  webworkerTelemetry,
}: lintBindingPathProps) {
  let lintErrors: LintError[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  // Get the {{binding}} bound values
  const { jsSnippets, stringSegments } = getDynamicBindings(
    dynamicBinding,
    entity,
  );

  if (stringSegments) {
    jsSnippets.forEach((jsSnippet, index) => {
      if (jsSnippet) {
        const jsSnippetToLint = getJSToLint(entity, jsSnippet, propertyPath);
        // {{user's code}}
        const originalBinding = getJSToLint(
          entity,
          stringSegments[index],
          propertyPath,
        );
        const scriptType = getScriptType(false, false);
        const scriptToLint = getScriptToEval(jsSnippetToLint, scriptType);
        const lintErrorsFromSnippet = getLintingErrors({
          script: scriptToLint,
          data: globalData,
          originalBinding,
          scriptType,
          webworkerTelemetry,
        });

        lintErrors = lintErrors.concat(lintErrorsFromSnippet);
      }
    });
  }

  return lintErrors;
}
