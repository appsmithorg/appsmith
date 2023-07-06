import { isPromise } from "workers/Evaluation/JSObject/utils";
import { postJSFunctionExecutionLog } from "@appsmith/workers/Evaluation/JSObject/postJSFunctionExecution";
import TriggerEmitter, { BatchKey } from "./TriggerEmitter";
import ExecutionMetaData from "./ExecutionMetaData";
import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";

declare global {
  interface Window {
    structuredClone: (
      value: any,
      options?: StructuredSerializeOptions | undefined,
    ) => any;
  }
}
export type PostProcessorArg = {
  executionMetaData: ReturnType<typeof ExecutionMetaData.getExecutionMetaData>;
  jsFnFullName: string;
  executionResponse: unknown;
};

export type PostProcessor = (args: PostProcessorArg) => void;
export interface JSExecutionData {
  data: unknown;
  funcName: string;
}

function saveExecutionData({
  executionResponse,
  jsFnFullName,
}: PostProcessorArg) {
  TriggerEmitter.emit(BatchKey.process_batched_fn_execution, {
    name: jsFnFullName,
    data: executionResponse,
  });
}

function logJSExecution({ executionMetaData, jsFnFullName }: PostProcessorArg) {
  switch (executionMetaData.triggerMeta.triggerKind) {
    case TriggerKind.EVENT_EXECUTION: {
      TriggerEmitter.emit(BatchKey.process_batched_fn_invoke_log, jsFnFullName);
      break;
    }
    default: {
      break;
    }
  }
  postJSFunctionExecutionLog(jsFnFullName);
}

export function jsObjectFunctionFactory<P extends ReadonlyArray<unknown>>(
  fn: (...args: P) => unknown,
  name: string,
  postProcessors: PostProcessor[] = [saveExecutionData, logJSExecution],
) {
  return function (this: unknown, ...args: P) {
    if (!ExecutionMetaData.getExecutionMetaData().enableJSFnPostProcessors) {
      return fn.call(this, ...args);
    }
    const executionMetaData = ExecutionMetaData.getExecutionMetaData();
    try {
      const result = fn.call(this, ...args);
      if (isPromise(result)) {
        result.then((res) => {
          postProcessors.forEach((p) =>
            p({
              executionMetaData,
              jsFnFullName: name,
              executionResponse: res,
            }),
          );
          return res;
        });
        result.catch((e) => {
          postProcessors.forEach((p) =>
            p({
              executionMetaData,
              jsFnFullName: name,
              executionResponse: undefined,
            }),
          );
          throw e;
        });
      } else {
        postProcessors.forEach((p) =>
          p({
            executionMetaData,
            jsFnFullName: name,
            executionResponse: result,
          }),
        );
      }
      return result;
    } catch (e) {
      postProcessors.forEach((postProcessor) => {
        postProcessor({
          executionMetaData,
          jsFnFullName: name,
          executionResponse: undefined,
        });
      });
      throw e;
    }
  };
}
