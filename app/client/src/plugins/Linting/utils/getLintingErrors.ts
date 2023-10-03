import type { Position } from "codemirror";
import type { LintError } from "utils/DynamicBindingUtils";
import { JSHINT as jshint } from "jshint";
import type { LintError as JSHintError } from "jshint";
import { get, isEmpty, isNumber, keys } from "lodash";
import type {
  MemberExpressionData,
  AssignmentExpressionData,
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
} from "../constants";
import type { getLintingErrorsProps } from "../types";
import { JSLibraries } from "workers/common/JSLibrary";
import getLintSeverity from "./getLintSeverity";
import { APPSMITH_GLOBAL_FUNCTIONS } from "components/editorComponents/ActionCreator/constants";
import { last } from "lodash";
import { isWidget } from "@appsmith/workers/Evaluation/evaluationUtils";
import setters from "workers/Evaluation/setters";
import { isMemberExpressionNode } from "@shared/ast/src";
import { generate } from "astring";

const EvaluationScriptPositions: Record<string, Position> = {};

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
  Object.keys(SUPPORTED_WEB_APIS).forEach(
    (apiName) => (globalData[apiName] = true),
  );
  return globalData;
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
  options,
  originalBinding,
  script,
  scriptType,
}: getLintingErrorsProps): LintError[] {
  const scriptPos = getEvaluationScriptPosition(scriptType);
  const lintingGlobalData = generateLintingGlobalData(data);
  const lintingOptions = lintOptions(lintingGlobalData);

  jshint(script, lintingOptions);
  const sanitizedJSHintErrors = sanitizeJSHintErrors(jshint.errors, scriptPos);
  const jshintErrors: LintError[] = sanitizedJSHintErrors.map((lintError) =>
    convertJsHintErrorToAppsmithLintError(
      lintError,
      script,
      originalBinding,
      scriptPos,
      options?.isJsObject,
    ),
  );
  const customLintErrors = getCustomErrorsFromScript(
    script,
    data,
    scriptPos,
    originalBinding,
    options?.isJsObject,
  );
  return jshintErrors.concat(customLintErrors);
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
  assignmentExpressions,
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
  const assignmentExpressionErrors: LintError[] = [];

  for (const { object, parentNode } of assignmentExpressions) {
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
  try {
    const value = extractExpressionsFromCode(
      script,
      data,
      self.evaluationVersion,
    );
    invalidTopLevelMemberExpressions =
      value.invalidTopLevelMemberExpressionsArray;
    assignmentExpressions = value.assignmentExpressionsData;
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

  const invalidAppsmithStorePropertyErrors =
    getInvalidAppsmithStoreSetterErrors({
      assignmentExpressions,
      script,
      scriptPos,
      originalBinding,
      data,
    });

  return [
    ...invalidPropertyErrors,
    ...invalidWidgetPropertySetterErrors,
    ...invalidAppsmithStorePropertyErrors,
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
