/* eslint-disable no-console */
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import unescapeJS from "unescape-js";
import { Severity } from "entities/AppsmithConsole";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { TriggerMeta } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import indirectEval from "./indirectEval";
import DOM_APIS from "./domApis";
import { JSLibraries, libraryReservedIdentifiers } from "../common/JSLibrary";
import {
  ActionInDataFieldErrorModifier,
  errorModifier,
  FoundPromiseInSyncEvalError,
  PrimitiveErrorModifier,
  TypeErrorModifier,
} from "./errorModifier";
import { addDataTreeToContext } from "@appsmith/workers/Evaluation/Actions";

export interface EvalResult {
  result: any;
  errors: EvaluationError[];
}

export enum EvaluationScriptType {
  EXPRESSION = "EXPRESSION",
  ANONYMOUS_FUNCTION = "ANONYMOUS_FUNCTION",
  ASYNC_ANONYMOUS_FUNCTION = "ASYNC_ANONYMOUS_FUNCTION",
  TRIGGERS = "TRIGGERS",
  OBJECT_PROPERTY = "OBJECT_PROPERTY",
}

export const ScriptTemplate = "<<string>>";

export const EvaluationScripts: Record<EvaluationScriptType, string> = {
  [EvaluationScriptType.EXPRESSION]: `
  function $$closedFn () {
    const $$result = ${ScriptTemplate}
    return $$result
  }
  $$closedFn.call(THIS_CONTEXT)
  `,
  [EvaluationScriptType.ANONYMOUS_FUNCTION]: `
  function $$closedFn (script) {
    const $$userFunction = script;
    const $$result = $$userFunction?.apply(THIS_CONTEXT, ARGUMENTS);
    return $$result
  }
  $$closedFn(${ScriptTemplate})
  `,
  [EvaluationScriptType.ASYNC_ANONYMOUS_FUNCTION]: `
  async function $$closedFn (script) {
    const $$userFunction = script;
    const $$result = $$userFunction?.apply(THIS_CONTEXT, ARGUMENTS);
    return await $$result;
  }
  $$closedFn(${ScriptTemplate})
  `,
  [EvaluationScriptType.TRIGGERS]: `
  async function $$closedFn () {
    const $$result = ${ScriptTemplate};
    return await $$result
  }
  $$closedFn.call(THIS_CONTEXT)
  `,
  [EvaluationScriptType.OBJECT_PROPERTY]: `
  function $$closedFn () {
    const $$result = {${ScriptTemplate}}
    return $$result
  }
  $$closedFn.call(THIS_CONTEXT)
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
export interface createEvaluationContextArgs {
  dataTree: DataTree;
  configTree?: ConfigTree;
  context?: EvaluateContext;
  isTriggerBased: boolean;
  evalArguments?: Array<unknown>;
  /*
   Whether to remove functions like "run", "clear" from entities in global context
   use case => To show lint warning when Api.run is used in a function bound to a data field (Eg. Button.text)
   */
  removeEntityFunctions?: boolean;
}
/**
 * This method created an object with dataTree and appsmith's framework actions that needs to be added to worker global scope for the JS code evaluation to then consume it.
 *
 * Example:
 * - For `eval("Table1.tableData")` code to work as expected, we define Table1.tableData in worker global scope and for that we use `createEvaluationContext` to get the object to set in global scope.
 */
export const createEvaluationContext = (args: createEvaluationContextArgs) => {
  const {
    configTree = {},
    context,
    dataTree,
    evalArguments,
    isTriggerBased,
    removeEntityFunctions,
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
    configTree,
    removeEntityFunctions: !!removeEntityFunctions,
    isTriggerBased,
  });

  return EVAL_CONTEXT;
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
export interface EvaluateContext {
  thisContext?: Record<string, any>;
  globalContext?: Record<string, any>;
  requestId?: string;
  eventType?: EventType;
  triggerMeta?: TriggerMeta;
}

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

export function setEvalContext({
  configTree,
  context,
  dataTree,
  evalArguments,
  isDataField,
  isTriggerBased,
}: {
  context?: EvaluateContext;
  dataTree: DataTree;
  configTree?: ConfigTree;
  evalArguments?: Array<any>;
  isDataField: boolean;
  isTriggerBased: boolean;
}) {
  self["$isDataField"] = isDataField;

  const evalContext = createEvaluationContext({
    dataTree,
    configTree,
    context,
    evalArguments,
    isTriggerBased,
  });

  Object.assign(self, evalContext);
}

export default function evaluateSync(
  userScript: string,
  dataTree: DataTree,
  isJSCollection: boolean,
  context?: EvaluateContext,
  evalArguments?: Array<any>,
  configTree?: ConfigTree,
): EvalResult {
  return (function () {
    resetWorkerGlobalScope();
    const errors: EvaluationError[] = [];
    let result;

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

    setEvalContext({
      dataTree,
      configTree,
      isDataField: true,
      isTriggerBased: isJSCollection,
      context,
      evalArguments,
    });

    try {
      result = indirectEval(script);
      if (result instanceof Promise) {
        /**
         * If a promise is returned in data field then show the error to help understand data field doesn't await to resolve promise.
         * NOTE: Awaiting for promise will make data field evaluation slower.
         */
        throw new FoundPromiseInSyncEvalError();
      }
    } catch (error: any) {
      const { errorCategory, errorMessage, rootcause } = errorModifier.run(
        error,
        { userScript: error.userScript || userScript, source: error.source },
        [ActionInDataFieldErrorModifier, TypeErrorModifier],
      );
      errors.push({
        errorMessage,
        severity: Severity.ERROR,
        raw: script,
        errorType: PropertyEvaluationErrorType.PARSE,
        originalBinding: userScript,
        kind: {
          category: errorCategory,
          rootcause,
        },
      });
    } finally {
      self["$isDataField"] = false;
    }
    return { result, errors };
  })();
}

export async function evaluateAsync(
  userScript: string,
  dataTree: DataTree,
  configTree: ConfigTree,
  context?: EvaluateContext,
  evalArguments?: Array<any>,
) {
  return (async function () {
    resetWorkerGlobalScope();
    const errors: EvaluationError[] = [];
    let result;

    const { script } = getUserScriptToEvaluate(userScript, true, evalArguments);

    setEvalContext({
      dataTree,
      configTree,
      isDataField: false,
      isTriggerBased: true,
      context,
      evalArguments,
    });

    try {
      result = await indirectEval(script);
    } catch (error: any) {
      const { errorMessage } = errorModifier.run(
        error,
        { userScript: error.userScript || userScript, source: error.source },
        [PrimitiveErrorModifier, TypeErrorModifier],
      );
      errors.push({
        errorMessage: errorMessage,
        severity: Severity.ERROR,
        raw: script,
        errorType: PropertyEvaluationErrorType.PARSE,
        originalBinding: userScript,
      });
    } finally {
      return {
        result,
        errors,
      };
    }
  })();
}

export function shouldAddSetter(setter: any, entity: DataTreeEntity) {
  const isDisabledExpression = setter.disabled;

  if (!isDisabledExpression) return true;

  const isDisabledFn = new Function("options", isDisabledExpression);

  return !isDisabledFn({ entity });
}
