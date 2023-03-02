import { isPromise } from "workers/Evaluation/JSObject/utils";
import { postJSFunctionExecutionLog } from "@appsmith/workers/Evaluation/JSObject/postJSFunctionExecution";
import TriggerEmitter, { BatchKey } from "./TriggerEmitter";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { WorkerMessenger } from "./Messenger";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
declare global {
  interface Window {
    structuredClone: (
      value: any,
      options?: StructuredSerializeOptions | undefined,
    ) => any;
  }
}
export interface JSExecutionData {
  data: unknown;
  funcName: string;
}

function saveExecutionData(name: string, data: unknown) {
  TriggerEmitter.emit(BatchKey.process_batched_fn_execution, {
    name,
    data,
  });
}

export function jsObjectFunctionFactory<P extends ReadonlyArray<unknown>>(
  fn: (...args: P) => unknown,
  name: string,
  postProcessors: Array<(name: string, res: unknown) => void> = [
    saveExecutionData,
    postJSFunctionExecutionLog,
  ],
) {
  return async (...args: P) => {
    try {
      const { entityName, propertyPath } = getEntityNameAndPropertyPath(name);

      // @ts-expect-error: Types are not available
      const jsObject = self[entityName];
      const jsObjectConfig = jsObject?.config?.actions?.find(
        (action: any) => action.name === propertyPath,
      );

      if (jsObjectConfig.confirmBeforeExecute) {
        const response = await WorkerMessenger.request({
          method: MAIN_THREAD_ACTION.CONFIRM_BEFORE_EXECUTE_JS_FUNCTION,
          data: {
            entityName,
            propertyPath,
            jsObjectConfig,
          },
        });

        if (!response.data.confirmed) {
          return "cancelled";
        }
      }
      const result = fn(...args);
      if (isPromise(result)) {
        result.then((res) => {
          postProcessors.forEach((p) => p(name, res));
          return res;
        });
        result.catch((e) => {
          postProcessors.forEach((p) => p(name, undefined));
          throw e;
        });
      } else {
        postProcessors.forEach((p) => p(name, result));
      }

      return result;
    } catch (e) {
      postProcessors.forEach((postProcessor) => {
        postProcessor(name, undefined);
      });
      throw e;
    }
  };
}
