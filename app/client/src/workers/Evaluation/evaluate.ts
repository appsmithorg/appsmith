/* eslint-disable no-console */
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import unescapeJS from "unescape-js";
import { LogObject, Severity } from "entities/AppsmithConsole";
import { ActionDescription } from "@appsmith/entities/DataTree/actionTriggers";
import userLogs from "./UserLog";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { TriggerMeta } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import indirectEval from "./indirectEval";
import { JSFunctionProxy, JSProxy } from "workers/Evaluation/JSObject/JSProxy";
import { DOM_APIS } from "./SetupDOM";
import { JSLibraries, libraryReservedIdentifiers } from "../common/JSLibrary";
import { errorModifier, FoundPromiseInSyncEvalError } from "./errorModifier";
import { addDataTreeToContext } from "@appsmith/workers/Evaluation/Actions";

export type EvalResult = {
  result: any;
  errors: EvaluationError[];
  triggers?: ActionDescription[];
  logs?: LogObject[];
};

export enum EvaluationScriptType {
  EXPRESSION = "EXPRESSION",
  ANONYMOUS_FUNCTION = "ANONYMOUS_FUNCTION",
  ASYNC_ANONYMOUS_FUNCTION = "ASYNC_ANONYMOUS_FUNCTION",
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
  [EvaluationScriptType.ASYNC_ANONYMOUS_FUNCTION]: `
  async function callback (script) {
    const userFunction = script;
    const result = await userFunction?.apply(THIS_CONTEXT, ARGUMENTS);
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

const topLevelWorkerAPIs = Object.keys(self).reduce((acc, key: string) => {
  acc[key] = true;
  return acc;
}, {} as any);

function resetWorkerGlobalScope() {
  for (const key of Object.keys(self)) {
    if (topLevelWorkerAPIs[key] || DOM_APIS[key]) continue;
    //TODO: Remove this once we have a better way to handle this
    if (["evaluationVersion", "window", "document", "location"].includes(key))
      continue;
    if (JSLibraries.find((lib) => lib.accessor.includes(key))) continue;
    if (libraryReservedIdentifiers[key]) continue;
    try {
      // @ts-expect-error: Types are not available
      delete self[key];
    } catch (e) {
      // @ts-expect-error: Types are not available
      self[key] = undefined;
    }
  }
}

export const getScriptType = (
  evalArgumentsExist = false,
  isTriggerBased = false,
): EvaluationScriptType => {
  let scriptType = EvaluationScriptType.EXPRESSION;
  if (evalArgumentsExist && isTriggerBased) {
    scriptType = EvaluationScriptType.ASYNC_ANONYMOUS_FUNCTION;
  } else if (evalArgumentsExist && !isTriggerBased) {
    scriptType = EvaluationScriptType.ANONYMOUS_FUNCTION;
  } else if (isTriggerBased && !evalArgumentsExist) {
    scriptType = EvaluationScriptType.TRIGGERS;
  }
  return scriptType;
};

export const additionalLibrariesNames: string[] = [];

export const getScriptToEval = (
  userScript: string,
  type: EvaluationScriptType,
): string => {
  // Using replace here would break scripts with replacement patterns (ex: $&, $$)
  const buffer = EvaluationScripts[type].split(ScriptTemplate);
  return `${buffer[0]}${userScript}${buffer[1]}`;
};

const beginsWithLineBreakRegex = /^\s+|\s+$/;

export type EvalContext = Record<string, any>;
type ResolvedFunctions = Record<string, any>;
export interface createEvaluationContextArgs {
  dataTree: DataTree;
  resolvedFunctions: ResolvedFunctions;
  context?: EvaluateContext;
  isTriggerBased: boolean;
  evalArguments?: Array<unknown>;
  // Whether not to add functions like "run", "clear" to entity in global data
  skipEntityFunctions?: boolean;
  JSFunctionProxy?: JSFunctionProxy;
}
/**
 * This method created an object with dataTree and appsmith's framework actions that needs to be added to worker global scope for the JS code evaluation to then consume it.
 *
 * Example:
 * - For `eval("Table1.tableData")` code to work as expected, we define Table1.tableData in worker global scope and for that we use `createEvaluationContext` to get the object to set in global scope.
 */
export const createEvaluationContext = (args: createEvaluationContextArgs) => {
  const {
    context,
    dataTree,
    evalArguments,
    isTriggerBased,
    JSFunctionProxy,
    resolvedFunctions,
    skipEntityFunctions,
  } = args;

  const EVAL_CONTEXT: EvalContext = {};
  ///// Adding callback data
  EVAL_CONTEXT.ARGUMENTS = evalArguments;
  //// Adding contextual data not part of data tree
  EVAL_CONTEXT.THIS_CONTEXT = context?.thisContext || {};

  if (context?.globalContext) {
    Object.assign(EVAL_CONTEXT, context.globalContext);
  }

  addDataTreeToContext({
    EVAL_CONTEXT,
    dataTree,
    skipEntityFunctions: !!skipEntityFunctions,
    eventType: context?.eventType,
    isTriggerBased,
  });

  assignJSFunctionsToContext(EVAL_CONTEXT, resolvedFunctions, JSFunctionProxy);

  return EVAL_CONTEXT;
};

export const assignJSFunctionsToContext = (
  EVAL_CONTEXT: EvalContext,
  resolvedFunctions: ResolvedFunctions,
  JSFunctionProxy?: JSFunctionProxy,
) => {
  const jsObjectNames = Object.keys(resolvedFunctions || {});
  for (const jsObjectName of jsObjectNames) {
    const resolvedObject = resolvedFunctions[jsObjectName];
    const jsObject = EVAL_CONTEXT[jsObjectName];
    const jsObjectFunction: Record<string, Record<"data", unknown>> = {};
    if (!jsObject) continue;
    for (const fnName of Object.keys(resolvedObject)) {
      const fn = resolvedObject[fnName];
      if (typeof fn !== "function") continue;
      // Investigate promisify of JSObject function confirmation
      // Task: https://github.com/appsmithorg/appsmith/issues/13289
      // Previous implementation commented code: https://github.com/appsmithorg/appsmith/pull/18471
      const data = jsObject[fnName]?.data;
      jsObjectFunction[fnName] = JSFunctionProxy
        ? JSFunctionProxy(fn, jsObjectName + "." + fnName)
        : fn;
      if (!!data) {
        jsObjectFunction[fnName]["data"] = data;
      }
    }

    EVAL_CONTEXT[jsObjectName] = Object.assign({}, jsObject, jsObjectFunction);
  }
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
  eventType?: EventType;
  triggerMeta?: TriggerMeta;
};

export const getUserScriptToEvaluate = (
  userScript: string,
  isTriggerBased: boolean,
  evalArguments?: Array<any>,
) => {
  const unescapedJS = sanitizeScript(userScript);
  // If nothing is present to evaluate, return
  if (!unescapedJS.length) {
    return {
      script: "",
    };
  }
  const scriptType = getScriptType(!!evalArguments, isTriggerBased);
  const script = getScriptToEval(unescapedJS, scriptType);
  return { script };
};

export default function evaluateSync(
  userScript: string,
  dataTree: DataTree,
  resolvedFunctions: Record<string, any>,
  isJSCollection: boolean,
  context?: EvaluateContext,
  evalArguments?: Array<any>,
  skipLogsOperations = false,
): EvalResult {
  return (function() {
    resetWorkerGlobalScope();
    const errors: EvaluationError[] = [];
    let logs: LogObject[] = [];
    let result;

    // skipping log reset if the js collection is being evaluated without run
    // Doing this because the promise execution is losing logs in the process due to resets
    if (!skipLogsOperations) userLogs.resetLogs();

    /**** Setting the eval context ****/
    const evalContext: EvalContext = createEvaluationContext({
      dataTree,
      resolvedFunctions,
      context,
      evalArguments,
      isTriggerBased: isJSCollection,
    });

    evalContext.ALLOW_SYNC = true;

    const { script } = getUserScriptToEvaluate(
      userScript,
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

    // Set it to self so that the eval function can have access to it
    // as global data. This is what enables access all appsmith
    // entity properties from the global context
    Object.assign(self, evalContext);

    try {
      result = indirectEval(script);
      if (result instanceof Promise) {
        /**
         * If a promise is returned in sync field then show the error to help understand sync field doesn't await to resolve promise.
         * NOTE: Awaiting for promise will make sync field evaluation slower.
         */
        throw new FoundPromiseInSyncEvalError();
      }
    } catch (error) {
      errors.push({
        errorMessage: errorModifier.run(error as Error),
        severity: Severity.ERROR,
        raw: script,
        errorType: PropertyEvaluationErrorType.PARSE,
        originalBinding: userScript,
      });
    } finally {
      if (!skipLogsOperations) logs = userLogs.flushLogs();
      evalContext.ALLOW_SYNC = false;
      for (const entityName in evalContext) {
        if (evalContext.hasOwnProperty(entityName)) {
          // @ts-expect-error: Types are not available
          delete self[entityName];
        }
      }
    }
    return { result, errors, logs };
  })();
}

export async function evaluateAsync(
  userScript: string,
  dataTree: DataTree,
  resolvedFunctions: Record<string, any>,
  context?: EvaluateContext,
  evalArguments?: Array<any>,
) {
  return (async function() {
    resetWorkerGlobalScope();
    const errors: EvaluationError[] = [];
    let result;
    let logs;

    /**** JSObject function proxy method ****/
    const { JSFunctionProxy, setEvaluationEnd } = new JSProxy();

    /**** console logs setup ****/
    userLogs.resetLogs();
    userLogs.setCurrentRequestInfo({
      eventType: context?.eventType,
      triggerMeta: context?.triggerMeta,
    });

    /**** Setting the eval context ****/

    const evalContext: EvalContext = createEvaluationContext({
      dataTree,
      resolvedFunctions,
      context,
      evalArguments,
      JSFunctionProxy,
      isTriggerBased: true,
    });

    const { script } = getUserScriptToEvaluate(userScript, true, evalArguments);
    evalContext.ALLOW_SYNC = false;

    // Set it to self so that the eval function can have access to it
    // as global data. This is what enables access all appsmith
    // entity properties from the global context
    Object.assign(self, evalContext);

    try {
      result = await indirectEval(script);
      logs = userLogs.flushLogs();
    } catch (e) {
      const error = e as Error;
      const errorMessage = error.name
        ? `${error.name}: ${error.message}`
        : `UncaughtPromiseRejection: ${error.message}`;
      errors.push({
        errorMessage: errorMessage,
        severity: Severity.ERROR,
        raw: script,
        errorType: PropertyEvaluationErrorType.PARSE,
        originalBinding: userScript,
      });
      logs = userLogs.flushLogs();
    } finally {
      setEvaluationEnd(true);

      // Adding this extra try catch because there are cases when logs have child objects
      // like functions or promises that cause issue in complete promise action, thus
      // leading the app into a bad state.
      return {
        result,
        errors,
        logs,
        triggers: Array.from(self.TRIGGER_COLLECTOR),
      };
    }
  })();
}
