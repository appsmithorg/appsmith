import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { PluginType } from "entities/Action";
import {
  createEvaluationContext,
  EvalContext,
} from "workers/Evaluation/evaluate";
import { MessageType } from "utils/MessageUtil";
import {
  addDataTreeToContext,
  addPlatformFunctionsToEvalContext,
} from "@appsmith/workers/Evaluation/Actions";

jest.mock("lodash/uniqueId");

describe("Add functions", () => {
  const workerEventMock = jest.fn();
  self.postMessage = workerEventMock;
  self.ALLOW_SYNC = false;
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
  const evalContext = createEvaluationContext({
    dataTree,
    resolvedFunctions: {},
    isTriggerBased: true,
    context: {},
  });

  addPlatformFunctionsToEvalContext(evalContext);

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
    expect(evalContext.action1.run(onSuccess, onError, actionParams)).toBe(
      undefined,
    );
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
    expect(evalContext.action1.run(onSuccess, undefined, actionParams)).toBe(
      undefined,
    );
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

    expect(evalContext.action1.run(undefined, onError, actionParams)).toBe(
      undefined,
    );
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
    expect(evalContext.action1.run(null, null, actionParams)).resolves.toBe({
      a: "b",
    });
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
      evalContext.action1.run(undefined, undefined, actionParams),
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
      evalContext.action1
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
    expect(evalContext.action1.run()).resolves.toBe({ a: "b" });

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
    expect(evalContext.action1.clear()).resolves.toBe({});
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

    expect(evalContext.navigateTo(pageNameOrUrl, params, target)).resolves.toBe(
      {},
    );
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
    expect(evalContext.showAlert(message, style)).resolves.toBe({});
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

    expect(evalContext.showModal(modalName)).resolves.toBe({});
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
    expect(evalContext.closeModal(modalName)).resolves.toBe({});
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
    jest.useFakeTimers();
    expect(evalContext.storeValue(key, value, persist)).resolves.toStrictEqual(
      {},
    );
    jest.runAllTimers();
    expect(workerEventMock).lastCalledWith({
      messageType: "DEFAULT",
      body: {
        data: [
          {
            payload: {
              key: "some",
              persist: false,
              value: "thing",
            },
            type: "STORE_VALUE",
          },
        ],
        method: "PROCESS_STORE_UPDATES",
      },
    });
  });

  it("removeValue works", () => {
    const key = "some";
    jest.useFakeTimers();
    expect(evalContext.removeValue(key)).resolves.toStrictEqual({});
    jest.runAllTimers();
    expect(workerEventMock).lastCalledWith({
      messageType: "DEFAULT",
      body: {
        data: [
          {
            payload: {
              key,
            },
            type: "REMOVE_VALUE",
          },
        ],
        method: "PROCESS_STORE_UPDATES",
      },
    });
  });

  it("clearStore works", () => {
    jest.useFakeTimers();
    expect(evalContext.clearStore()).resolves.toStrictEqual({});
    jest.runAllTimers();
    expect(workerEventMock).lastCalledWith({
      messageType: "DEFAULT",
      body: {
        data: [
          {
            payload: null,
            type: "CLEAR_STORE",
          },
        ],
        method: "PROCESS_STORE_UPDATES",
      },
    });
  });

  it("download works", () => {
    const data = "file";
    const name = "downloadedFile.txt";
    const type = "text";

    expect(evalContext.download(data, name, type)).resolves.toBe({});
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
    expect(evalContext.copyToClipboard(data)).resolves.toBe({});
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

    expect(evalContext.resetWidget(widgetName, resetChildren)).resolves.toBe(
      {},
    );
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

    expect(evalContext.setInterval(callback, interval, id)).toBe(undefined);
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

    expect(evalContext.clearInterval(id)).toBe(undefined);
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

      expect(evalContext.postWindowMessage(message, source, targetOrigin)).toBe(
        undefined,
      );

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

      expect(evalContext.postWindowMessage(message, source, targetOrigin)).toBe(
        undefined,
      );

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

      expect(evalContext.postWindowMessage(message, source, targetOrigin)).toBe(
        undefined,
      );

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

      expect(evalContext.postWindowMessage(message, source, targetOrigin)).toBe(
        undefined,
      );

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

      expect(evalContext.postWindowMessage(message, source, targetOrigin)).toBe(
        undefined,
      );

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

      expect(evalContext.postWindowMessage(message, source, targetOrigin)).toBe(
        undefined,
      );

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

      expect(evalContext.postWindowMessage(message, source, targetOrigin)).toBe(
        undefined,
      );

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

const dataTree = {
  Text1: {
    widgetName: "Text1",
    displayName: "Text",
    type: "TEXT_WIDGET",
    hideCard: false,
    animateLoading: true,
    overflow: "SCROLL",
    fontFamily: "Nunito Sans",
    parentColumnSpace: 15.0625,
    dynamicTriggerPathList: [],
    leftColumn: 4,
    dynamicBindingPathList: [],
    shouldTruncate: false,
    text: '"2022-11-27T21:36:00.128Z"',
    key: "gt93hhlp15",
    isDeprecated: false,
    rightColumn: 29,
    textAlign: "LEFT",
    dynamicHeight: "FIXED",
    widgetId: "ajg9fjegvr",
    isVisible: true,
    fontStyle: "BOLD",
    textColor: "#231F20",
    version: 1,
    parentId: "0",
    renderMode: "CANVAS",
    isLoading: false,
    borderRadius: "0.375rem",
    maxDynamicHeight: 9000,
    fontSize: "1rem",
    minDynamicHeight: 4,
    value: '"2022-11-27T21:36:00.128Z"',
    defaultProps: {},
    defaultMetaProps: [],
    logBlackList: {
      value: true,
    },
    meta: {},
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    bindingPaths: {
      text: "TEMPLATE",
      isVisible: "TEMPLATE",
    },
    reactivePaths: {
      value: "TEMPLATE",
      fontFamily: "TEMPLATE",
    },
    triggerPaths: {},
    validationPaths: {},
    ENTITY_TYPE: "WIDGET",
    privateWidgets: {},
    __evaluation__: {
      errors: {},
      evaluatedValues: {},
    },
    backgroundColor: "",
    borderColor: "",
  },
  pageList: [
    {
      pageName: "Page1",
      pageId: "63349fb5d39f215f89b8245e",
      isDefault: false,
      isHidden: false,
      slug: "page1",
    },
    {
      pageName: "Page2",
      pageId: "637cc6b4a3664a7fe679b7b0",
      isDefault: true,
      isHidden: false,
      slug: "page2",
    },
  ],
  appsmith: {
    store: {},
    geolocation: {
      canBeRequested: true,
      currentPosition: {},
    },
    mode: "EDIT",
    ENTITY_TYPE: "APPSMITH",
  },
  Api2: {
    run: {},
    clear: {},
    name: "Api2",
    pluginType: "API",
    config: {},
    dynamicBindingPathList: [
      {
        key: "config.path",
      },
    ],
    responseMeta: {
      isExecutionSuccess: false,
    },
    ENTITY_TYPE: "ACTION",
    isLoading: false,
    bindingPaths: {
      "config.path": "TEMPLATE",
      "config.body": "SMART_SUBSTITUTE",
      "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
      "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
        "SMART_SUBSTITUTE",
    },
    reactivePaths: {
      data: "TEMPLATE",
      isLoading: "TEMPLATE",
      datasourceUrl: "TEMPLATE",
      "config.path": "TEMPLATE",
      "config.body": "SMART_SUBSTITUTE",
      "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
    },
    dependencyMap: {
      "config.body": ["config.pluginSpecifiedTemplates[0].value"],
    },
    logBlackList: {},
    datasourceUrl: "",
    __evaluation__: {
      errors: {
        config: [],
      },
      evaluatedValues: {
        "config.path": "/users/undefined",
        config: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          path: "/users/test",
          headers: [],
          encodeParamsToggle: true,
          queryParameters: [],
          bodyFormData: [],
          httpMethod: "GET",
          selfReferencingDataPaths: [],
          pluginSpecifiedTemplates: [
            {
              value: true,
            },
          ],
          formData: {
            apiContentType: "none",
          },
        },
      },
    },
  },
  JSObject1: {
    name: "JSObject1",
    actionId: "637cda3b2f8e175c6f5269d5",
    pluginType: "JS",
    ENTITY_TYPE: "JSACTION",
    body:
      "export default {\n\tstoreTest2: () => {\n\t\tlet values = [\n\t\t\t\t\tstoreValue('val1', 'number 1'),\n\t\t\t\t\tstoreValue('val2', 'number 2'),\n\t\t\t\t\tstoreValue('val3', 'number 3'),\n\t\t\t\t\tstoreValue('val4', 'number 4')\n\t\t\t\t];\n\t\treturn Promise.all(values)\n\t\t\t.then(() => {\n\t\t\tshowAlert(JSON.stringify(appsmith.store))\n\t\t})\n\t\t\t.catch((err) => {\n\t\t\treturn showAlert('Could not store values in store ' + err.toString());\n\t\t})\n\t},\n\tnewFunction: function() {\n\t\tJSObject1.storeTest()\n\t}\n}",
    meta: {
      newFunction: {
        arguments: [],
        isAsync: false,
        confirmBeforeExecute: false,
      },
      storeTest2: {
        arguments: [],
        isAsync: true,
        confirmBeforeExecute: false,
      },
    },
    bindingPaths: {
      body: "SMART_SUBSTITUTE",
      newFunction: "SMART_SUBSTITUTE",
      storeTest2: "SMART_SUBSTITUTE",
    },
    reactivePaths: {
      body: "SMART_SUBSTITUTE",
      newFunction: "SMART_SUBSTITUTE",
      storeTest2: "SMART_SUBSTITUTE",
    },
    dynamicBindingPathList: [
      {
        key: "body",
      },
      {
        key: "newFunction",
      },
      {
        key: "storeTest2",
      },
    ],
    variables: [],
    dependencyMap: {
      body: ["newFunction", "storeTest2"],
    },
    __evaluation__: {
      errors: {
        storeTest2: [],
        newFunction: [],
        body: [],
      },
    },
  },
};

describe("Test addDataTreeToContext method", () => {
  const evalContext: EvalContext = {};
  beforeAll(() => {
    addDataTreeToContext({
      EVAL_CONTEXT: evalContext,
      dataTree: (dataTree as unknown) as DataTree,
      isTriggerBased: true,
    });
    addPlatformFunctionsToEvalContext(evalContext);
  });

  it("1. Assert platform actions are added", () => {
    const frameworkActions = {
      navigateTo: true,
      showAlert: true,
      showModal: true,
      closeModal: true,
      storeValue: true,
      removeValue: true,
      clearStore: true,
      download: true,
      copyToClipboard: true,
      resetWidget: true,
      setInterval: true,
      clearInterval: true,
      postWindowMessage: true,
    };

    for (const actionName of Object.keys(frameworkActions)) {
      expect(evalContext).toHaveProperty(actionName);
      expect(typeof evalContext[actionName]).toBe("function");
    }
  });

  it("2. Assert Api has run and clear method", () => {
    expect(evalContext.Api2).toHaveProperty("run");
    expect(evalContext.Api2).toHaveProperty("clear");

    expect(typeof evalContext.Api2.run).toBe("function");
    expect(typeof evalContext.Api2.clear).toBe("function");
  });

  it("3. Assert input dataTree is not mutated", () => {
    expect(typeof dataTree.Api2.run).not.toBe("function");
  });
});
