import { uniqueId } from "lodash";
import { isPromise } from "./utils";

// TO DO => Handle duplicate calls

// How each js function execution data is represented
export interface JSExecutionData {
  // Result from executing function
  data: unknown;
  // Name of function
  funcName: string;
}

export type JSFunctionProxy = (
  JSFunction: (...args: unknown[]) => unknown,
  fullName: string,
) => unknown;

export const JSFunctionProxyHandler = (
  fullName: string,
  // function used to update list of js execution data
  updateJSData: (data: JSExecutionData) => void,
  // function used to update list of js execution calls
  updateJSExecution: (funcName: string) => void,
) => ({
  apply: function(target: any, thisArg: unknown, argumentsList: any) {
    // As soon as a function call is made, update the list of js execution calls
    updateJSExecution(fullName);
    let returnValue;
    try {
      returnValue = Reflect.apply(target, thisArg, argumentsList);
    } catch (e) {
      updateJSData({
        data: undefined,
        funcName: fullName,
      });
      throw e;
    }

    // If the returnValue is a Promise, we update the data list with its "resolve" value,
    // and return a Promise that resolves this value
    if (isPromise(returnValue)) {
      returnValue
        .then((result) => {
          updateJSData({
            data: result,
            funcName: fullName,
          });
        })
        .catch(() => {
          updateJSData({
            data: undefined,
            funcName: fullName,
          });
        });
      return returnValue;
    }
    updateJSData({
      data: returnValue,
      funcName: fullName,
    });

    return returnValue;
  },
});

export class JSProxy {
  // Holds list of all js execution data during an eval cycle
  private dataList: JSExecutionData[] = [];
  // Holds list of all js execution calls during an eval cycle
  private functionExecutionList: string[] = [];
  private evaluationEnded = false;

  constructor() {
    this.JSFunctionProxy = this.JSFunctionProxy.bind(this);
    this.postData = this.postData.bind(this);
    this.addFunctionToExecutionList = this.addFunctionToExecutionList.bind(
      this,
    );
    this.addExecutionDataToList = this.addExecutionDataToList.bind(this);
    this.setEvaluationEnd = this.setEvaluationEnd.bind(this);
  }

  public setEvaluationEnd(val: boolean) {
    this.evaluationEnded = val;
    this.postData();
  }

  private addFunctionToExecutionList(func: string) {
    this.functionExecutionList.push(func);
    this.postData();
  }

  private addExecutionDataToList(data: JSExecutionData) {
    this.dataList.push(data);
    this.postData();
  }

  private postData() {
    // This method determines the right time to post message to the main thread
    // We ensure that all function executions have returned with data before send data to the main thread
    const { dataList, evaluationEnded, functionExecutionList } = this;
    if (
      evaluationEnded &&
      dataList.length &&
      dataList.length === functionExecutionList.length
    ) {
      self.postMessage({
        promisified: true,
        responseData: {
          JSData: dataList,
        },
        requestId: uniqueId(),
      });
    }
  }

  // Wrapper around JS Functions
  public JSFunctionProxy(
    JSFunction: (...args: unknown[]) => unknown,
    jsFunctionFullName: string,
  ) {
    return new Proxy(
      JSFunction,
      JSFunctionProxyHandler(
        jsFunctionFullName,
        this.addExecutionDataToList,
        this.addFunctionToExecutionList,
      ),
    );
  }
}
