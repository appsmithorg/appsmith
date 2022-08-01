import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { PluginType } from "entities/Action";
import { createGlobalData } from "workers/evaluate";
import uniqueId from "lodash/uniqueId";
jest.mock("lodash/uniqueId");

describe("Add functions", () => {
  const workerEventMock = jest.fn();
  self.postMessage = workerEventMock;
  self.ALLOW_ASYNC = true;
  const dataTree: DataTree = {
    action1: {
      actionId: "123",
      pluginId: "",
      data: {},
      config: {},
      datasourceUrl: "",
      pluginType: PluginType.API,
      dynamicBindingPathList: [],
      name: "action1",
      bindingPaths: {},
      reactivePaths: {},
      isLoading: false,
      run: {},
      clear: {},
      responseMeta: { isExecutionSuccess: false },
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      dependencyMap: {},
      logBlackList: {},
    },
  };
  self.TRIGGER_COLLECTOR = [];
  const dataTreeWithFunctions = createGlobalData({
    dataTree,
    resolvedFunctions: {},
    isTriggerBased: true,
    context: {
      requestId: "EVAL_TRIGGER",
    },
  });

  beforeEach(() => {
    workerEventMock.mockReset();
    self.postMessage = workerEventMock;
  });

  it("action.run works", () => {
    // Action run
    const onSuccess = () => "success";
    const onError = () => "failure";
    const actionParams = { param1: "value1" };

    // Old syntax works with functions
    expect(
      dataTreeWithFunctions.action1.run(onSuccess, onError, actionParams),
    ).toBe(undefined);
    expect(self.TRIGGER_COLLECTOR).toHaveLength(1);
    expect(self.TRIGGER_COLLECTOR[0]).toStrictEqual({
      payload: {
        actionId: "123",
        onError: '() => "failure"',
        onSuccess: '() => "success"',
        params: {
          param1: "value1",
        },
      },
      type: "RUN_PLUGIN_ACTION",
    });

    self.TRIGGER_COLLECTOR.pop();

    // Old syntax works with one undefined value
    expect(
      dataTreeWithFunctions.action1.run(onSuccess, undefined, actionParams),
    ).toBe(undefined);
    expect(self.TRIGGER_COLLECTOR).toHaveLength(1);
    expect(self.TRIGGER_COLLECTOR[0]).toStrictEqual({
      payload: {
        actionId: "123",
        onError: undefined,
        onSuccess: '() => "success"',
        params: {
          param1: "value1",
        },
      },
      type: "RUN_PLUGIN_ACTION",
    });

    self.TRIGGER_COLLECTOR.pop();

    expect(
      dataTreeWithFunctions.action1.run(undefined, onError, actionParams),
    ).toBe(undefined);
    expect(self.TRIGGER_COLLECTOR).toHaveLength(1);
    expect(self.TRIGGER_COLLECTOR[0]).toStrictEqual({
      payload: {
        actionId: "123",
        onError: '() => "failure"',
        onSuccess: undefined,
        params: {
          param1: "value1",
        },
      },
      type: "RUN_PLUGIN_ACTION",
    });

    workerEventMock.mockReturnValue({
      data: {
        method: "PROCESS_TRIGGER",
        requestId: "EVAL_TRIGGER",
        success: true,
        data: {
          a: "b",
        },
      },
    });

    // Old syntax works with null values is treated as new syntax
    expect(
      dataTreeWithFunctions.action1.run(null, null, actionParams),
    ).resolves.toBe({ a: "b" });
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: { param1: "value1" },
          },
        },
      },
    });

    // Old syntax works with undefined values is treated as new syntax
    expect(
      dataTreeWithFunctions.action1.run(undefined, undefined, actionParams),
    ).resolves.toBe({ a: "b" });
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: { param1: "value1" },
          },
        },
      },
    });

    // new syntax works
    expect(
      dataTreeWithFunctions.action1
        .run(actionParams)
        .then(onSuccess)
        .catch(onError),
    ).resolves.toBe({ a: "b" });
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: { param1: "value1" },
          },
        },
      },
    });
    // New syntax without params
    expect(dataTreeWithFunctions.action1.run()).resolves.toBe({ a: "b" });

    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: {},
          },
        },
      },
    });
  });

  it("action.clear works", () => {
    expect(dataTreeWithFunctions.action1.clear()).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "CLEAR_PLUGIN_ACTION",
          payload: {
            actionId: "123",
          },
        },
      },
    });
  });

  it("navigateTo works", () => {
    const pageNameOrUrl = "www.google.com";
    const params = "{ param1: value1 }";
    const target = "NEW_WINDOW";

    expect(
      dataTreeWithFunctions.navigateTo(pageNameOrUrl, params, target),
    ).resolves.toBe({});

    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "NAVIGATE_TO",
          payload: {
            pageNameOrUrl,
            params,
            target,
          },
        },
      },
    });
  });

  it("showAlert works", () => {
    const message = "Alert message";
    const style = "info";
    expect(dataTreeWithFunctions.showAlert(message, style)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "SHOW_ALERT",
          payload: {
            message,
            style,
          },
        },
      },
    });
  });

  it("showModal works", () => {
    const modalName = "Modal 1";

    expect(dataTreeWithFunctions.showModal(modalName)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "SHOW_MODAL_BY_NAME",
          payload: {
            modalName,
          },
        },
      },
    });
  });

  it("closeModal works", () => {
    const modalName = "Modal 1";
    expect(dataTreeWithFunctions.closeModal(modalName)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "CLOSE_MODAL",
          payload: {
            modalName,
          },
        },
      },
    });
  });

  it("storeValue works", () => {
    const key = "some";
    const value = "thing";
    const persist = false;
    const uniqueActionRequestId = "kjebd";

    // @ts-expect-error: mockReturnValueOnce is not available on uniqueId
    uniqueId.mockReturnValueOnce(uniqueActionRequestId);

    expect(dataTreeWithFunctions.storeValue(key, value, persist)).resolves.toBe(
      {},
    );
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "STORE_VALUE",
          payload: {
            key,
            value,
            persist,
            uniqueActionRequestId,
          },
        },
      },
    });
  });

  it("download works", () => {
    const data = "file";
    const name = "downloadedFile.txt";
    const type = "text";

    expect(dataTreeWithFunctions.download(data, name, type)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "DOWNLOAD",
          payload: {
            data,
            name,
            type,
          },
        },
      },
    });
  });

  it("copyToClipboard works", () => {
    const data = "file";
    expect(dataTreeWithFunctions.copyToClipboard(data)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "COPY_TO_CLIPBOARD",
          payload: {
            data,
            options: { debug: undefined, format: undefined },
          },
        },
      },
    });
  });

  it("resetWidget works", () => {
    const widgetName = "widget1";
    const resetChildren = true;

    expect(
      dataTreeWithFunctions.resetWidget(widgetName, resetChildren),
    ).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
          payload: {
            widgetName,
            resetChildren,
          },
        },
      },
    });
  });

  it("setInterval works", () => {
    const callback = () => "test";
    const interval = 5000;
    const id = "myInterval";

    expect(dataTreeWithFunctions.setInterval(callback, interval, id)).toBe(
      undefined,
    );
    expect(self.TRIGGER_COLLECTOR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: {
            callback: '() => "test"',
            id: "myInterval",
            interval: 5000,
          },
          type: "SET_INTERVAL",
        }),
      ]),
    );
  });

  it("clearInterval works", () => {
    const id = "myInterval";

    expect(dataTreeWithFunctions.clearInterval(id)).toBe(undefined);
    expect(self.TRIGGER_COLLECTOR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: {
            id: "myInterval",
          },
          type: "CLEAR_INTERVAL",
        }),
      ]),
    );
  });
});
