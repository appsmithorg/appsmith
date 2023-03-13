import {
  DataTree,
  DataTreeEntity,
  UnEvalTreeJSAction,
} from "entities/DataTree/dataTreeFactory";

import { Position } from "codemirror";
import {
  DependencyMap,
  isDynamicValue,
  isPathADynamicBinding,
  LintError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { JSHINT as jshint, LintError as JSHintError } from "jshint";
import { get, isEmpty, isNil, isNumber, keys, last } from "lodash";
import {
  extractInvalidTopLevelMemberExpressionsFromCode,
  isLiteralNode,
  MemberExpressionData,
} from "@shared/ast";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import {
  EvaluationScripts,
  EvaluationScriptType,
  getScriptToEval,
  getScriptType,
  ScriptTemplate,
} from "workers/Evaluation/evaluate";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isATriggerPath,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { WorkerMessenger } from "workers/Evaluation/fns/utils/Messenger";
import {
  asyncActionInSyncFieldLintMessage,
  CustomLintErrorCode,
  CUSTOM_LINT_ERRORS,
  IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE,
  IGNORED_LINT_ERRORS,
  INVALID_JSOBJECT_START_STATEMENT,
  JS_OBJECT_START_STATEMENT,
  lintOptions,
  SUPPORTED_WEB_APIS,
  WARNING_LINT_ERRORS,
} from "./constants";
import { APPSMITH_GLOBAL_FUNCTIONS } from "components/editorComponents/ActionCreator/constants";
import {
  getLintingErrorsProps,
  lintBindingPathProps,
  LintTreeSagaRequestData,
  lintTriggerPathProps,
} from "./types";
import { JSLibraries } from "workers/common/JSLibrary";
import { Severity } from "entities/AppsmithConsole";
import {
  TJSPropertiesState,
  TJSpropertyState,
} from "workers/common/DataTreeEvaluator";

export function lintBindingPath({
  dynamicBinding,
  entity,
  fullPropertyPath,
  globalData,
}: lintBindingPathProps) {
  let lintErrors: LintError[] = [];

  if (isJSAction(entity)) {
    if (!entity.body) return lintErrors;
    if (!entity.body.startsWith(JS_OBJECT_START_STATEMENT)) {
      return lintErrors.concat([
        {
          errorType: PropertyEvaluationErrorType.LINT,
          errorSegment: "",
          originalBinding: entity.body,
          line: 0,
          ch: 0,
          code: entity.body,
          variables: [],
          raw: entity.body,
          errorMessage: {
            name: "LintingError",
            message: INVALID_JSOBJECT_START_STATEMENT,
          },
          severity: Severity.ERROR,
        },
      ]);
    }
  }

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
        });
        lintErrors = lintErrors.concat(lintErrorsFromSnippet);
      }
    });
  }
  return lintErrors;
}

export function lintTriggerPath({
  entity,
  globalData,
  userScript,
}: lintTriggerPathProps) {
  const { jsSnippets } = getDynamicBindings(userScript, entity);
  const script = getScriptToEval(jsSnippets[0], EvaluationScriptType.TRIGGERS);

  return getLintingErrors({
    script,
    data: globalData,
    originalBinding: jsSnippets[0],
    scriptType: EvaluationScriptType.TRIGGERS,
  });
}

export function pathRequiresLinting(
  dataTree: DataTree,
  entity: DataTreeEntity,
  fullPropertyPath: string,
): boolean {
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  const unEvalPropertyValue = (get(
    dataTree,
    fullPropertyPath,
  ) as unknown) as string;

  if (isATriggerPath(entity, propertyPath)) {
    return isDynamicValue(unEvalPropertyValue);
  }
  const isADynamicBindingPath =
    (isAction(entity) || isWidget(entity) || isJSAction(entity)) &&
    isPathADynamicBinding(entity, propertyPath);
  const requiresLinting =
    (isADynamicBindingPath && isDynamicValue(unEvalPropertyValue)) ||
    isJSAction(entity);
  return requiresLinting;
}

// Removes "export default" statement from js Object
export function getJSToLint(
  entity: DataTreeEntity,
  snippet: string,
  propertyPath: string,
): string {
  return entity && isJSAction(entity) && propertyPath === "body"
    ? snippet.replace(/export default/g, "")
    : snippet;
}

export function getPositionInEvaluationScript(
  type: EvaluationScriptType,
): Position {
  const script = EvaluationScripts[type];

  const index = script.indexOf(ScriptTemplate);
  const substr = script.slice(0, index !== -1 ? index : 0);
  const lines = substr.split("\n");
  const lastLine = last(lines) || "";

  return { line: lines.length, ch: lastLine.length };
}

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
const getLintSeverity = (code: string): Severity.WARNING | Severity.ERROR => {
  const severity =
    code in WARNING_LINT_ERRORS ? Severity.WARNING : Severity.ERROR;
  return severity;
};
const getLintErrorMessage = (
  reason: string,
  code: string,
  variables: string[],
): string => {
  switch (code) {
    case IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE: {
      return getRefinedW117Error(variables[0], reason);
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
): LintError {
  const { a, b, c, code, d, evidence, reason } = jsHintError;

  // Compute actual error position
  const actualErrorLineNumber = jsHintError.line - scriptPos.line;
  const actualErrorCh =
    jsHintError.line === scriptPos.line
      ? jsHintError.character - scriptPos.ch
      : jsHintError.character;

  return {
    errorType: PropertyEvaluationErrorType.LINT,
    raw: script,
    severity: getLintSeverity(code),
    errorMessage: {
      name: "LintingError",
      message: getLintErrorMessage(reason, code, [a, b, c, d]),
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

export function getLintingErrors({
  data,
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
    ),
  );
  const invalidPropertyErrors = getInvalidPropertyErrorsFromScript(
    script,
    data,
    scriptPos,
    originalBinding,
  );
  return jshintErrors.concat(invalidPropertyErrors);
}

// returns lint errors caused by accessing invalid properties. Eg. jsObject.unknownProperty
function getInvalidPropertyErrorsFromScript(
  script: string,
  data: Record<string, unknown>,
  scriptPos: Position,
  originalBinding: string,
): LintError[] {
  let invalidTopLevelMemberExpressions: MemberExpressionData[] = [];
  try {
    invalidTopLevelMemberExpressions = extractInvalidTopLevelMemberExpressionsFromCode(
      script,
      data,
      self.evaluationVersion,
    );
  } catch (e) {}

  const invalidPropertyErrors = invalidTopLevelMemberExpressions.map(
    ({ object, property }): LintError => {
      const propertyName = isLiteralNode(property)
        ? (property.value as string)
        : property.name;
      const objectStartLine = object.loc.start.line - 1;
      // For computed member expressions (entity["property"]), add an extra 1 to the start column to account for "[".
      const propertyStartColumn = !isLiteralNode(property)
        ? property.loc.start.column + 1
        : property.loc.start.column + 2;
      return {
        errorType: PropertyEvaluationErrorType.LINT,
        raw: script,
        severity: getLintSeverity(CustomLintErrorCode.INVALID_ENTITY_PROPERTY),
        errorMessage: {
          name: "LintingError",
          message: CUSTOM_LINT_ERRORS[
            CustomLintErrorCode.INVALID_ENTITY_PROPERTY
          ](object.name, propertyName),
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
  return invalidPropertyErrors;
}

export function initiateLinting({
  asyncJSFunctionsInSyncFields,
  jsPropertiesState,
  lintOrder,
  requiresLinting,
  unevalTree,
}: {
  asyncJSFunctionsInSyncFields: DependencyMap;
  lintOrder: string[];
  unevalTree: DataTree;
  requiresLinting: boolean;
  jsPropertiesState: TJSPropertiesState;
}) {
  const data = {
    pathsToLint: lintOrder,
    unevalTree,
    jsPropertiesState,
    asyncJSFunctionsInSyncFields,
  } as LintTreeSagaRequestData;
  if (!requiresLinting) return;
  WorkerMessenger.ping({
    data,
    method: MAIN_THREAD_ACTION.LINT_TREE,
  });
}

export function getRefinedW117Error(
  undefinedVar: string,
  originalReason: string,
) {
  // Refine error message for await using in field not marked as async
  if (undefinedVar === "await") {
    return "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?";
  }
  // Handle case where platform functions are used in sync fields
  if (APPSMITH_GLOBAL_FUNCTIONS.hasOwnProperty(undefinedVar)) {
    return asyncActionInSyncFieldLintMessage(undefinedVar);
  }
  return originalReason;
}

export function lintJSProperty(
  jsPropertyState: TJSpropertyState,
  globalData: DataTree,
): LintError[] {
  if (isNil(jsPropertyState)) {
    return [];
  }
  const scriptType = getScriptType(false, false);
  const scriptToLint = getScriptToEval(
    jsPropertyState.value,
    EvaluationScriptType.OBJECT_PROPERTY,
  );
  const propLintError = getLintingErrors({
    script: scriptToLint,
    data: globalData,
    originalBinding: jsPropertyState.value,
    scriptType,
  });
  const refinedErrors = propLintError.map((lintError) => {
    return {
      ...lintError,
      line: lintError.line + jsPropertyState.position.startLine - 1,
      ch:
        lintError.line === 0
          ? lintError.ch + jsPropertyState.position.startColumn
          : lintError.ch,
    };
  });

  return refinedErrors;
}

export function lintJSObject(
  jsObjectName: string,
  jsObjectState: Record<string, TJSpropertyState>,
  data: { dataWithFunctions: DataTree; dataWithoutFunctions: DataTree },
  asyncJSFunctionsInSyncFields: DependencyMap,
) {
  let lintErrors: LintError[] = [];

  // An empty state shows that there is a parse error in the jsObject, so we lint the entire body
  // instead of each property
  if (isEmpty(jsObjectState)) {
    const jsObject = data.dataWithFunctions[jsObjectName];
    const jsBodyToLint = getJSToLint(
      jsObject,
      ((jsObject as unknown) as UnEvalTreeJSAction).body,
      "body",
    );
    const jsObjectBodyLintErrors = lintJSObjectBody(
      jsBodyToLint,
      data.dataWithFunctions,
    );
    return jsObjectBodyLintErrors;
  }

  for (const jsProperty of Object.keys(jsObjectState)) {
    const jsPropertyLintErrors = lintJSProperty(
      jsObjectState[jsProperty],
      asyncJSFunctionsInSyncFields.hasOwnProperty(
        `${jsObjectName}.${jsProperty}`,
      )
        ? data.dataWithoutFunctions
        : data.dataWithFunctions,
    );
    lintErrors = lintErrors.concat(jsPropertyLintErrors);

    if (
      asyncJSFunctionsInSyncFields.hasOwnProperty(
        `${jsObjectName}.${jsProperty}`,
      )
    ) {
      lintErrors.push({
        errorType: PropertyEvaluationErrorType.LINT,
        raw: "test",
        severity: getLintSeverity("CUSTOM"),
        errorMessage: {
          name: "LintingError",
          message: getLintErrorMessage(
            `${
              asyncJSFunctionsInSyncFields[`${jsObjectName}.${jsProperty}`][0]
            } contains reference to async framework actions that cause widget bindings to fail.`,
            "CUSTOM",
            [jsProperty],
          ),
        },
        errorSegment: `${jsObjectName}.${jsProperty}`,
        originalBinding: "test",
        // By keeping track of these variables we can highlight the exact text that caused the error.
        variables: [jsProperty, null, null, null],
        code: "CUSTOM",
        line: jsObjectState[jsProperty].position.keyStartLine - 1,
        ch: jsObjectState[jsProperty].position.keyStartColumn + 1,
      });
    }
  }
  return lintErrors;
}

export function lintJSObjectBody(
  jsbody: string,
  globalData: DataTree,
): LintError[] {
  const scriptType = getScriptType(false, false);
  const scriptToLint = getScriptToEval(jsbody, scriptType);
  return getLintingErrors({
    script: scriptToLint,
    data: globalData,
    originalBinding: jsbody,
    scriptType,
  });
}
