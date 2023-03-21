import { addPlatformFunctionsToEvalContext } from "ce/workers/Evaluation/Actions";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { PluginType } from "entities/Action";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { overrideWebAPIs } from "../overrides";
import ExecutionMetaData from "../utils/ExecutionMetaData";
import type { ActionEntity } from "entities/DataTree/types";

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
  resolvedFunctions: {},
  isTriggerBased: true,
  context: {},
});

jest.mock("workers/Evaluation/handlers/evalTree", () => ({
  get dataTreeEvaluator() {
    return {
      evalTree: evalContext,
      resolvedFunctions: {},
    };
  },
}));

describe("Tests for interval functions", () => {
  beforeAll(() => {
    self["$isDataField"] = false;
    self["$cloudHosting"] = false;
    ExecutionMetaData.setExecutionMetaData({}, EventType.ON_PAGE_LOAD);
    overrideWebAPIs(evalContext);
    addPlatformFunctionsToEvalContext(evalContext);
  });

  it("Should call the callback function after the interval", async () => {
    const callback = jest.fn();
    const interval = evalContext.setInterval(callback, 100);
    await new Promise((resolve) => setTimeout(resolve, 100));
    clearInterval(interval);
    expect(callback).toBeCalledTimes(1);
    clearInterval(interval);
  });

  it("Should not call the callback function after the interval is cleared", async () => {
    const callback = jest.fn();
    const interval = evalContext.setInterval(callback, 100);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callback).toBeCalledTimes(1);
    clearInterval(interval);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callback).toBeCalledTimes(1);
  });

  it("Callback should have access to outer scope variables", async () => {
    const stalker = jest.fn();
    function test() {
      let count = 0;
      const interval = evalContext.setInterval(() => {
        count++;
        stalker(count);
      }, 100);
      return interval;
    }
    const interval = test();
    await new Promise((resolve) => setTimeout(resolve, 300));
    clearInterval(interval);
    expect(stalker).toBeCalledTimes(2);
    expect(stalker).toBeCalledWith(1);
    expect(stalker).toBeCalledWith(2);
  });

  it("It should have access to platform fns inside callbacks", async () => {
    const showAlertMock = jest.fn();
    //@ts-expect-error no types for this
    self.showAlert = showAlertMock;
    const interval = evalContext.setInterval(() => {
      //@ts-expect-error no types for this
      self.showAlert("Hello World");
    }, 100);
    await new Promise((resolve) => setTimeout(resolve, 250));
    clearInterval(interval);
    expect(showAlertMock).toBeCalledTimes(2);
    expect(showAlertMock).toBeCalledWith("Hello World");
  });
});
