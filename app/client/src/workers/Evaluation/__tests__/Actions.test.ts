import type { ActionEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { PluginType } from "entities/Action";
import type { EvalContext } from "workers/Evaluation/evaluate";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { MessageType } from "utils/MessageUtil";
import {
  getDataTreeContext,
  addPlatformFunctionsToEvalContext,
} from "ee/workers/Evaluation/Actions";
import TriggerEmitter, { BatchKey } from "../fns/utils/TriggerEmitter";

jest.mock("lodash/uniqueId");

describe("Add functions", () => {
  const workerEventMock = jest.fn();

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  self.postMessage = (payload: any) => {
    workerEventMock(payload);
  };
  self["$isDataField"] = false;
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
    } as ActionEntity,
  };
  const evalContext = createEvaluationContext({
    dataTree,
    configTree: {},
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

  it("action.clear works", () => {
    expect(evalContext.action1.clear()).resolves.toBe({});
    const arg = workerEventMock.mock.calls[0][0];

    expect(arg).toEqual(
      messageCreator("PROCESS_TRIGGER", {
        data: {
          enableJSFnPostProcessors: true,
          enableJSVarUpdateTracking: true,
          trigger: {
            type: "CLEAR_PLUGIN_ACTION",
            payload: {
              actionId: "123",
            },
          },
          eventType: undefined,
          triggerMeta: {
            source: {},
            triggerPropertyName: undefined,
            onPageLoad: false,
          },
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
      messageCreator("PROCESS_TRIGGER", {
        data: {
          enableJSFnPostProcessors: true,
          enableJSVarUpdateTracking: true,
          trigger: {
            type: "NAVIGATE_TO",
            payload: {
              pageNameOrUrl,
              params,
              target,
            },
          },
          eventType: undefined,
          triggerMeta: {
            source: {},
            triggerPropertyName: undefined,
            onPageLoad: false,
          },
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
      messageCreator("PROCESS_TRIGGER", {
        data: {
          enableJSFnPostProcessors: true,
          enableJSVarUpdateTracking: true,
          trigger: {
            type: "SHOW_ALERT",
            payload: {
              message,
              style,
            },
          },
          eventType: undefined,
          triggerMeta: {
            source: {},
            triggerPropertyName: undefined,
            onPageLoad: false,
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("showModal works", () => {
    const modalName = "Modal 1";

    expect(evalContext.showModal(modalName)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("PROCESS_TRIGGER", {
        data: {
          enableJSFnPostProcessors: true,
          enableJSVarUpdateTracking: true,
          trigger: {
            type: "SHOW_MODAL_BY_NAME",
            payload: {
              modalName,
            },
          },
          eventType: undefined,
          triggerMeta: {
            source: {},
            triggerPropertyName: undefined,
            onPageLoad: false,
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("closeModal works", () => {
    const modalName = "Modal 1";

    expect(evalContext.closeModal(modalName)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("PROCESS_TRIGGER", {
        data: {
          enableJSFnPostProcessors: true,
          enableJSVarUpdateTracking: true,
          trigger: {
            type: "CLOSE_MODAL",
            payload: {
              modalName,
            },
          },
          eventType: undefined,
          triggerMeta: {
            source: {},
            triggerPropertyName: undefined,
            onPageLoad: false,
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("storeValue works", () => {
    const key = "some";
    const value = "thing";
    const persist = false;
    const mockStoreUpdates = jest.fn();

    TriggerEmitter.on(BatchKey.process_store_updates, mockStoreUpdates);
    expect(evalContext.storeValue(key, value, persist)).resolves.toStrictEqual(
      {},
    );
    expect(mockStoreUpdates).toBeCalledWith({
      payload: {
        key: "some",
        persist: false,
        value: "thing",
      },
      type: "STORE_VALUE",
    });
    TriggerEmitter.removeListener(
      BatchKey.process_store_updates,
      mockStoreUpdates,
    );
    mockStoreUpdates.mockClear();
  });

  it("removeValue works", () => {
    const key = "some";
    const mockStoreUpdates = jest.fn();

    TriggerEmitter.on(BatchKey.process_store_updates, mockStoreUpdates);
    expect(evalContext.removeValue(key)).resolves.toStrictEqual({});
    expect(mockStoreUpdates).toBeCalledWith({
      payload: {
        key,
      },
      type: "REMOVE_VALUE",
    });
    TriggerEmitter.removeListener(
      BatchKey.process_store_updates,
      mockStoreUpdates,
    );
  });

  it("clearStore works", async () => {
    const mockStoreUpdates = jest.fn();

    TriggerEmitter.on(BatchKey.process_store_updates, mockStoreUpdates);
    expect(evalContext.clearStore()).resolves.toStrictEqual({});
    expect(mockStoreUpdates).toBeCalledWith({
      payload: null,
      type: "CLEAR_STORE",
    });
    TriggerEmitter.removeListener(
      BatchKey.process_store_updates,
      mockStoreUpdates,
    );
  });

  it("download works", () => {
    const data = "file";
    const name = "downloadedFile.txt";
    const type = "text";

    expect(evalContext.download(data, name, type)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("PROCESS_TRIGGER", {
        data: {
          enableJSFnPostProcessors: true,
          enableJSVarUpdateTracking: true,
          trigger: {
            type: "DOWNLOAD",
            payload: {
              data,
              name,
              type,
            },
          },
          eventType: undefined,
          triggerMeta: {
            source: {},
            triggerPropertyName: undefined,
            onPageLoad: false,
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });

  it("copyToClipboard works", () => {
    const data = "file";

    expect(evalContext.copyToClipboard(data)).resolves.toBe({});
    expect(workerEventMock).lastCalledWith(
      messageCreator("PROCESS_TRIGGER", {
        data: {
          enableJSFnPostProcessors: true,
          enableJSVarUpdateTracking: true,
          trigger: {
            type: "COPY_TO_CLIPBOARD",
            payload: {
              data,
              options: { debug: undefined, format: undefined },
            },
          },
          eventType: undefined,
          triggerMeta: {
            source: {},
            triggerPropertyName: undefined,
            onPageLoad: false,
          },
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
      messageCreator("PROCESS_TRIGGER", {
        data: {
          enableJSFnPostProcessors: true,
          enableJSVarUpdateTracking: true,
          trigger: {
            type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
            payload: {
              widgetName,
              resetChildren,
              metaUpdates: [],
            },
          },
          eventType: undefined,
          triggerMeta: {
            source: {},
            triggerPropertyName: undefined,
            onPageLoad: false,
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );
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
    body: "export default {\n\tstoreTest2: () => {\n\t\tlet values = [\n\t\t\t\t\tstoreValue('val1', 'number 1'),\n\t\t\t\t\tstoreValue('val2', 'number 2'),\n\t\t\t\t\tstoreValue('val3', 'number 3'),\n\t\t\t\t\tstoreValue('val4', 'number 4')\n\t\t\t\t];\n\t\treturn Promise.all(values)\n\t\t\t.then(() => {\n\t\t\tshowAlert(JSON.stringify(appsmith.store))\n\t\t})\n\t\t\t.catch((err) => {\n\t\t\treturn showAlert('Could not store values in store ' + err.toString());\n\t\t})\n\t},\n\tnewFunction: function() {\n\t\tJSObject1.storeTest()\n\t}\n}",
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

const configTree = {};

describe("Test addDataTreeToContext method", () => {
  const evalContext: EvalContext = {};

  beforeAll(() => {
    const EVAL_CONTEXT = getDataTreeContext({
      dataTree: dataTree as unknown as DataTree,
      configTree,
      isTriggerBased: true,
    });

    Object.assign(evalContext, EVAL_CONTEXT);
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
