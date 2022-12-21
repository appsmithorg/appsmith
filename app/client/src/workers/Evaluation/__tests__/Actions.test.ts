import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { PluginType } from "entities/Action";
import { createGlobalData } from "workers/Evaluation/evaluate";
import uniqueId from "lodash/uniqueId";
import { MessageType } from "utils/MessageUtil";
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

  const messageCreator = (type: string, body: unknown) => ({
    messageId: expect.stringContaining(type),
    messageType: MessageType.REQUEST,
    body,
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
    expect(workerEventMock).lastCalledWith(
      messageCreator("RUN_PLUGIN_ACTION", {
        data: {
          trigger: {
            type: "RUN_PLUGIN_ACTION",
            payload: {
              actionId: "123",
              params: { param1: "value1" },
            },
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );

    // Old syntax works with undefined values is treated as new syntax
    expect(
      dataTreeWithFunctions.action1.run(undefined, undefined, actionParams),
    ).resolves.toBe({ a: "b" });
    expect(workerEventMock).lastCalledWith(
      messageCreator("RUN_PLUGIN_ACTION", {
        data: {
          trigger: {
            type: "RUN_PLUGIN_ACTION",
            payload: {
              actionId: "123",
              params: { param1: "value1" },
            },
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );

    // new syntax works
    expect(
      dataTreeWithFunctions.action1
        .run(actionParams)
        .then(onSuccess)
        .catch(onError),
    ).resolves.toBe({ a: "b" });
    expect(workerEventMock).lastCalledWith(
      messageCreator("RUN_PLUGIN_ACTION", {
        data: {
          trigger: {
            type: "RUN_PLUGIN_ACTION",
            payload: {
              actionId: "123",
              params: { param1: "value1" },
            },
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );
    // New syntax without params
    expect(dataTreeWithFunctions.action1.run()).resolves.toBe({ a: "b" });

    expect(workerEventMock).lastCalledWith(
      messageCreator("RUN_PLUGIN_ACTION", {
        data: {
          trigger: {
            type: "RUN_PLUGIN_ACTION",
            payload: {
              actionId: "123",
              params: {},
            },
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("action.clear works", () => {
    expect(dataTreeWithFunctions.action1.clear()).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("CLEAR_PLUGIN_ACTION", {
        data: {
          trigger: {
            type: "CLEAR_PLUGIN_ACTION",
            payload: {
              actionId: "123",
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("navigateTo works", () => {
    const pageNameOrUrl = "www.google.com";
    const params = "{ param1: value1 }";
    const target = "NEW_WINDOW";

    expect(
      dataTreeWithFunctions.navigateTo(pageNameOrUrl, params, target),
    ).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("NAVIGATE_TO", {
        data: {
          trigger: {
            type: "NAVIGATE_TO",
            payload: {
              pageNameOrUrl,
              params,
              target,
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("showAlert works", () => {
    const message = "Alert message";
    const style = "info";
    expect(dataTreeWithFunctions.showAlert(message, style)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("SHOW_ALERT", {
        data: {
          trigger: {
            type: "SHOW_ALERT",
            payload: {
              message,
              style,
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("showModal works", () => {
    const modalName = "Modal 1";

    expect(dataTreeWithFunctions.showModal(modalName)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("SHOW_MODAL_BY_NAME", {
        data: {
          trigger: {
            type: "SHOW_MODAL_BY_NAME",
            payload: {
              modalName,
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("closeModal works", () => {
    const modalName = "Modal 1";
    expect(dataTreeWithFunctions.closeModal(modalName)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("CLOSE_MODAL", {
        data: {
          trigger: {
            type: "CLOSE_MODAL",
            payload: {
              modalName,
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
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
    expect(workerEventMock).lastCalledWith(
      messageCreator("STORE_VALUE", {
        data: {
          trigger: {
            type: "STORE_VALUE",
            payload: {
              key,
              value,
              persist,
              uniqueActionRequestId,
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("removeValue works", () => {
    const key = "some";
    expect(dataTreeWithFunctions.removeValue(key)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("REMOVE_VALUE", {
        data: {
          trigger: {
            type: "REMOVE_VALUE",
            payload: {
              key,
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("clearStore works", () => {
    expect(dataTreeWithFunctions.clearStore()).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("CLEAR_STORE", {
        data: {
          trigger: {
            type: "CLEAR_STORE",
            payload: null,
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("download works", () => {
    const data = "file";
    const name = "downloadedFile.txt";
    const type = "text";

    expect(dataTreeWithFunctions.download(data, name, type)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("DOWNLOAD", {
        data: {
          trigger: {
            type: "DOWNLOAD",
            payload: {
              data,
              name,
              type,
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("copyToClipboard works", () => {
    const data = "file";
    expect(dataTreeWithFunctions.copyToClipboard(data)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("COPY_TO_CLIPBOARD", {
        data: {
          trigger: {
            type: "COPY_TO_CLIPBOARD",
            payload: {
              data,
              options: { debug: undefined, format: undefined },
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("resetWidget works", () => {
    const widgetName = "widget1";
    const resetChildren = true;

    expect(
      dataTreeWithFunctions.resetWidget(widgetName, resetChildren),
    ).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("RESET_WIDGET_META_RECURSIVE_BY_NAME", {
        data: {
          trigger: {
            type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
            payload: {
              widgetName,
              resetChildren,
            },
          },
          eventType: undefined,
        },
        method: "PROCESS_TRIGGER",
      }),
    );
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

  describe("Post window message works", () => {
    const targetOrigin = "https://dev.appsmith.com/";
    const source = "window";

    it("Post message with first argument (message) as a string", () => {
      const message = "Hello world!";

      expect(
        dataTreeWithFunctions.postWindowMessage(message, source, targetOrigin),
      ).toBe(undefined);

      expect(self.TRIGGER_COLLECTOR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            payload: {
              message: "Hello world!",
              source: "window",
              targetOrigin: "https://dev.appsmith.com/",
            },
            type: "POST_MESSAGE",
          }),
        ]),
      );
    });

    it("Post message with first argument (message) as undefined", () => {
      const message = undefined;

      expect(
        dataTreeWithFunctions.postWindowMessage(message, source, targetOrigin),
      ).toBe(undefined);

      expect(self.TRIGGER_COLLECTOR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            payload: {
              message: undefined,
              source: "window",
              targetOrigin: "https://dev.appsmith.com/",
            },
            type: "POST_MESSAGE",
          }),
        ]),
      );
    });

    it("Post message with first argument (message) as null", () => {
      const message = null;

      expect(
        dataTreeWithFunctions.postWindowMessage(message, source, targetOrigin),
      ).toBe(undefined);

      expect(self.TRIGGER_COLLECTOR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            payload: {
              message: null,
              source: "window",
              targetOrigin: "https://dev.appsmith.com/",
            },
            type: "POST_MESSAGE",
          }),
        ]),
      );
    });

    it("Post message with first argument (message) as a number", () => {
      const message = 1826;

      expect(
        dataTreeWithFunctions.postWindowMessage(message, source, targetOrigin),
      ).toBe(undefined);

      expect(self.TRIGGER_COLLECTOR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            payload: {
              message: 1826,
              source: "window",
              targetOrigin: "https://dev.appsmith.com/",
            },
            type: "POST_MESSAGE",
          }),
        ]),
      );
    });

    it("Post message with first argument (message) as a boolean", () => {
      const message = true;

      expect(
        dataTreeWithFunctions.postWindowMessage(message, source, targetOrigin),
      ).toBe(undefined);

      expect(self.TRIGGER_COLLECTOR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            payload: {
              message: true,
              source: "window",
              targetOrigin: "https://dev.appsmith.com/",
            },
            type: "POST_MESSAGE",
          }),
        ]),
      );
    });

    it("Post message with first argument (message) as an array", () => {
      const message = [1, 2, 3, [1, 2, 3, [1, 2, 3]]];

      expect(
        dataTreeWithFunctions.postWindowMessage(message, source, targetOrigin),
      ).toBe(undefined);

      expect(self.TRIGGER_COLLECTOR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            payload: {
              message: [1, 2, 3, [1, 2, 3, [1, 2, 3]]],
              source: "window",
              targetOrigin: "https://dev.appsmith.com/",
            },
            type: "POST_MESSAGE",
          }),
        ]),
      );
    });

    it("Post message with first argument (message) as an object", () => {
      const message = {
        key: 1,
        status: "active",
        person: {
          name: "timothee chalamet",
        },
        randomArr: [1, 2, 3],
      };

      expect(
        dataTreeWithFunctions.postWindowMessage(message, source, targetOrigin),
      ).toBe(undefined);

      expect(self.TRIGGER_COLLECTOR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            payload: {
              message: {
                key: 1,
                status: "active",
                person: {
                  name: "timothee chalamet",
                },
                randomArr: [1, 2, 3],
              },
              source: "window",
              targetOrigin: "https://dev.appsmith.com/",
            },
            type: "POST_MESSAGE",
          }),
        ]),
      );
    });
  });
});
