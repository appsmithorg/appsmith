import { MAIN_THREAD_ACTION } from "ee/workers/Evaluation/evalWorkerActions";
import { addPlatformFunctionsToEvalContext } from "ee/workers/Evaluation/Actions";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import ExecutionMetaData from "../utils/ExecutionMetaData";
import { evalContext } from "../mock";

jest.mock("workers/Evaluation/handlers/evalTree", () => ({
  get dataTreeEvaluator() {
    return {
      evalTree: evalContext,
    };
  },
}));

const requestMock = jest.fn();
jest.mock("../utils/Messenger.ts", () => ({
  ...jest.requireActual("../utils/Messenger.ts"),
  get WorkerMessenger() {
    return {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: (...args: any) => requestMock(...args),
    };
  },
}));

describe("Tests for run function in callback styled", () => {
  beforeAll(() => {
    self["$isDataField"] = false;
    ExecutionMetaData.setExecutionMetaData({
      triggerMeta: {
        onPageLoad: false,
      },
      eventType: EventType.ON_PAGE_LOAD,
    });
    addPlatformFunctionsToEvalContext(evalContext);
  });

  beforeEach(() => {
    requestMock.mockClear();
  });

  it("1. Success callback should be called when the request is successful", async () => {
    requestMock.mockReturnValue(
      Promise.resolve({
        data: ["resolved"],
      }),
    );
    const successCallback = jest.fn(() => "success");
    const errorCallback = jest.fn(() => "failed");
    await evalContext.action1.run(successCallback, errorCallback);
    expect(requestMock).toBeCalledWith({
      method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
      data: {
        enableJSFnPostProcessors: true,
        enableJSVarUpdateTracking: true,
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: {},
            onSuccess: successCallback.toString(),
            onError: errorCallback.toString(),
          },
        },
        eventType: "ON_PAGE_LOAD",
        triggerMeta: {
          source: {},
          triggerPropertyName: undefined,
          onPageLoad: false,
        },
      },
    });
    expect(successCallback).toBeCalledWith("resolved");
    expect(successCallback).toReturnWith("success");
    expect(errorCallback).not.toBeCalled();
  });
  it("2. Error callback should be called when the request is unsuccessful", async () => {
    requestMock.mockReturnValue(
      Promise.resolve({
        error: { message: "error" },
      }),
    );
    const successCallback = jest.fn(() => "success");
    const errorCallback = jest.fn(() => "failed");
    await evalContext.action1.run(successCallback, errorCallback);
    expect(requestMock).toBeCalledWith({
      method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
      data: {
        enableJSFnPostProcessors: true,
        enableJSVarUpdateTracking: true,
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: {},
            onSuccess: successCallback.toString(),
            onError: errorCallback.toString(),
          },
        },
        eventType: "ON_PAGE_LOAD",
        triggerMeta: {
          source: {},
          triggerPropertyName: undefined,
          onPageLoad: false,
        },
      },
    });
    expect(errorCallback).toBeCalledWith("error");
    expect(errorCallback).toReturnWith("failed");
    expect(successCallback).toBeCalledTimes(0);
  });
  it("3. Callback should have access to variables in outer scope", async () => {
    requestMock.mockReturnValue(
      Promise.resolve({
        data: ["resolved"],
      }),
    );
    const successCallback = jest.fn();
    await (async function () {
      const innerScopeVar = "innerScopeVar";
      successCallback.mockImplementation(() => innerScopeVar);
      await evalContext.action1.run(successCallback);
    })();
    expect(successCallback).toBeCalledWith("resolved");
    expect(successCallback).toReturnWith("innerScopeVar");
  });
  it("4. Callback should have access to other platform functions and entities at all times", async () => {
    const showAlertMock = jest.fn();
    //@ts-expect-error no types
    self.showAlert = showAlertMock;
    requestMock.mockReturnValue(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: ["resolved"],
          });
        }, 1000);
      }),
    );
    const successCallback = jest.fn(() =>
      //@ts-expect-error no types
      self.showAlert(evalContext.action1.actionId),
    );
    await evalContext.action1.run(successCallback);
    expect(successCallback).toBeCalledWith("resolved");
    expect(showAlertMock).toBeCalledWith("123");
  });
});

describe("Tests for run function in promise styled", () => {
  beforeAll(() => {
    self["$isDataField"] = false;
    ExecutionMetaData.setExecutionMetaData({
      triggerMeta: {
        onPageLoad: false,
      },
      eventType: EventType.ON_PAGE_LOAD,
    });
    addPlatformFunctionsToEvalContext(evalContext);
  });

  it("1. Should return a promise which resolves when the request is successful", async () => {
    requestMock.mockReturnValue(
      Promise.resolve({
        data: ["resolved"],
      }),
    );
    const successHandler = jest.fn();
    const invocation = evalContext.action1.run();
    invocation.then(successHandler);
    expect(requestMock).toBeCalledWith({
      method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
      data: {
        enableJSFnPostProcessors: true,
        enableJSVarUpdateTracking: true,
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: {},
          },
        },
        eventType: "ON_PAGE_LOAD",
        triggerMeta: {
          source: {},
          triggerPropertyName: undefined,
          onPageLoad: false,
        },
      },
    });
    await expect(invocation).resolves.toEqual("resolved");
    expect(successHandler).toBeCalledWith("resolved");
  });

  it("2. Should return a promise which rejects when the request is unsuccessful", async () => {
    requestMock.mockReturnValue(
      Promise.resolve({
        error: { message: "error" },
      }),
    );
    const successHandler = jest.fn();
    const errorHandler = jest.fn();
    await evalContext.action1.run().then(successHandler).catch(errorHandler);
    expect(requestMock).toBeCalledWith({
      method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
      data: {
        enableJSFnPostProcessors: true,
        enableJSVarUpdateTracking: true,
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: {},
          },
        },
        eventType: "ON_PAGE_LOAD",
        triggerMeta: {
          source: {},
          triggerPropertyName: undefined,
          onPageLoad: false,
        },
      },
    });
    expect(successHandler).not.toBeCalled();
    expect(errorHandler).toBeCalledWith({ message: "error" });
  });
});
