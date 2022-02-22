/* eslint-disable no-console */
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  EvaluationError,
  extraLibraries,
  PropertyEvaluationErrorType,
  unsafeFunctionForEval,
} from "utils/DynamicBindingUtils";
import unescapeJS from "unescape-js";
import { Severity } from "entities/AppsmithConsole";
import { enhanceDataTreeWithFunctions } from "./Actions";
import { isEmpty } from "lodash";
import { getLintingErrors } from "workers/lint";
import { completePromise } from "workers/PromisifyAction";
import { ActionDescription } from "entities/DataTree/actionTriggers";

export type EvalResult = {
  result: any;
  errors: EvaluationError[];
  triggers?: ActionDescription[];
};

export enum EvaluationScriptType {
  EXPRESSION = "EXPRESSION",
  ANONYMOUS_FUNCTION = "ANONYMOUS_FUNCTION",
  TRIGGERS = "TRIGGERS",
}

export const ScriptTemplate = "<<string>>";

export const EvaluationScripts: Record<EvaluationScriptType, string> = {
  [EvaluationScriptType.EXPRESSION]: `
  function closedFunction () {
    const result = ${ScriptTemplate}
    return result;
  }
  closedFunction.call(THIS_CONTEXT)
  `,
  [EvaluationScriptType.ANONYMOUS_FUNCTION]: `
  function callback (script) {
    const userFunction = script;
    const result = userFunction?.apply(THIS_CONTEXT, ARGUMENTS);
    return result;
  }
  callback(${ScriptTemplate})
  `,
  [EvaluationScriptType.TRIGGERS]: `
  async function closedFunction () {
    const result = await ${ScriptTemplate};
    return result;
  }
  closedFunction.call(THIS_CONTEXT);
  `,
};

const getScriptType = (
  evalArgumentsExist = false,
  isTriggerBased = false,
): EvaluationScriptType => {
  let scriptType = EvaluationScriptType.EXPRESSION;
  if (evalArgumentsExist) {
    scriptType = EvaluationScriptType.ANONYMOUS_FUNCTION;
  } else if (isTriggerBased) {
    scriptType = EvaluationScriptType.TRIGGERS;
  }
  return scriptType;
};

export const getScriptToEval = (
  userScript: string,
  type: EvaluationScriptType,
): string => {
  // Using replace here would break scripts with replacement patterns (ex: $&, $$)
  const buffer = EvaluationScripts[type].split(ScriptTemplate);
  return `${buffer[0]}${userScript}${buffer[1]}`;
};

export function setupEvaluationEnvironment() {
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
}

const beginsWithLineBreakRegex = /^\s+|\s+$/;

export const createGlobalData = (
  dataTree: DataTree,
  resolvedFunctions: Record<string, any>,
  isTriggerBased: boolean,
  context?: EvaluateContext,
  evalArguments?: Array<any>,
) => {
  const GLOBAL_DATA: Record<string, any> = {};
  ///// Adding callback data
  GLOBAL_DATA.ARGUMENTS = evalArguments;
  //// Adding contextual data not part of data tree
  GLOBAL_DATA.THIS_CONTEXT = {};
  if (context) {
    if (context.thisContext) {
      GLOBAL_DATA.THIS_CONTEXT = context.thisContext;
    }
    if (context.globalContext) {
      Object.entries(context.globalContext).forEach(([key, value]) => {
        GLOBAL_DATA[key] = value;
      });
    }
  }
  if (isTriggerBased) {
    //// Add internal functions to dataTree;
    const dataTreeWithFunctions = enhanceDataTreeWithFunctions(
      dataTree,
      context?.requestId,
    );
    ///// Adding Data tree with functions
    Object.keys(dataTreeWithFunctions).forEach((datum) => {
      GLOBAL_DATA[datum] = dataTreeWithFunctions[datum];
    });
  } else {
    Object.keys(dataTree).forEach((datum) => {
      GLOBAL_DATA[datum] = dataTree[datum];
    });
  }
  if (!isEmpty(resolvedFunctions)) {
    Object.keys(resolvedFunctions).forEach((datum: any) => {
      const resolvedObject = resolvedFunctions[datum];
      Object.keys(resolvedObject).forEach((key: any) => {
        const dataTreeKey = GLOBAL_DATA[datum];
        if (dataTreeKey) {
          dataTreeKey[key] = resolvedObject[key];
        }
      });
    });
  }
  return GLOBAL_DATA;
};

export function sanitizeScript(js: string) {
  // We remove any line breaks from the beginning of the script because that
  // makes the final function invalid. We also unescape any escaped characters
  // so that eval can happen
  const trimmedJS = js.replace(beginsWithLineBreakRegex, "");
  return self.evaluationVersion > 1 ? trimmedJS : unescapeJS(trimmedJS);
}

/** Define a context just for this script
 * thisContext will define it on the `this`
 * globalContext will define it globally
 * requestId is used for completing promises
 */
export type EvaluateContext = {
  thisContext?: Record<string, any>;
  globalContext?: Record<string, any>;
  requestId?: string;
};

export const getUserScriptToEvaluate = (
  userScript: string,
  GLOBAL_DATA: Record<string, unknown>,
  isTriggerBased: boolean,
  evalArguments?: Array<any>,
) => {
  const unescapedJS = sanitizeScript(userScript);
  // If nothing is present to evaluate, return instead of linting
  if (!unescapedJS.length) {
    return {
      lintErrors: [],
      script: "",
    };
  }
  const scriptType = getScriptType(!!evalArguments, isTriggerBased);
  const script = getScriptToEval(unescapedJS, scriptType);
  // We are linting original js binding,
  // This will make sure that the character count is not messed up when we do unescapejs
  const scriptToLint = getScriptToEval(userScript, scriptType);
  const lintErrors = getLintingErrors(
    scriptToLint,
    GLOBAL_DATA,
    userScript,
    scriptType,
  );
  return { script, lintErrors };
};

export default function evaluateSync(
  userScript: string,
  dataTree: DataTree,
  resolvedFunctions: Record<string, any>,
  isJSCollection: boolean,
  context?: EvaluateContext,
  evalArguments?: Array<any>,
): EvalResult {
  return (function() {
    let errors: EvaluationError[] = [];
    let result;
    /**** Setting the eval context ****/
    const GLOBAL_DATA: Record<string, any> = createGlobalData(
      dataTree,
      resolvedFunctions,
      isJSCollection,
      context,
      evalArguments,
    );
    GLOBAL_DATA.ALLOW_ASYNC = false;
    const { lintErrors, script } = getUserScriptToEvaluate(
      userScript,
      GLOBAL_DATA,
      false,
      evalArguments,
    );
    // If nothing is present to evaluate, return instead of evaluating
    if (!script.length) {
      return {
        errors: [],
        result: undefined,
        triggers: [],
      };
    }

    errors = lintErrors;

    // Set it to self so that the eval function can have access to it
    // as global data. This is what enables access all appsmith
    // entity properties from the global context
    for (const entity in GLOBAL_DATA) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[entity] = GLOBAL_DATA[entity];
    }

    try {
      result = eval(script);
    } catch (e) {
      const errorMessage = `${e.name}: ${e.message}`;
      errors.push({
        errorMessage: errorMessage,
        severity: Severity.ERROR,
        raw: script,
        errorType: PropertyEvaluationErrorType.PARSE,
        originalBinding: userScript,
      });
    } finally {
      for (const entity in GLOBAL_DATA) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: No types available
        delete self[entity];
      }
    }

    return { result, errors };
  })();
}

export async function evaluateAsync(
  userScript: string,
  dataTree: DataTree,
  requestId: string,
  resolvedFunctions: Record<string, any>,
  context?: EvaluateContext,
  evalArguments?: Array<any>,
) {
  return (async function() {
    const errors: EvaluationError[] = [];
    let result;
    /**** Setting the eval context ****/
    const GLOBAL_DATA: Record<string, any> = createGlobalData(
      dataTree,
      resolvedFunctions,
      true,
      { ...context, requestId },
      evalArguments,
    );
    const { script } = getUserScriptToEvaluate(
      userScript,
      GLOBAL_DATA,
      true,
      evalArguments,
    );
    GLOBAL_DATA.ALLOW_ASYNC = true;
    // Set it to self so that the eval function can have access to it
    // as global data. This is what enables access all appsmith
    // entity properties from the global context
    Object.keys(GLOBAL_DATA).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[key] = GLOBAL_DATA[key];
    });

    try {
      result = await eval(script);
    } catch (error) {
      const errorMessage = `UncaughtPromiseRejection: ${error.message}`;
      errors.push({
        errorMessage: errorMessage,
        severity: Severity.ERROR,
        raw: script,
        errorType: PropertyEvaluationErrorType.PARSE,
        originalBinding: userScript,
      });
    } finally {
      completePromise(requestId, {
        result,
        errors,
        triggers: Array.from(self.TRIGGER_COLLECTOR),
      });
      for (const entity in GLOBAL_DATA) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: No types available
        delete self[entity];
      }
    }
  })();
}

export function isFunctionAsync(
  userFunction: unknown,
  dataTree: DataTree,
  resolvedFunctions: Record<string, any>,
) {
  return (function() {
    /**** Setting the eval context ****/
    const GLOBAL_DATA: Record<string, any> = {
      ALLOW_ASYNC: false,
      IS_ASYNC: false,
    };
    //// Add internal functions to dataTree;
    const dataTreeWithFunctions = enhanceDataTreeWithFunctions(dataTree);
    ///// Adding Data tree with functions
    Object.keys(dataTreeWithFunctions).forEach((datum) => {
      GLOBAL_DATA[datum] = dataTreeWithFunctions[datum];
    });
    if (!isEmpty(resolvedFunctions)) {
      Object.keys(resolvedFunctions).forEach((datum: any) => {
        const resolvedObject = resolvedFunctions[datum];
        Object.keys(resolvedObject).forEach((key: any) => {
          const dataTreeKey = GLOBAL_DATA[datum];
          if (dataTreeKey) {
            dataTreeKey[key] = resolvedObject[key];
          }
        });
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

    try {
      if (typeof userFunction === "function") {
        const returnValue = userFunction();
        if (!!returnValue && returnValue instanceof Promise) {
          self.IS_ASYNC = true;
        }
        if (self.TRIGGER_COLLECTOR.length) {
          self.IS_ASYNC = true;
        }
      }
    } catch (e) {
      console.error("Error when determining async function", e);
    }
    const isAsync = !!self.IS_ASYNC;
    for (const entity in GLOBAL_DATA) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      delete self[entity];
    }
    return isAsync;
  })();
}
