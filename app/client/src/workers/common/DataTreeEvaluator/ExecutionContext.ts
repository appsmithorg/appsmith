import { Severity } from "entities/AppsmithConsole";
import type { IEntity } from "plugins/Common/entity";
import {
  PropertyEvaluationErrorType,
  type EvaluationError,
} from "utils/DynamicBindingUtils";
import { FoundPromiseInSyncEvalError } from "workers/Evaluation/errorModifier";
import { getUserScriptToEvaluate } from "workers/Evaluation/evaluate";
import indirectEval from "workers/Evaluation/indirectEval";

export class ExecutionContext {
  #entitiesNames: Array<string> = [];
  constructor() {}
  addEntity(name: string, value: unknown) {
    this.#entitiesNames.push(name);
    //@ts-expect-error adding to self
    self[name] = value;
  }
  destroy() {
    for (const entityName of this.#entitiesNames) {
      //@ts-expect-error deleting from self
      delete self[entityName];
    }
    this.#entitiesNames = [];
  }
}

export class ScriptExecutor {
  #executionContext: ExecutionContext;
  constructor() {
    this.#executionContext = new ExecutionContext();
  }
  getExecutionContext() {
    return this.#executionContext;
  }
  computeValue(entity: IEntity, propertyPath: string) {
    const value = entity.getPropertyValue(propertyPath);
    const { errors, result } = this.execute(entity, propertyPath);
    return { errors, result };
  }
  execute(userScript: string) {
    const errors: EvaluationError[] = [];
    let result;

    const { script } = getUserScriptToEvaluate(
      userScript,
      false,
      // evalArguments,
    );

    // If nothing is present to evaluate, return instead of evaluating
    if (!script.length) {
      return {
        errors: [],
        result: undefined,
      };
    }

    try {
      result = indirectEval(script);
      if (result instanceof Promise) {
        /**
         * If a promise is returned in data field then show the error to help understand data field doesn't await to resolve promise.
         * NOTE: Awaiting for promise will make data field evaluation slower.
         */
        throw new FoundPromiseInSyncEvalError();
      }
    } catch (error) {
      // const { errorCategory, errorMessage } = errorModifier.run(error as Error);
      errors.push({
        errorMessage: error as Error,
        severity: Severity.ERROR,
        raw: script,
        errorType: PropertyEvaluationErrorType.PARSE,
        originalBinding: userScript,
        // kind: errorCategory && {
        //   category: errorCategory,
        //   rootcause: "",
        // },
      });
    } finally {
      self["$isDataField"] = false;
    }
    return { result, errors };
  }
}
