import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { PluginType } from "entities/Action";
import {
  createEvaluationContext,
  GlobalData,
} from "workers/Evaluation/evaluate";
import uniqueId from "lodash/uniqueId";
import { addDataTreeToContext } from "../Actions";
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
  const dataTreeWithFunctions = createEvaluationContext({
    dataTree,
    resolvedFunctions: {},
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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

  it("removeValue works", () => {
    const key = "some";

    expect(dataTreeWithFunctions.removeValue(key)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      promisified: true,
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "REMOVE_VALUE",
          payload: {
            key,
          },
        },
      },
    });
  });

  it("clearStore works", () => {
    expect(dataTreeWithFunctions.clearStore()).resolves.toBe({});
    expect(workerEventMock).lastCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      promisified: true,
      responseData: {
        errors: [],
        subRequestId: expect.stringContaining("EVAL_TRIGGER_"),
        trigger: {
          type: "CLEAR_STORE",
          payload: null,
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
      promisified: true,
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
      promisified: true,
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
      promisified: true,
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
  const evalContext: GlobalData = {};
  beforeAll(() => {
    addDataTreeToContext({
      EVAL_CONTEXT: evalContext,
      dataTree: (dataTree as unknown) as DataTree,
    });
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
