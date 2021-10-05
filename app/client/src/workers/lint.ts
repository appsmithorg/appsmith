import { Position } from "codemirror";
import {
  EvaluationError,
  extraLibraries,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { JSHINT as jshint } from "jshint";
import { Severity } from "entities/AppsmithConsole";
import { last } from "lodash";
import { EvaluationScripts, EvaluationScriptType } from "workers/evaluate";

export const getLintingErrors = (
  script: string,
  data: Record<string, unknown>,
  originalBinding: string,
  scriptType: EvaluationScriptType,
): EvaluationError[] => {
  const scriptPos = getPositionInEvaluationScript(scriptType);
  const globalData: Record<string, boolean> = {};
  for (const dataKey in data) {
    globalData[dataKey] = true;
  }
  // Jshint shouldn't throw errors for additional libraries
  extraLibraries.forEach((lib) => (globalData[lib.accessor] = true));

  globalData.console = true;

  const options = {
    indent: 2,
    esversion: 8, // For async/await support
    eqeqeq: false, // Not necessary to use ===
    curly: false, // Blocks can be added without {}, eg if (x) return true
    freeze: true, // Overriding inbuilt classes like Array is not allowed
    undef: true, // Undefined variables should be reported as error
    forin: false, // Doesn't require filtering for..in loops with obj.hasOwnProperty()
    noempty: false, // Empty blocks are allowed
    strict: false, // We won't force strict mode
    unused: false, // Unused variables are allowed
    asi: true, // Tolerate Automatic Semicolon Insertion (no semicolons)
    boss: true, // Tolerate assignments where comparisons would be expected
    evil: false, // Use of eval not allowed
    funcscope: true, // Tolerate variable definition inside control statements
    sub: true, // Don't force dot notation
    // environments
    browser: true,
    worker: true,
    mocha: false,
    // global values
    globals: globalData,
  };

  jshint(script, options);

  return jshint.errors.map((lintError) => {
    const ch = lintError.character;
    return {
      errorType: PropertyEvaluationErrorType.LINT,
      raw: script,
      // We are forcing warnings to errors and removing unwanted JSHint checks
      severity: Severity.ERROR,
      errorMessage: lintError.reason,
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

export const getPositionInEvaluationScript = (
  type: EvaluationScriptType,
): Position => {
  const script = EvaluationScripts[type];

  const index = script.indexOf("<<script>>");
  const substr = script.substr(0, index);
  const lines = substr.split("\n");
  const lastLine = last(lines) || "";

  return { line: lines.length, ch: lastLine.length };
};
