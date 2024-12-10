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
import type { TriggerMeta } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import indirectEval from "./indirectEval";
import DOM_APIS from "./domApis";
import {
  JSLibraryAccessor,
  libraryReservedIdentifiers,
} from "../common/JSLibrary";
import {
  ActionInDataFieldErrorModifier,
  errorModifier,
  FoundPromiseInSyncEvalError,
  PrimitiveErrorModifier,
  TypeErrorModifier,
} from "./errorModifier";
import { getDataTreeContext } from "ee/workers/Evaluation/Actions";
import { set } from "lodash";
import { klona } from "klona";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";

export interface EvalResult {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const topLevelWorkerAPIs = Object.keys(self).reduce(
  (acc, key: string) => {
    acc[key] = true;

    return acc;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  {} as any,
);

const ignoreGlobalObjectKeys = new Set([
  "evaluationVersion",
  "window",
  "document",
  "location",
]);

export function resetWorkerGlobalScope() {
  const jsLibraryAccessorSet = JSLibraryAccessor.getSet();

  for (const key of Object.keys(self)) {
    if (topLevelWorkerAPIs[key] || DOM_APIS[key]) continue;

    //TODO: Remove this once we have a better way to handle this
    if (ignoreGlobalObjectKeys.has(key)) continue;

    if (jsLibraryAccessorSet.has(key)) continue;

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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * overrideContext is a set of key-value pairs where they key is a path
 * and the value is any value.
 *
 * The purpose of overrideContext is to update the EVAL_CONTEXT's entity properties
 * with new value during runtime.
 * An example of runtime would be execution of a query where some parameters are passed
 * to the .run function.
 * This enables to override the entities and their values in EVAL_CONTEXT without any side-effects
 * to the actual dataTree since this is a non-persistent transient state of evaluation.
 *
 * Example:
 * overrideContext = {
 *  "Input1.text": "hello"
 * }
 * // before overriding
 * EVAL_CONTEXT = {
 *  "Input1": {
 *    "text": "Hey!"
 *  }
 * "Text1": {
 *    "text": "YOLO"
 *  }
 * }
 *
 * // after overriding just for the particular evaluation
 * EVAL_CONTEXT = {
 *  "Input1": {
 *    "text": "Hello"
 *  },
 * "Text1": {
 *  "text": "YOLO"
 * }
 *
 * Where is this overriding actually used?
 * At the time of writing this, the use case originated to evaluate run-time params of a
 * query module instance as pass them off as inputs.
 * Eg. QueryModule1.run({ input1: "10" }) and the bindings for this could be QueryModule1.inputs.input1
 * So the executionParams needs to be put in the EVAL_CONTEXT with the above path and the supplied value.
 * Therefore an overriding of the EVAL_CONTEXT is required during runtime execution.
 *
 * Why klona is used to cloned here?
 * Since EVAL_CONTEXT is build from the dataTree by adding the entities directly referentially
 * Eg. EVAL_CONTEXT["Input1"] = dataTree["Input1"]
 * Overriding the EVAL_CONTEXT directly using set(EVAL_CONTEXT, path, value); would mutate the dataTree
 * thus polluting the dataTree for the next evaluation.
 * To avoid this, all the unique entities of present in the overrideContext is identified and cloned once for
 * the particular entities only. This avoid unnecessary cloning of every entity and further multiple times.
 *
 */
const overrideEvalContext = (
  EVAL_CONTEXT: EvalContext,
  overrideContext?: Record<string, unknown>,
) => {
  if (overrideContext) {
    const entitiesClonedSoFar = new Set();

    Object.keys(overrideContext).forEach((path) => {
      const { entityName } = getEntityNameAndPropertyPath(path);

      if (entityName in EVAL_CONTEXT && !entitiesClonedSoFar.has(entityName)) {
        entitiesClonedSoFar.add(entityName);
        EVAL_CONTEXT[entityName] = klona(EVAL_CONTEXT[entityName]);
      }
    });

    Object.entries(overrideContext).forEach(([path, value]) => {
      set(EVAL_CONTEXT, path, value);
    });
  }
};

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

  const dataTreeContext = getDataTreeContext({
    dataTree,
    configTree,
    removeEntityFunctions: !!removeEntityFunctions,
    isTriggerBased,
  });

  Object.assign(EVAL_CONTEXT, dataTreeContext);

  overrideEvalContext(EVAL_CONTEXT, context?.overrideContext);

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thisContext?: Record<string, any>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalContext?: Record<string, any>;
  requestId?: string;
  eventType?: EventType;
  triggerMeta?: TriggerMeta;
  overrideContext?: Record<string, unknown>;
}

export const getUserScriptToEvaluate = (
  userScript: string,
  isTriggerBased: boolean,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function evaluateSync(
  userScript: string,
  dataTree: DataTree,
  isJSCollection: boolean,
  context?: EvaluateContext,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evalArguments?: Array<any>,
  configTree: ConfigTree = {},
  scopeCache?: EvalContext,
): EvalResult {
  return (function () {
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

    self["$isDataField"] = true;
    const EVAL_CONTEXT: EvalContext = {};

    ///// Adding callback data
    EVAL_CONTEXT.ARGUMENTS = evalArguments;
    //// Adding contextual data not part of data tree
    EVAL_CONTEXT.THIS_CONTEXT = context?.thisContext || {};

    if (context?.globalContext) {
      Object.assign(EVAL_CONTEXT, context.globalContext);
    }

    if (scopeCache) {
      Object.assign(EVAL_CONTEXT, scopeCache);
    } else {
      const dataTreeContext = getDataTreeContext({
        dataTree,
        configTree,
        removeEntityFunctions: false,
        isTriggerBased: isJSCollection,
      });

      Object.assign(EVAL_CONTEXT, dataTreeContext);
    }

    overrideEvalContext(EVAL_CONTEXT, context?.overrideContext);

    Object.assign(self, EVAL_CONTEXT);

    try {
      result = indirectEval(script);

      if (result instanceof Promise) {
        /**
         * If a promise is returned in data field then show the error to help understand data field doesn't await to resolve promise.
         * NOTE: Awaiting for promise will make data field evaluation slower.
         */
        throw new FoundPromiseInSyncEvalError();
      }
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shouldAddSetter(setter: any, entity: DataTreeEntity) {
  const isDisabledExpression = setter.disabled;

  if (!isDisabledExpression) return true;

  const isDisabledFn = new Function("options", isDisabledExpression);

  return !isDisabledFn({ entity });
}
