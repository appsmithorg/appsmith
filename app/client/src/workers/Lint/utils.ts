import { DataTree, DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isATriggerPath,
  isJSAction,
  isWidget,
} from "workers/evaluationUtils";
import { Position } from "codemirror";
import {
  EvaluationError,
  extraLibraries,
  isDynamicValue,
  isPathADynamicBinding,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { JSHINT as jshint, LintError, LintOptions } from "jshint";
import { get, isEmpty, isNumber, keys, last } from "lodash";
import {
  EvaluationScripts,
  EvaluationScriptType,
  ScriptTemplate,
} from "workers/evaluate";
import {
  getLintErrorMessage,
  getLintSeverity,
} from "components/editorComponents/CodeEditor/lintHelpers";
import { ECMA_VERSION } from "constants/ast";
import {
  IGNORED_LINT_ERRORS,
  SUPPORTED_WEB_APIS,
} from "components/editorComponents/CodeEditor/constants";

export const pathRequiresLinting = (
  dataTree: DataTree,
  entity: DataTreeEntity,
  fullPropertyPath: string,
): boolean => {
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
    isADynamicBindingPath &&
    (isDynamicValue(unEvalPropertyValue) ||
      (isJSAction(entity) && propertyPath === "body"));
  return requiresLinting;
};

export const getJSSnippetToLint = (
  entity: DataTreeEntity,
  snippet: string,
  propertyPath: string,
) => {
  return entity && isJSAction(entity) && propertyPath === "body"
    ? snippet.replace(/export default/g, "")
    : snippet;
};

export const getPositionInEvaluationScript = (
  type: EvaluationScriptType,
): Position => {
  const script = EvaluationScripts[type];

  const index = script.indexOf(ScriptTemplate);
  const substr = script.slice(0, index !== -1 ? index : 0);
  const lines = substr.split("\n");
  const lastLine = last(lines) || "";

  return { line: lines.length, ch: lastLine.length };
};

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

export const getLintingErrors = (
  script: string,
  data: Record<string, unknown>,
  originalBinding: string,
  scriptType: EvaluationScriptType,
): EvaluationError[] => {
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

  return getValidLintErrors(jshint.errors, scriptPos).map((lintError) => {
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
};

const getValidLintErrors = (lintErrors: LintError[], scriptPos: Position) => {
  return lintErrors.reduce((result: LintError[], lintError) => {
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
};
