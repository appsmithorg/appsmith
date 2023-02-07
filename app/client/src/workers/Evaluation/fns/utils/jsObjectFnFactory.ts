import { isPromise } from "workers/Evaluation/JSObject/utils";
import { postJSFunctionExecutionLog } from "@appsmith/workers/Evaluation/JSObject/postJSFunctionExecution";
import TriggerEmitter, { BatchKey } from "./TriggerEmitter";

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
  return (...args: P) => {
    try {
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
