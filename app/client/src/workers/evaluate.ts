import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
  unsafeFunctionForEval,
} from "utils/DynamicBindingUtils";
import customLibraries, { ExtraLibrary } from "utils/ExtraLibrary";
import unescapeJS from "unescape-js";
import { JSHINT as jshint } from "jshint";
import { Severity } from "entities/AppsmithConsole";
import { AppsmithPromise, enhanceDataTreeWithFunctions } from "./Actions";
import { ActionDescription } from "entities/DataTree/actionTriggers";

export type EvalResult = {
  result: any;
  triggers?: ActionDescription[];
  errors: EvaluationError[];
};

export enum EvaluationScriptType {
  EXPRESSION = "EXPRESSION",
  ANONYMOUS_FUNCTION = "ANONYMOUS_FUNCTION",
  TRIGGERS = "TRIGGERS",
}

const evaluationScripts: Record<
  EvaluationScriptType,
  (script: string) => string
> = {
  [EvaluationScriptType.EXPRESSION]: (script: string) => `
  function closedFunction () {
    const result = ${script}
    return result;
  }
  closedFunction()
  `,
  [EvaluationScriptType.ANONYMOUS_FUNCTION]: (script) => `
  function callback (script) {
    const userFunction = script;
    const result = userFunction.apply(self, ARGUMENTS);
    return result;
  }
  callback(${script})
  `,
  [EvaluationScriptType.TRIGGERS]: (script) => `
  function closedFunction () {
    const result = ${script};
  }
  closedFunction();
  `,
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
  evalArguments?: Array<any>,
  isTriggerBased = false,
): string => {
  const scriptType = getScriptType(evalArguments, isTriggerBased);
  return evaluationScripts[scriptType](userScript);
};

const getLintingErrors = (
  script: string,
  data: Record<string, unknown>,
  originalBinding: string,
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
    };
  });
};

const beginsWithLineBreakRegex = /^\s+|\s+$/;

export default function evaluate(
  js: string,
  data: DataTree,
  evalArguments?: Array<any>,
  isTriggerBased = false,
  extraLibraries = customLibraries.getInstance().getLibraries(),
): EvalResult {
  // We remove any line breaks from the beginning of the script because that
  // makes the final function invalid. We also unescape any escaped characters
  // so that eval can happen
  const unescapedJS = unescapeJS(js.replace(beginsWithLineBreakRegex, ""));
  const script = getScriptToEval(unescapedJS, evalArguments, isTriggerBased);
  return (function() {
    let errors: EvaluationError[] = [];
    let result;
    let triggers: any[] = [];
    /**** Setting the eval context ****/
    const GLOBAL_DATA: Record<string, any> = {};
    ///// Adding callback data
    GLOBAL_DATA.ARGUMENTS = evalArguments;
    GLOBAL_DATA.Promise = AppsmithPromise;
    if (isTriggerBased) {
      //// Add internal functions to dataTree;
      const dataTreeWithFunctions = enhanceDataTreeWithFunctions(data);
      ///// Adding Data tree with functions
      Object.keys(dataTreeWithFunctions).forEach((datum) => {
        GLOBAL_DATA[datum] = dataTreeWithFunctions[datum];
      });
    } else {
      ///// Adding Data tree
      Object.keys(data).forEach((datum) => {
        GLOBAL_DATA[datum] = data[datum];
      });
    }

    ((self as any).customLibs || []).forEach((lib: ExtraLibrary) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[lib.accessor] = lib.lib;
    });

    // Set it to self so that the eval function can have access to it
    // as global data. This is what enables access all appsmith
    // entity properties from the global context
    Object.keys(GLOBAL_DATA).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[key] = GLOBAL_DATA[key];
    });
    errors = getLintingErrors(script, GLOBAL_DATA, unescapedJS);

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
        triggers = [...self.triggers];
        self.triggers = [];
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
