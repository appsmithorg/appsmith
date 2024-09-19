import { addPlatformFunctionsToEvalContext } from "ee/workers/Evaluation/Actions";
import { PluginType } from "entities/Action";
import type { ActionEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import initLocalStorage from "../overrides/localStorage";
import { ENTITY_TYPE } from "pages/common/SearchSnippets";

describe("Tests localStorage implementation in worker", () => {
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
  const workerEventMock = jest.fn();

  self.postMessage = workerEventMock;
  self["$isDataField"] = false;
  const evalContext = createEvaluationContext({
    dataTree,
    isTriggerBased: true,
    context: {},
  });

  addPlatformFunctionsToEvalContext(evalContext);
  initLocalStorage.call(evalContext);
  it("setItem()", () => {
    const key = "some";
    const value = "thing";

    jest.useFakeTimers();
    evalContext.localStorage.setItem(key, value);
    jest.runAllTimers();
    expect(workerEventMock).lastCalledWith({
      messageType: "DEFAULT",
      body: {
        data: [
          {
            payload: {
              key: "some",
              value: "thing",
              persist: true,
            },
            type: "STORE_VALUE",
          },
        ],
        method: "PROCESS_STORE_UPDATES",
      },
    });
  });
  it("getItem()", () => {
    expect(evalContext.localStorage.getItem("some")).toBe("thing");
  });
  it("removeItem()", () => {
    evalContext.localStorage.removeItem("some");
    jest.runAllTimers();
    expect(workerEventMock).lastCalledWith({
      messageType: "DEFAULT",
      body: {
        data: [
          {
            payload: {
              key: "some",
            },
            type: "REMOVE_VALUE",
          },
        ],
        method: "PROCESS_STORE_UPDATES",
      },
    });
  });
  it("clear()", () => {
    evalContext.localStorage.clear();
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
});
