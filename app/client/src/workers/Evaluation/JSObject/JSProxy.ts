import { isEmpty, set } from "lodash";
import { MessageType, sendMessage } from "utils/MessageUtil";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { isPromise } from "workers/Evaluation/JSObject/utils";
import { postJSFunctionExecutionLog } from "@appsmith/workers/Evaluation/JSObject/postJSFunctionExecution";

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

export type JSFunctionProxy = (
  JSFunction: (...args: unknown[]) => unknown,
  fullName: string,
) => unknown;

export const jsFunctionProxyHandler = (
  fullName: string,
  funcExecutionStart: (fullName: string) => void,
  funcExecutionEnd: (data: JSExecutionData) => void,
) => ({
  apply: function(target: any, thisArg: unknown, argumentsList: any) {
    funcExecutionStart(fullName);
    let returnValue;
    try {
      returnValue = Reflect.apply(target, thisArg, argumentsList);
    } catch (e) {
      funcExecutionEnd({
        data: undefined,
        funcName: fullName,
      });
      throw e;
    }

    if (isPromise(returnValue)) {
      returnValue
        .then((result) => {
          funcExecutionEnd({
            data: result,
            funcName: fullName,
          });
        })
        .catch(() => {
          funcExecutionEnd({
            data: undefined,
            funcName: fullName,
          });
        });
      return returnValue;
    }
    funcExecutionEnd({
      data: returnValue,
      funcName: fullName,
    });
    return returnValue;
  },
});

export class JSProxy {
  // Holds list of all js execution data during an eval cycle
  private dataStore: Record<string, unknown> = {};
  // The number of functions called, which have not completed.
  private pendingExecutionCount = 0;
  // Has eval completed?
  private evaluationEnded = false;

  constructor() {
    this.JSFunctionProxy = this.JSFunctionProxy.bind(this);
    this.postData = this.postData.bind(this);
    this.functionExecutionStart = this.functionExecutionStart.bind(this);
    this.functionExecutionEnd = this.functionExecutionEnd.bind(this);
    this.setEvaluationEnd = this.setEvaluationEnd.bind(this);
  }

  public setEvaluationEnd(val: boolean) {
    this.evaluationEnded = val;
    this.postData();
  }

  // When a function is called, increase number of pending functions;
  private functionExecutionStart(fullName: string) {
    this.pendingExecutionCount += 1;
    postJSFunctionExecutionLog(fullName);
    this.postData();
  }

  // When a function has completed, decrease number of pending functions;
  private functionExecutionEnd({ data, funcName }: JSExecutionData) {
    set(this.dataStore, [funcName], data);
    this.pendingExecutionCount -= 1;
    this.postData();
  }

  private postData() {
    // This method determines the right time to post message to the main thread
    // We ensure that all function executions have completed.
    const { dataStore, evaluationEnded, pendingExecutionCount } = this;
    if (evaluationEnded && pendingExecutionCount === 0 && !isEmpty(dataStore)) {
      const { data, errors } = this.getSanitizedData(dataStore);
      sendMessage.call(self, {
        messageType: MessageType.DEFAULT,
        body: {
          data: {
            JSExecutionData: data,
            JSExecutionErrors: errors,
          },
          method: MAIN_THREAD_ACTION.PROCESS_JS_FUNCTION_EXECUTION,
        },
      });
    }
  }

  private getSanitizedData(dataStore: Record<string, unknown>) {
    const errors: Record<string, unknown> = {};
    const data: Record<string, unknown> = {};
    for (const funcName of Object.keys(dataStore)) {
      try {
        self.structuredClone(dataStore[funcName]);
        data[funcName] = dataStore[funcName];
      } catch (e) {
        errors[funcName] = {
          message: `Execution of ${funcName} returned an unserializable data`,
        };
        data[funcName] = undefined;
      }
    }
    return { data, errors };
  }

  // Wrapper around JS Functions
  public JSFunctionProxy(
    jsFunction: (...args: unknown[]) => unknown,
    jsFunctionFullName: string,
  ) {
    return new Proxy(
      jsFunction,
      jsFunctionProxyHandler(
        jsFunctionFullName,
        this.functionExecutionStart,
        this.functionExecutionEnd,
      ),
    );
  }
}
