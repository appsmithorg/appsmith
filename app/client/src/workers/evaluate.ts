import { ActionDescription, DataTree } from "entities/DataTree/dataTreeFactory";
import { addFunctions } from "workers/evaluationUtils";
import _ from "lodash";
import {
  EvaluationError,
  extraLibraries,
  PropertyEvaluationErrorType,
  unsafeFunctionForEval,
} from "utils/DynamicBindingUtils";
import unescapeJS from "unescape-js";
import { JSHINT as jshint } from "jshint";
import { Severity } from "entities/AppsmithConsole";
import { Position } from "codemirror";

export type EvalResult = {
  result: any;
  triggers?: ActionDescription<any>[];
  errors: EvaluationError[];
};

export enum EvaluationScriptType {
  EXPRESSION = "EXPRESSION",
  ANONYMOUS_FUNCTION = "ANONYMOUS_FUNCTION",
  TRIGGERS = "TRIGGERS",
}

// Some errors in jshint give the character postion after the error.
// W116 (using == instead of ===) this returns position after == but we want to highlight the == so -2
const lintErrorOffsets: Record<string, number> = {
  W116: -2,
};

const evaluationScriptsPos: Record<EvaluationScriptType, string> = {
  [EvaluationScriptType.EXPRESSION]: `
  function closedFunction () {
    const result = <<script>>
    return result;
  }
  closedFunction()
  `,
  [EvaluationScriptType.ANONYMOUS_FUNCTION]: `
  function callback (script) {
    const userFunction = script;
    const result = userFunction.apply(self, ARGUMENTS);
    return result;
  }
  callback(<<script>>)
  `,
  [EvaluationScriptType.TRIGGERS]: `
  function closedFunction () {
    const result = <<script>>
  }
  closedFunction()
  `,
};

const getPositionInEvaluationScript = (
  type: EvaluationScriptType,
): Position => {
  const script = evaluationScriptsPos[type];

  const index = script.indexOf("<<script>>");
  const substr = script.substr(0, index);
  const lines = substr.split("\n");
  const lastLine = _.last(lines) || "";

  return { line: lines.length, ch: lastLine.length };
};

const getScriptType = (
  evalArguments?: Array<any>,
  isTriggerBased = false,
): EvaluationScriptType => {
  let scriptType = EvaluationScriptType.EXPRESSION;
  if (evalArguments) {
    scriptType = EvaluationScriptType.ANONYMOUS_FUNCTION;
  } else if (isTriggerBased) {
    scriptType = EvaluationScriptType.TRIGGERS;
  }
  return scriptType;
};

const getScriptToEval = (
  userScript: string,
  type: EvaluationScriptType,
): string => {
  return evaluationScriptsPos[type].replace("<<script>>", userScript);
};

const getLintingErrors = (
  script: string,
  data: Record<string, unknown>,
  originalBinding: string,
  scriptPos: Position,
): EvaluationError[] => {
  const globalData: Record<string, boolean> = {};
  Object.keys(data).forEach((datum) => (globalData[datum] = false));
  const options = {
    indent: 2,
    esversion: 7,
    eqeqeq: true,
    curly: true,
    freeze: true,
    undef: true,
    unused: true,
    asi: true,
    worker: true,
    globals: globalData,
  };

  jshint(script, options);

  return jshint.errors.map((lintError) => {
    const offset = lintErrorOffsets[lintError.code];
    const ch = _.isUndefined(offset)
      ? lintError.character
      : lintError.character + offset;
    return {
      errorType: PropertyEvaluationErrorType.LINT,
      raw: script,
      severity: lintError.code.startsWith("W")
        ? Severity.WARNING
        : Severity.ERROR,
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

const beginsWithLineBreakRegex = /^\s+|\s+$/;

export default function evaluate(
  js: string,
  data: DataTree,
  evalArguments?: Array<any>,
  isTriggerBased = false,
): EvalResult {
  // We remove any line breaks from the beginning of the script because that
  // makes the final function invalid. We also unescape any escaped characters
  // so that eval can happen
  const unescapedJS = unescapeJS(js.replace(beginsWithLineBreakRegex, ""));
  const scriptType = getScriptType(evalArguments, isTriggerBased);
  const script = getScriptToEval(unescapedJS, scriptType);
  // We are linting original js binding,
  // This will make sure that the characted count is not messed up when we do unescapejs
  const scriptToLint = getScriptToEval(js, scriptType);
  return (function() {
    let errors: EvaluationError[] = [];
    let result;
    let triggers: any[] = [];
    /**** Setting the eval context ****/
    const GLOBAL_DATA: Record<string, any> = {};
    ///// Adding callback data
    GLOBAL_DATA.ARGUMENTS = evalArguments;
    if (isTriggerBased) {
      //// Add internal functions to dataTree;
      const dataTreeWithFunctions = addFunctions(data);
      ///// Adding Data tree with functions
      Object.keys(dataTreeWithFunctions).forEach((datum) => {
        GLOBAL_DATA[datum] = dataTreeWithFunctions[datum];
      });
      ///// Fixing action paths and capturing their execution response
      if (dataTreeWithFunctions.actionPaths) {
        GLOBAL_DATA.triggers = [];
        const pusher = function(
          this: DataTree,
          action: any,
          ...payload: any[]
        ) {
          const actionPayload = action(...payload);
          GLOBAL_DATA.triggers.push(actionPayload);
        };
        GLOBAL_DATA.actionPaths.forEach((path: string) => {
          const action = _.get(GLOBAL_DATA, path);
          const entity = _.get(GLOBAL_DATA, path.split(".")[0]);
          if (action) {
            _.set(GLOBAL_DATA, path, pusher.bind(data, action.bind(entity)));
          }
        });
      }
    } else {
      ///// Adding Data tree
      Object.keys(data).forEach((datum) => {
        GLOBAL_DATA[datum] = data[datum];
      });
    }

    // Set it to self so that the eval function can have access to it
    // as global data. This is what enables access all appsmith
    // entity properties from the global context
    Object.keys(GLOBAL_DATA).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[key] = GLOBAL_DATA[key];
    });
    errors = getLintingErrors(
      scriptToLint,
      GLOBAL_DATA,
      js,
      getPositionInEvaluationScript(scriptType),
    );

    ///// Adding extra libraries separately
    extraLibraries.forEach((library) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[library.accessor] = library.lib;
    });

    ///// Remove all unsafe functions
    unsafeFunctionForEval.forEach((func) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[func] = undefined;
    });
    try {
      result = eval(script);
      if (isTriggerBased) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        triggers = [...self.triggers];
      }
    } catch (e) {
      const errorMessage = `${e.name}: ${e.message}`;
      errors.push({
        errorMessage: errorMessage,
        severity: Severity.ERROR,
        raw: script,
        errorType: PropertyEvaluationErrorType.PARSE,
        originalBinding: js,
      });
    }

    // Remove it from self
    // This is needed so that next eval can have a clean sheet
    Object.keys(GLOBAL_DATA).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      delete self[key];
    });

    return { result, triggers, errors };
  })();
}
