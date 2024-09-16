import { isPromise } from "workers/Evaluation/JSObject/utils";
import TriggerEmitter, { BatchKey } from "./TriggerEmitter";
import ExecutionMetaData from "./ExecutionMetaData";
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addMetaDataToError(e: any, fnName: string, fnString: string) {
  // To account for cascaded errors, if error has a source, retain it
  e.source = e.source || fnName;
  e.userScript = e.userScript || fnString;
  return e;
}
declare global {
  interface Window {
    structuredClone: (
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: any,
      options?: StructuredSerializeOptions | undefined,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  postProcessors: PostProcessor[] = [saveExecutionData],
) {
  return function (this: unknown, ...args: P) {
    if (!ExecutionMetaData.getExecutionMetaData().enableJSFnPostProcessors) {
      let result;
      try {
        result = fn.call(this, ...args);
        return result;
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        e = addMetaDataToError(e, name, fn.toString());
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
          e = addMetaDataToError(e, name, fn.toString());
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      e = addMetaDataToError(e, name, fn.toString());
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
