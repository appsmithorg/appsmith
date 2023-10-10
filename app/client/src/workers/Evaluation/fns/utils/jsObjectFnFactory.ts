import { isPromise } from "workers/Evaluation/JSObject/utils";
import { postJSFunctionExecutionLog } from "@appsmith/workers/Evaluation/JSObject/postJSFunctionExecution";
import TriggerEmitter, { BatchKey } from "./TriggerEmitter";
import ExecutionMetaData from "./ExecutionMetaData";
import { errorModifier } from "workers/Evaluation/errorModifier";

declare global {
  interface Window {
    structuredClone: (
      value: any,
      options?: StructuredSerializeOptions | undefined,
    ) => any;
  }
}
export interface PostProcessorArg {
  executionMetaData: ReturnType<typeof ExecutionMetaData.getExecutionMetaData>;
  jsFnFullName: string;
  executionResponse: unknown;
  isSuccess: boolean;
}

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

export function jsObjectFunctionFactory<P extends ReadonlyArray<unknown>>(
  fn: (...args: P) => unknown,
  name: string,
  postProcessors: PostProcessor[] = [
    saveExecutionData,
    postJSFunctionExecutionLog,
  ],
) {
  return function (this: unknown, ...args: P) {
    if (!ExecutionMetaData.getExecutionMetaData().enableJSFnPostProcessors) {
      let result;
      try {
        result = fn.call(this, ...args);
        return result;
      } catch (e: any) {
        e.message = `Error while executing ${name}. ${
          errorModifier.run(e, fn.toString()).errorMessage.message
        }`;
        throw e;
      }
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
              isSuccess: true,
            }),
          );
          return res;
        });
        result.catch((e) => {
          e.message = `Error while executing ${name}. ${
            errorModifier.run(e, fn.toString()).errorMessage.message
          }`;
          postProcessors.forEach((p) =>
            p({
              executionMetaData,
              jsFnFullName: name,
              executionResponse: undefined,
              isSuccess: true,
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
            isSuccess: true,
          }),
        );
      }
      return result;
    } catch (e: any) {
      e.message = `Error while executing ${name}. ${
        errorModifier.run(e, fn.toString()).errorMessage.message
      }`;
      postProcessors.forEach((postProcessor) => {
        postProcessor({
          executionMetaData,
          jsFnFullName: name,
          executionResponse: undefined,
          isSuccess: false,
        });
      });
      throw e;
    }
  };
}
