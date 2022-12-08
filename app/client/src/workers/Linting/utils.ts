import { DataTree, DataTreeEntity } from "entities/DataTree/dataTreeFactory";

import { Position } from "codemirror";
import {
  EVAL_WORKER_ACTIONS,
  extraLibraries,
  isDynamicValue,
  isPathADynamicBinding,
  LintError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import {
  JSHINT as jshint,
  LintError as JSHintError,
  LintOptions,
} from "jshint";
import { get, isEmpty, isNumber, keys, last, set } from "lodash";
import {
  getLintErrorMessage,
  getLintSeverity,
} from "components/editorComponents/CodeEditor/lintHelpers";
import {
  CustomLintErrorCode,
  CUSTOM_LINT_ERRORS,
  IGNORED_LINT_ERRORS,
  INVALID_JSOBJECT_START_STATEMENT,
  JS_OBJECT_START_STATEMENT,
  SUPPORTED_WEB_APIS,
} from "components/editorComponents/CodeEditor/constants";
import {
  extractInvalidTopLevelMemberExpressionsFromCode,
  isLiteralNode,
  ECMA_VERSION,
  MemberExpressionData,
} from "@shared/ast";
import { getDynamicBindings } from "utils/DynamicBindingUtils";

import {
  createGlobalData,
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
} from "workers/Evaluation/evaluationUtils";
import { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";
import { Severity } from "entities/AppsmithConsole";

export function getlintErrorsFromTree(
  pathsToLint: string[],
  unEvalTree: DataTree,
): LintErrors {
  const lintTreeErrors: LintErrors = {};
  const GLOBAL_DATA_WITHOUT_FUNCTIONS = createGlobalData({
    dataTree: unEvalTree,
    resolvedFunctions: {},
    isTriggerBased: false,
  });
  // trigger paths
  const triggerPaths = new Set<string>();
  // Certain paths, like JS Object's body are binding paths where appsmith functions are needed in the global data
  const bindingPathsRequiringFunctions = new Set<string>();

  pathsToLint.forEach((fullPropertyPath) => {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      fullPropertyPath,
    );
    const entity = unEvalTree[entityName];
    const unEvalPropertyValue = (get(
      unEvalTree,
      fullPropertyPath,
    ) as unknown) as string;
    // remove all lint errors from path
    set(lintTreeErrors, `["${fullPropertyPath}"]`, []);

    // We are only interested in paths that require linting
    if (!pathRequiresLinting(unEvalTree, entity, fullPropertyPath)) return;
    if (isATriggerPath(entity, propertyPath))
      return triggerPaths.add(fullPropertyPath);
    if (isJSAction(entity))
      return bindingPathsRequiringFunctions.add(`${entityName}.body`);
    const lintErrors = lintBindingPath(
      unEvalPropertyValue,
      entity,
      fullPropertyPath,
      GLOBAL_DATA_WITHOUT_FUNCTIONS,
    );
    set(lintTreeErrors, `["${fullPropertyPath}"]`, lintErrors);
  });

  if (triggerPaths.size || bindingPathsRequiringFunctions.size) {
    // we only create GLOBAL_DATA_WITH_FUNCTIONS if there are paths requiring it
    // In trigger based fields, functions such as showAlert, storeValue, etc need to be added to the global data
    const GLOBAL_DATA_WITH_FUNCTIONS = createGlobalData({
      dataTree: unEvalTree,
      resolvedFunctions: {},
      isTriggerBased: true,
      skipEntityFunctions: true,
    });

    // lint binding paths that need GLOBAL_DATA_WITH_FUNCTIONS
    if (bindingPathsRequiringFunctions.size) {
      bindingPathsRequiringFunctions.forEach((fullPropertyPath) => {
        const { entityName } = getEntityNameAndPropertyPath(fullPropertyPath);
        const entity = unEvalTree[entityName];
        const unEvalPropertyValue = (get(
          unEvalTree,
          fullPropertyPath,
        ) as unknown) as string;
        // remove all lint errors from path
        set(lintTreeErrors, `["${fullPropertyPath}"]`, []);
        const lintErrors = lintBindingPath(
          unEvalPropertyValue,
          entity,
          fullPropertyPath,
          GLOBAL_DATA_WITH_FUNCTIONS,
        );
        set(lintTreeErrors, `["${fullPropertyPath}"]`, lintErrors);
      });
    }

    // Lint triggerPaths
    if (triggerPaths.size) {
      triggerPaths.forEach((triggerPath) => {
        const { entityName } = getEntityNameAndPropertyPath(triggerPath);
        const entity = unEvalTree[entityName];
        const unEvalPropertyValue = (get(
          unEvalTree,
          triggerPath,
        ) as unknown) as string;
        // remove all lint errors from path
        set(lintTreeErrors, `["${triggerPath}"]`, []);
        const lintErrors = lintTriggerPath(
          unEvalPropertyValue,
          entity,
          GLOBAL_DATA_WITH_FUNCTIONS,
        );
        set(lintTreeErrors, `["${triggerPath}"]`, lintErrors);
      });
    }
  }

  return lintTreeErrors;
}

function lintBindingPath(
  dynamicBinding: string,
  entity: DataTreeEntity,
  fullPropertyPath: string,
  globalData: ReturnType<typeof createGlobalData>,
) {
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
          errorMessage: INVALID_JSOBJECT_START_STATEMENT,
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
        const lintErrorsFromSnippet = getLintingErrors(
          scriptToLint,
          globalData,
          originalBinding,
          scriptType,
        );
        lintErrors = lintErrors.concat(lintErrorsFromSnippet);
      }
    });
  }
  return lintErrors;
}

function lintTriggerPath(
  userScript: string,
  entity: DataTreeEntity,
  globalData: ReturnType<typeof createGlobalData>,
) {
  const { jsSnippets } = getDynamicBindings(userScript, entity);
  const script = getScriptToEval(jsSnippets[0], EvaluationScriptType.TRIGGERS);

  return getLintingErrors(
    script,
    globalData,
    jsSnippets[0],
    EvaluationScriptType.TRIGGERS,
  );
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

export function getLintingErrors(
  script: string,
  data: Record<string, unknown>,
  // {{user's code}}
  originalBinding: string,
  scriptType: EvaluationScriptType,
): LintError[] {
  const scriptPos = getEvaluationScriptPosition(scriptType);
  const globalData: Record<string, boolean> = {};
  for (const dataKey in data) {
    globalData[dataKey] = true;
  }
  // Jshint shouldn't throw errors for additional libraries
  extraLibraries.forEach((lib) => (globalData[lib.accessor] = true));
  // JSHint shouldn't throw errors for supported web apis
  Object.keys(SUPPORTED_WEB_APIS).forEach(
    (apiName) => (globalData[apiName] = true),
  );

  const options: LintOptions = {
    indent: 2,
    esversion: ECMA_VERSION,
    eqeqeq: false, // Not necessary to use ===
    curly: false, // Blocks can be added without {}, eg if (x) return true
    freeze: true, // Overriding inbuilt classes like Array is not allowed
    undef: true, // Undefined variables should be reported as error
    forin: false, // Doesn't require filtering for..in loops with obj.hasOwnProperty()
    noempty: false, // Empty blocks are allowed
    strict: false, // We won't force strict mode
    unused: "strict", // Unused variables are not allowed
    asi: true, // Tolerate Automatic Semicolon Insertion (no semicolons)
    boss: true, // Tolerate assignments where comparisons would be expected
    evil: false, // Use of eval not allowed
    funcscope: true, // Tolerate variable definition inside control statements
    sub: true, // Don't force dot notation
    expr: true, // suppresses warnings about the use of expressions where normally you would expect to see assignments or function calls
    // environments
    browser: true,
    worker: true,
    mocha: false,
    // global values
    globals: globalData,
    loopfunc: true,
  };

  jshint(script, options);

  const jshintErrors: LintError[] = getValidLintErrors(
    jshint.errors,
    scriptPos,
  ).map((lintError) => {
    const ch = lintError.character;
    return {
      errorType: PropertyEvaluationErrorType.LINT,
      raw: script,
      severity: getLintSeverity(lintError.code),
      errorMessage: getLintErrorMessage(lintError.reason),
      errorSegment: lintError.evidence,
      originalBinding,
      // By keeping track of these variables we can highlight the exact text that caused the error.
      variables: [lintError.a, lintError.b, lintError.c, lintError.d],
      code: lintError.code,
      line: lintError.line - scriptPos.line,
      ch: lintError.line === scriptPos.line ? ch - scriptPos.ch : ch,
    };
  });
  const invalidPropertyErrors = getInvalidPropertyErrorsFromScript(
    script,
    data,
    scriptPos,
    originalBinding,
  );
  return jshintErrors.concat(invalidPropertyErrors);
}

function getValidLintErrors(
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
        errorMessage: CUSTOM_LINT_ERRORS[
          CustomLintErrorCode.INVALID_ENTITY_PROPERTY
        ](object.name, propertyName),
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

export function initiateLinting(
  lintOrder: string[],
  unevalTree: DataTree,
  requiresLinting: boolean,
) {
  if (!requiresLinting) return;
  postMessage({
    promisified: true,
    responseData: {
      lintOrder,
      unevalTree,
      type: EVAL_WORKER_ACTIONS.LINT_TREE,
    },
  });
}
