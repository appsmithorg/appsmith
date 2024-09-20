import type { JSActionEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { LintError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { getScriptToEval, getScriptType } from "workers/Evaluation/evaluate";
import {
  INVALID_JSOBJECT_START_STATEMENT,
  INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE,
  JS_OBJECT_START_STATEMENT,
} from "../constants";
import { Severity } from "entities/AppsmithConsole";
import { getJSToLint } from "./getJSToLint";
import getLintingErrors from "./getLintingErrors";

export default function lintJSObjectBody(
  jsObjectName: string,
  globalData: DataTree,
): LintError[] {
  const jsObject = globalData[jsObjectName];
  const rawJSObjectbody = (jsObject as unknown as JSActionEntity).body;

  if (!rawJSObjectbody) return [];

  if (!rawJSObjectbody.startsWith(JS_OBJECT_START_STATEMENT)) {
    return [
      {
        errorType: PropertyEvaluationErrorType.LINT,
        errorSegment: "",
        originalBinding: rawJSObjectbody,
        line: 0,
        ch: 0,
        code: INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE,
        variables: [],
        raw: rawJSObjectbody,
        errorMessage: {
          name: "LintingError",
          message: INVALID_JSOBJECT_START_STATEMENT,
        },
        severity: Severity.ERROR,
      },
    ];
  }

  const scriptType = getScriptType(false, false);
  const jsbodyToLint = getJSToLint(jsObject, rawJSObjectbody, "body"); // remove "export default"
  const scriptToLint = getScriptToEval(jsbodyToLint, scriptType);

  return getLintingErrors({
    script: scriptToLint,
    data: globalData,
    originalBinding: jsbodyToLint,
    scriptType,
  });
}
