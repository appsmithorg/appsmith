import type { Position } from "codemirror";
import type { LintError } from "utils/DynamicBindingUtils";
import { JSHINT as jshint } from "jshint";
import type { LintError as JSHintError } from "jshint";
import { get, isEmpty, isNumber, keys } from "lodash";
import type {
  MemberExpressionData,
  AssignmentExpressionData,
  CallExpressionData,
  MemberCallExpressionData,
} from "@shared/ast";
import {
  extractExpressionsFromCode,
  isIdentifierNode,
  isLiteralNode,
} from "@shared/ast";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import type { EvaluationScriptType } from "workers/Evaluation/evaluate";
import { EvaluationScripts, ScriptTemplate } from "workers/Evaluation/evaluate";
import {
  asyncActionInSyncFieldLintMessage,
  CustomLintErrorCode,
  CUSTOM_LINT_ERRORS,
  IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE,
  IGNORED_LINT_ERRORS,
  lintOptions,
  SUPPORTED_WEB_APIS,
  LINTER_TYPE,
} from "../constants";
import type { getLintingErrorsProps } from "../types";
import { JSLibraries } from "workers/common/JSLibrary";
import getLintSeverity from "./getLintSeverity";
import { APPSMITH_GLOBAL_FUNCTIONS } from "components/editorComponents/ActionCreator/constants";
import { last } from "lodash";
import { isWidget } from "ee/workers/Evaluation/evaluationUtils";
import setters from "workers/Evaluation/setters";
import { isMemberExpressionNode } from "@shared/ast/src";
import { generate } from "astring";
import getInvalidModuleInputsError from "ee/plugins/Linting/utils/getInvalidModuleInputsError";
import { objectKeys } from "@appsmith/utils";
import { profileFn } from "UITelemetry/generateWebWorkerTraces";
import { WorkerEnv } from "workers/Evaluation/handlers/workerEnv";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { Linter } from "eslint-linter-browserify";

const EvaluationScriptPositions: Record<string, Position> = {};

function getLinterType() {
  let linterType = LINTER_TYPE.JSHINT;

  const flagValues = WorkerEnv.getFeatureFlags();

  if (flagValues?.[FEATURE_FLAG.rollout_eslint_enabled]) {
    linterType = LINTER_TYPE.ESLINT;
  }

  return linterType;
}

function getEvaluationScriptPosition(scriptType: EvaluationScriptType) {
  if (isEmpty(EvaluationScriptPositions)) {
    // We are computing position of <<script>> in our templates.
    // This will be used to get the exact location of error in linting
    keys(EvaluationScripts).forEach((type) => {
      EvaluationScriptPositions[type] = getPositionInEvaluationScript(
        type as EvaluationScriptType,
      );
    });
  }

  return EvaluationScriptPositions[scriptType];
}

function generateLintingGlobalData(data: Record<string, unknown>) {
  const globalData: Record<string, boolean> = {};

  for (const dataKey in data) {
    globalData[dataKey] = true;
  }

  // Add all js libraries
  const libAccessors = ([] as string[]).concat(
    ...JSLibraries.map((lib) => lib.accessor),
  );

  libAccessors.forEach((accessor) => (globalData[accessor] = true));
  // Add all supported web apis
  objectKeys(SUPPORTED_WEB_APIS).forEach(
    (apiName) => (globalData[apiName] = true),
  );

  return globalData;
}

function sanitizeESLintErrors(
  lintErrors: Linter.LintMessage[],
  scriptPos: Position,
): Linter.LintMessage[] {
  return lintErrors.reduce((result: Linter.LintMessage[], lintError) => {
    // Ignored errors should not be reported
    if (IGNORED_LINT_ERRORS.includes(lintError.ruleId || "")) return result;

    /** Some error messages reference line numbers,
     * Eg. Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'
     * these line numbers need to be re-calculated based on the binding location.
     * Errors referencing line numbers outside the user's script should also be ignored
     * */
    let message = lintError.message;
    const matchedLines = message.match(/line \d/gi);
    const lineNumbersInErrorMessage = new Set<number>();
    let isInvalidErrorMessage = false;

    if (matchedLines) {
      matchedLines.forEach((lineStatement) => {
        const digitString = lineStatement.split(" ")[1];
        const digit = Number(digitString);

        if (isNumber(digit)) {
          if (digit < scriptPos.line) {
            // referenced line number is outside the scope of user's script
            isInvalidErrorMessage = true;
          } else {
            lineNumbersInErrorMessage.add(digit);
          }
        }
      });
    }

    if (isInvalidErrorMessage) return result;

    if (lineNumbersInErrorMessage.size) {
      Array.from(lineNumbersInErrorMessage).forEach((lineNumber) => {
        message = message.replaceAll(
          `line ${lineNumber}`,
          `line ${lineNumber - scriptPos.line + 1}`,
        );
      });
    }

    result.push({
      ...lintError,
      message,
    });

    return result;
  }, []);
}

function sanitizeJSHintErrors(
  lintErrors: JSHintError[],
  scriptPos: Position,
): JSHintError[] {
  return lintErrors.reduce((result: JSHintError[], lintError) => {
    // Ignored errors should not be reported
    if (IGNORED_LINT_ERRORS.includes(lintError.code)) return result;

    /** Some error messages reference line numbers,
     * Eg. Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'
     * these line numbers need to be re-calculated based on the binding location.
     * Errors referencing line numbers outside the user's script should also be ignored
     * */
    let message = lintError.reason;
    const matchedLines = message.match(/line \d/gi);
    const lineNumbersInErrorMessage = new Set<number>();
    let isInvalidErrorMessage = false;

    if (matchedLines) {
      matchedLines.forEach((lineStatement) => {
        const digitString = lineStatement.split(" ")[1];
        const digit = Number(digitString);

        if (isNumber(digit)) {
          if (digit < scriptPos.line) {
            // referenced line number is outside the scope of user's script
            isInvalidErrorMessage = true;
          } else {
            lineNumbersInErrorMessage.add(digit);
          }
        }
      });
    }

    if (isInvalidErrorMessage) return result;

    if (lineNumbersInErrorMessage.size) {
      Array.from(lineNumbersInErrorMessage).forEach((lineNumber) => {
        message = message.replaceAll(
          `line ${lineNumber}`,
          `line ${lineNumber - scriptPos.line + 1}`,
        );
      });
    }

    result.push({
      ...lintError,
      reason: message,
    });

    return result;
  }, []);
}

const getLintErrorMessage = (
  reason: string,
  code: string,
  variables: string[],
  isJSObject = false,
): string => {
  switch (code) {
    case IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE: {
      return getRefinedW117Error(variables[0], reason, isJSObject);
    }
    default: {
      return reason;
    }
  }
};

function convertESLintErrorToAppsmithLintError(
  eslintError: Linter.LintMessage,
  script: string,
  originalBinding: string,
  scriptPos: Position,
  //isJSObject = false,
): LintError {
  const { column, endColumn = 0, line, message, ruleId } = eslintError;

  // Compute actual error position
  const actualErrorLineNumber = line - scriptPos.line;
  const actualErrorCh =
    line === scriptPos.line
      ? eslintError.column - scriptPos.ch
      : eslintError.column;
  //const lintErrorMessage = getLintErrorMessage(
  //  reason,
  //  code,
  //  [a, b, c, d],
  //  isJSObject,
  //);

  return {
    errorType: PropertyEvaluationErrorType.LINT,
    raw: script,
    severity: getLintSeverity(ruleId || "", message),
    errorMessage: {
      name: "LintingError",
      message: message,
    },
    errorSegment: "",
    originalBinding,
    // By keeping track of these variables we can highlight the exact text that caused the error.
    variables: [],
    lintLength: Math.max(endColumn - column, 0),
    code: ruleId || "",
    line: actualErrorLineNumber,
    ch: actualErrorCh,
  };
}

function convertJsHintErrorToAppsmithLintError(
  jsHintError: JSHintError,
  script: string,
  originalBinding: string,
  scriptPos: Position,
  isJSObject = false,
): LintError {
  const { a, b, c, code, d, evidence, reason } = jsHintError;

  // Compute actual error position
  const actualErrorLineNumber = jsHintError.line - scriptPos.line;
  const actualErrorCh =
    jsHintError.line === scriptPos.line
      ? jsHintError.character - scriptPos.ch
      : jsHintError.character;
  const lintErrorMessage = getLintErrorMessage(
    reason,
    code,
    [a, b, c, d],
    isJSObject,
  );

  return {
    errorType: PropertyEvaluationErrorType.LINT,
    raw: script,
    severity: getLintSeverity(code, lintErrorMessage),
    errorMessage: {
      name: "LintingError",
      message: lintErrorMessage,
    },
    errorSegment: evidence,
    originalBinding,
    // By keeping track of these variables we can highlight the exact text that caused the error.
    variables: [a, b, c, d],
    code: code,
    line: actualErrorLineNumber,
    ch: actualErrorCh,
  };
}

export default function getLintingErrors({
  data,
  getLinterTypeFn = getLinterType,
  options,
  originalBinding,
  script,
  scriptType,
  webworkerTelemetry,
}: getLintingErrorsProps): LintError[] {
  const linterType = getLinterTypeFn();
  const scriptPos = getEvaluationScriptPosition(scriptType);
  const lintingGlobalData = generateLintingGlobalData(data);
  const lintingOptions = lintOptions(lintingGlobalData, linterType);

  let messages: Linter.LintMessage[] = [];
  let lintErrors: LintError[] = [];

  profileFn(
    "Linter",
    // adding some metrics to compare the performance changes with eslint
    {
      linter: linterType,
      linesOfCodeLinted: originalBinding.split("\n").length,
      codeSizeInChars: originalBinding.length,
    },
    webworkerTelemetry,
    () => {
      if (linterType === LINTER_TYPE.JSHINT) {
        jshint(script, lintingOptions);
      } else if (linterType === LINTER_TYPE.ESLINT) {
        const linter = new Linter();

        messages = linter.verify(script, lintingOptions);
      }
    },
  );

  if (linterType === LINTER_TYPE.JSHINT) {
    const sanitizedJSHintErrors = sanitizeJSHintErrors(
      jshint.errors,
      scriptPos,
    );

    lintErrors = sanitizedJSHintErrors.map((lintError) =>
      convertJsHintErrorToAppsmithLintError(
        lintError,
        script,
        originalBinding,
        scriptPos,
        options?.isJsObject,
      ),
    );
  } else {
    const sanitizedESLintErrors = sanitizeESLintErrors(messages, scriptPos);

    lintErrors = sanitizedESLintErrors.map((lintError) =>
      convertESLintErrorToAppsmithLintError(
        lintError,
        script,
        originalBinding,
        scriptPos,
      ),
    );
  }

  const customLintErrors = getCustomErrorsFromScript(
    script,
    data,
    scriptPos,
    originalBinding,
    options?.isJsObject,
  );

  return lintErrors.concat(customLintErrors);
}

function getInvalidWidgetPropertySetterErrors({
  assignmentExpressions,
  data,
  originalBinding,
  script,
  scriptPos,
}: {
  data: Record<string, unknown>;
  assignmentExpressions: AssignmentExpressionData[];
  scriptPos: Position;
  originalBinding: string;
  script: string;
}) {
  const invalidWidgetPropertySetterErrors: LintError[] = [];
  const setterAccessorMap = setters.getSetterAccessorMap();

  for (const { object, parentNode, property } of assignmentExpressions) {
    if (!isIdentifierNode(object)) continue;

    const assignmentExpressionString = generate(parentNode);
    const objectName = object.name;
    const propertyName = isLiteralNode(property)
      ? (property.value as string)
      : property.name;

    const entity = data[objectName];

    if (!entity || !isWidget(entity)) continue;

    const isValidProperty = propertyName in entity;

    const methodName = get(setterAccessorMap, `${objectName}.${propertyName}`);

    const lintErrorMessage = CUSTOM_LINT_ERRORS[
      CustomLintErrorCode.INVALID_WIDGET_PROPERTY_SETTER
    ](methodName, objectName, propertyName, isValidProperty);

    // line position received after AST parsing is 1 more than the actual line of code, hence we subtract 1 to get the actual line number
    const objectStartLine = object.loc.start.line - 1;

    // AST parsing start column position from index 0 whereas codemirror start ch position from index 1, hence we add 1 to get the actual ch position
    const objectStartCol = object.loc.start.column + 1;

    invalidWidgetPropertySetterErrors.push({
      errorType: PropertyEvaluationErrorType.LINT,
      raw: script,
      severity: getLintSeverity(
        CustomLintErrorCode.INVALID_WIDGET_PROPERTY_SETTER,
        lintErrorMessage,
      ),
      errorMessage: {
        name: "LintingError",
        message: lintErrorMessage,
      },
      errorSegment: assignmentExpressionString,
      originalBinding,
      variables: [assignmentExpressionString, null, null],
      code: CustomLintErrorCode.INVALID_ENTITY_PROPERTY,
      line: objectStartLine - scriptPos.line,
      ch:
        objectStartLine === scriptPos.line
          ? objectStartCol - scriptPos.ch
          : objectStartCol,
    });
  }

  return invalidWidgetPropertySetterErrors;
}

function getInvalidAppsmithStoreSetterErrors({
  appsmithStoreMutationExpressions,
  originalBinding,
  script,
  scriptPos,
}: {
  data: Record<string, unknown>;
  appsmithStoreMutationExpressions: Array<
    AssignmentExpressionData | MemberCallExpressionData
  >;
  scriptPos: Position;
  originalBinding: string;
  script: string;
}) {
  const assignmentExpressionErrors: LintError[] = [];

  for (const { object, parentNode } of appsmithStoreMutationExpressions) {
    if (!isMemberExpressionNode(object)) continue;

    const assignmentExpressionString = generate(parentNode);

    if (!assignmentExpressionString.startsWith("appsmith.store")) continue;

    const lintErrorMessage =
      CUSTOM_LINT_ERRORS[
        CustomLintErrorCode.INVALID_APPSMITH_STORE_PROPERTY_SETTER
      ]();

    // line position received after AST parsing is 1 more than the actual line of code, hence we subtract 1 to get the actual line number
    const objectStartLine = object.loc.start.line - 1;

    // AST parsing start column position from index 0 whereas codemirror start ch position from index 1, hence we add 1 to get the actual ch position
    const objectStartCol = object.loc.start.column + 1;

    assignmentExpressionErrors.push({
      errorType: PropertyEvaluationErrorType.LINT,
      raw: script,
      severity: getLintSeverity(
        CustomLintErrorCode.INVALID_APPSMITH_STORE_PROPERTY_SETTER,
        lintErrorMessage,
      ),
      errorMessage: {
        name: "LintingError",
        message: lintErrorMessage,
      },
      errorSegment: assignmentExpressionString,
      originalBinding,
      variables: [assignmentExpressionString, null, null],
      code: CustomLintErrorCode.INVALID_APPSMITH_STORE_PROPERTY_SETTER,
      line: objectStartLine - scriptPos.line,
      ch:
        objectStartLine === scriptPos.line
          ? objectStartCol - scriptPos.ch
          : objectStartCol,
    });
  }

  return assignmentExpressionErrors;
}

function getInvalidEntityPropertyErrors(
  invalidTopLevelMemberExpressions: MemberExpressionData[],
  script: string,
  data: Record<string, unknown>,
  scriptPos: Position,
  originalBinding: string,
  isJSObject: boolean,
) {
  return invalidTopLevelMemberExpressions.map(
    ({ object, property }): LintError => {
      const propertyName = isLiteralNode(property)
        ? (property.value as string)
        : property.name;
      // line position received after AST parsing is 1 more than the actual line of code, hence we subtract 1 to get the actual line number
      const objectStartLine = object.loc.start.line - 1;
      // For computed member expressions (entity["property"]), add an extra 1 to the start column to account for "[".
      const propertyStartColumn = !isLiteralNode(property)
        ? property.loc.start.column + 1
        : property.loc.start.column + 2;
      const lintErrorMessage = CUSTOM_LINT_ERRORS[
        CustomLintErrorCode.INVALID_ENTITY_PROPERTY
      ](object.name, propertyName, data[object.name], isJSObject);

      return {
        errorType: PropertyEvaluationErrorType.LINT,
        raw: script,
        severity: getLintSeverity(
          CustomLintErrorCode.INVALID_ENTITY_PROPERTY,
          lintErrorMessage,
        ),
        errorMessage: {
          name: "LintingError",
          message: lintErrorMessage,
        },
        errorSegment: `${object.name}.${propertyName}`,
        originalBinding,
        variables: [propertyName, null, null, null],
        code: CustomLintErrorCode.INVALID_ENTITY_PROPERTY,
        line: objectStartLine - scriptPos.line,
        ch:
          objectStartLine === scriptPos.line
            ? propertyStartColumn - scriptPos.ch
            : propertyStartColumn,
      };
    },
  );
}

// returns custom lint errors caused by
// 1. accessing invalid properties. Eg. jsObject.unknownProperty
// 2. direct mutation of widget properties. Eg. widget1.left = 10
// 3. imperative update of appsmith store object. Eg. appsmith.store.val = 10
function getCustomErrorsFromScript(
  script: string,
  data: Record<string, unknown>,
  scriptPos: Position,
  originalBinding: string,
  isJSObject = false,
): LintError[] {
  let invalidTopLevelMemberExpressions: MemberExpressionData[] = [];
  let assignmentExpressions: AssignmentExpressionData[] = [];
  let callExpressions: CallExpressionData[] = [];
  let memberCallExpressions: MemberCallExpressionData[] = [];

  try {
    const value = extractExpressionsFromCode(
      script,
      data,
      self.evaluationVersion,
    );

    invalidTopLevelMemberExpressions =
      value.invalidTopLevelMemberExpressionsArray;
    assignmentExpressions = value.assignmentExpressionsData;
    callExpressions = value.callExpressionsData;
    memberCallExpressions = value.memberCallExpressionData;
  } catch (e) {}

  const invalidWidgetPropertySetterErrors =
    getInvalidWidgetPropertySetterErrors({
      assignmentExpressions,
      script,
      scriptPos,
      originalBinding,
      data,
    });

  const invalidPropertyErrors = getInvalidEntityPropertyErrors(
    invalidTopLevelMemberExpressions,
    script,
    data,
    scriptPos,
    originalBinding,
    isJSObject,
  );

  // This ensures that all cases where appsmith.store is getting modified
  // either by assignment using `appsmith.store.test = ""`
  // or by calling a function like `appsmith.store.test.push()` will result in lint error
  const appsmithStoreMutationExpressions: Array<
    AssignmentExpressionData | MemberCallExpressionData
  > = [...assignmentExpressions, ...memberCallExpressions];

  const invalidAppsmithStorePropertyErrors =
    getInvalidAppsmithStoreSetterErrors({
      appsmithStoreMutationExpressions,
      script,
      scriptPos,
      originalBinding,
      data,
    });

  const moduleInputErrors = getInvalidModuleInputsError({
    memberCallExpressions,
    originalBinding,
    scriptPos,
    data,
    script,
  });

  const invalidActionModalErrors = getActionModalStringValueErrors({
    callExpressions,
    script,
    scriptPos,
    originalBinding,
  });

  return [
    ...invalidPropertyErrors,
    ...invalidWidgetPropertySetterErrors,
    ...invalidAppsmithStorePropertyErrors,
    ...invalidActionModalErrors,
    ...moduleInputErrors,
  ];
}

function getRefinedW117Error(
  undefinedVar: string,
  originalReason: string,
  isJsObject = false,
) {
  // Refine error message for await using in field not marked as async
  if (undefinedVar === "await") {
    return "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?";
  }

  // Handle case where platform functions are used in data fields
  if (APPSMITH_GLOBAL_FUNCTIONS.hasOwnProperty(undefinedVar)) {
    return asyncActionInSyncFieldLintMessage(isJsObject);
  }

  return originalReason;
}

function getPositionInEvaluationScript(type: EvaluationScriptType): Position {
  const script = EvaluationScripts[type];

  const index = script.indexOf(ScriptTemplate);
  const substr = script.slice(0, index !== -1 ? index : 0);
  const lines = substr.split("\n");
  const lastLine = last(lines) || "";

  return { line: lines.length, ch: lastLine.length };
}

function getActionModalStringValueErrors({
  callExpressions,
  originalBinding,
  script,
  scriptPos,
}: {
  callExpressions: CallExpressionData[];
  scriptPos: Position;
  originalBinding: string;
  script: string;
}) {
  const actionModalLintErrors: LintError[] = [];

  for (const { params, property } of callExpressions) {
    if (property.name === "showModal" || property.name === "closeModal") {
      if (params[0] && isLiteralNode(params[0])) {
        const lintErrorMessage = CUSTOM_LINT_ERRORS[
          CustomLintErrorCode.ACTION_MODAL_STRING
        ](params[0].value);
        const callExpressionsString = generate(params[0]);

        // line position received after AST parsing is 1 more than the actual line of code, hence we subtract 1 to get the actual line number
        const objectStartLine = params[0].loc.start.line - 1;

        // AST parsing start column position from index 0 whereas codemirror start ch position from index 1, hence we add 1 to get the actual ch position
        const objectStartCol = params[0].loc.start.column + 1;

        actionModalLintErrors.push({
          errorType: PropertyEvaluationErrorType.LINT,
          raw: script,
          severity: getLintSeverity(
            CustomLintErrorCode.ACTION_MODAL_STRING,
            lintErrorMessage,
          ),
          errorMessage: {
            name: "LintingError",
            message: lintErrorMessage,
          },
          errorSegment: callExpressionsString,
          originalBinding,
          variables: [callExpressionsString, null, null],
          code: CustomLintErrorCode.ACTION_MODAL_STRING,
          line: objectStartLine - scriptPos.line,
          ch:
            objectStartLine === scriptPos.line
              ? objectStartCol - scriptPos.ch
              : objectStartCol,
        });
      }
    }
  }

  return actionModalLintErrors;
}
