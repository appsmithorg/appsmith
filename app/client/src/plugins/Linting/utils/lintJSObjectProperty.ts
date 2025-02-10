import type { LintError } from "utils/DynamicBindingUtils";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import { CustomLintErrorCode, CUSTOM_LINT_ERRORS } from "../constants";
import type {
  TJSFunctionPropertyState,
  TJSpropertyState,
} from "workers/Evaluation/JSObject/jsPropertiesState";
import { globalData } from "../globalData";
import getLintSeverity from "./getLintSeverity";
import lintJSProperty from "./lintJSProperty";
import isEmpty from "lodash/isEmpty";
import type { WebworkerTelemetryAttribute } from "../types";

export default function lintJSObjectProperty(
  jsPropertyFullName: string,
  jsObjectState: Record<string, TJSpropertyState>,
  asyncJSFunctionsInDataFields: DependencyMap,
  webworkerTelemetry: Record<string, WebworkerTelemetryAttribute>,
) {
  let lintErrors: LintError[] = [];
  const { propertyPath: jsPropertyName } =
    getEntityNameAndPropertyPath(jsPropertyFullName);
  const jsPropertyState = jsObjectState[jsPropertyName];
  const isAsyncJSFunctionBoundToSyncField =
    asyncJSFunctionsInDataFields.hasOwnProperty(jsPropertyFullName) &&
    !isEmpty(asyncJSFunctionsInDataFields[jsPropertyFullName]);

  const jsPropertyLintErrors = lintJSProperty(
    jsPropertyFullName,
    jsPropertyState,
    globalData.getGlobalData(!isAsyncJSFunctionBoundToSyncField),
    webworkerTelemetry,
  );

  lintErrors = lintErrors.concat(jsPropertyLintErrors);

  // if function is async, and bound to a data field, then add custom lint error
  if (isAsyncJSFunctionBoundToSyncField) {
    lintErrors.push(
      generateAsyncFunctionBoundToDataFieldCustomError(
        asyncJSFunctionsInDataFields[jsPropertyFullName],
        jsPropertyState,
        jsPropertyFullName,
      ),
    );
  }

  return lintErrors;
}

function generateAsyncFunctionBoundToDataFieldCustomError(
  dataFieldBindings: string[],
  jsPropertyState: TJSpropertyState,
  jsPropertyFullName: string,
): LintError {
  const { propertyPath: jsPropertyName } =
    getEntityNameAndPropertyPath(jsPropertyFullName);
  const lintErrorMessage =
    CUSTOM_LINT_ERRORS.ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD(
      dataFieldBindings,
      jsPropertyFullName,
      (jsPropertyState as TJSFunctionPropertyState).isMarkedAsync,
    );

  return {
    errorType: PropertyEvaluationErrorType.LINT,
    raw: jsPropertyState.value,
    severity: getLintSeverity(
      CustomLintErrorCode.ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD,
      lintErrorMessage,
    ),
    errorMessage: {
      name: "LintingError",
      message: lintErrorMessage,
    },
    errorSegment: jsPropertyFullName,
    originalBinding: jsPropertyState.value,
    // By keeping track of these variables we can highlight the exact text that caused the error.
    variables: [jsPropertyName, null, null, null],
    code: CustomLintErrorCode.ASYNC_FUNCTION_BOUND_TO_SYNC_FIELD,
    line: jsPropertyState.position.keyStartLine - 1,
    ch: jsPropertyState.position.keyStartColumn + 1,
    originalPath: jsPropertyFullName,
  };
}
