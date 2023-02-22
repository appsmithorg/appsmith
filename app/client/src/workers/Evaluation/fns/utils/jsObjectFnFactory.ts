import { isPromise } from "workers/Evaluation/JSObject/utils";
import { postJSFunctionExecutionLog } from "@appsmith/workers/Evaluation/JSObject/postJSFunctionExecution";
import TriggerEmitter, { BatchKey } from "./TriggerEmitter";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { WorkerMessenger } from "./Messenger";
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
      const actionName = name.split(".")[1];
      const calledJsObject = name.split(".")[0];

      // eslint-disable-next-line
      // @ts-ignore
      const jsObject = globalThis[calledJsObject];
      const jsObjectConfig = jsObject?.config?.actions?.find(
        (action: any) => action.name === actionName,
      );

      if (jsObjectConfig.confirmBeforeExecute) {
        const response = await WorkerMessenger.request({
          method: MAIN_THREAD_ACTION.CONFIRM_BEFORE_EXECUTE_JS_FUNCTION,
          data: {
            actionName,
            calledJsObject,
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
