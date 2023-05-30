import type { DataTree } from "entities/DataTree/dataTreeFactory";
import type { LintError } from "utils/DynamicBindingUtils";
import { isNil } from "lodash";
import {
  EvaluationScriptType,
  getScriptToEval,
  getScriptType,
} from "workers/Evaluation/evaluate";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { TJSpropertyState } from "workers/Evaluation/JSObject/jsPropertiesState";
import getLintingErrors from "./getLintingErrors";

export default function lintJSProperty(
  jsPropertyFullName: string,
  jsPropertyState: TJSpropertyState,
  globalData: DataTree,
): LintError[] {
  if (isNil(jsPropertyState)) {
    return [];
  }
  const { propertyPath: jsPropertyPath } =
    getEntityNameAndPropertyPath(jsPropertyFullName);
  const scriptType = getScriptType(false, false);
  const scriptToLint = getScriptToEval(
    jsPropertyState.value,
    EvaluationScriptType.OBJECT_PROPERTY,
  );
  const propLintErrors = getLintingErrors({
    script: scriptToLint,
    data: globalData,
    originalBinding: jsPropertyState.value,
    scriptType,
    options: { isJsObject: true },
  });
  const refinedErrors = propLintErrors.map((lintError) => {
    return {
      ...lintError,
      line: lintError.line + jsPropertyState.position.startLine - 1,
      ch:
        lintError.line === 0
          ? lintError.ch + jsPropertyState.position.startColumn
          : lintError.ch,
      originalPath: jsPropertyPath,
    };
  });

  return refinedErrors;
}
