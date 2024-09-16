jest.useFakeTimers();

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { PluginType } from "entities/Action";
import type { ActionEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { overrideWebAPIs } from "../overrides";
import ExecutionMetaData from "../utils/ExecutionMetaData";
import { addPlatformFunctionsToEvalContext } from "ee/workers/Evaluation/Actions";
import { createEvaluationContext } from "workers/Evaluation/evaluate";

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
  isTriggerBased: true,
  context: {},
});

jest.mock("workers/Evaluation/handlers/evalTree", () => ({
  get dataTreeEvaluator() {
    return {
      evalTree: evalContext,
    };
  },
}));

describe("Tests for interval functions", () => {
  beforeAll(() => {
    self["$isDataField"] = false;
    self["$cloudHosting"] = false;
    ExecutionMetaData.setExecutionMetaData({
      triggerMeta: {
        onPageLoad: false,
      },
      eventType: EventType.ON_PAGE_LOAD,
    });
    overrideWebAPIs(evalContext);
    addPlatformFunctionsToEvalContext(evalContext);
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("Should call the callback function after the interval", async () => {
    const callback = jest.fn();
    const interval = evalContext.setInterval(callback, 1000);
    jest.advanceTimersByTime(1000);
    expect(callback).toBeCalledTimes(1);
    evalContext.clearInterval(interval);
  });

  it("Should not call the callback function after the interval is cleared", async () => {
    const callback = jest.fn();
    const interval = evalContext.setInterval(callback, 1000);
    jest.advanceTimersByTime(1000);
    expect(callback).toBeCalledTimes(1);
    evalContext.clearInterval(interval);
    jest.advanceTimersByTime(1000);
    expect(callback).toBeCalledTimes(1);
  });

  it("Callback should have access to outer scope variables", async () => {
    const stalker = jest.fn();
    function runTest() {
      let count = 0;
      const interval = evalContext.setInterval(() => {
        count++;
        stalker(count);
      }, 1000);
      return interval;
    }
    const interval = runTest();
    jest.advanceTimersByTime(3000);
    evalContext.clearInterval(interval);
    expect(stalker).toBeCalledTimes(3);
    expect(stalker).toBeCalledWith(1);
    expect(stalker).toBeCalledWith(2);
    expect(stalker).toBeCalledWith(3);
  });

  it("It should have access to platform fns inside callbacks", async () => {
    const showAlertMock = jest.fn();
    //@ts-expect-error no types for this
    self.showAlert = showAlertMock;
    const interval = evalContext.setInterval(() => {
      //@ts-expect-error no types for this
      self.showAlert("Hello World");
    }, 1000);
    jest.advanceTimersByTime(2000);
    evalContext.clearInterval(interval);
    expect(showAlertMock).toBeCalledTimes(2);
    expect(showAlertMock).toBeCalledWith("Hello World");
  });

  it("clearInterval should remove only the mentioned interval, and not all the intervals", async () => {
    const callback = jest.fn();
    const interval1 = evalContext.setInterval(callback, 1000);
    evalContext.setInterval(callback, 1000, "intervalId1");
    evalContext.setInterval(callback, 1000, "intervalId2");
    jest.advanceTimersByTime(1000);
    evalContext.clearInterval(); // this should not clear any intervals as no 'id' parameter is passed
    expect(callback).toBeCalledTimes(3);
    evalContext.clearInterval(interval1);
    jest.advanceTimersByTime(1000);
    expect(callback).toBeCalledTimes(5);
    evalContext.clearInterval("intervalId1");
    jest.advanceTimersByTime(1000);
    expect(callback).toBeCalledTimes(6);
    evalContext.clearInterval("intervalId2");
    jest.advanceTimersByTime(5000);
    expect(callback).toBeCalledTimes(6);
  });
});
