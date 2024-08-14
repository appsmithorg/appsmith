import { MAIN_THREAD_ACTION } from "ee/workers/Evaluation/evalWorkerActions";
import { addPlatformFunctionsToEvalContext } from "ee/workers/Evaluation/Actions";
import { setEvalContext } from "workers/Evaluation/evaluate";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { RenderModes } from "constants/WidgetConstants";

const dataTree: DataTree = {
  action1: {
    actionId: "123",
    data: {},
    config: {},
    datasourceUrl: "",
    isLoading: false,
    run: {},
    clear: {},
    responseMeta: { isExecutionSuccess: false },
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
  },
  WidgetName: {
    widgetName: "WidgetName",
    bottomRow: 0,
    isLoading: false,
    leftColumn: 0,
    rightColumn: 0,
    topRow: 0,
    type: "TABLE_WIDGET",
    version: 1,
    dynamicBindingPathList: [],
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    meta: {},
    widgetId: "sfwe",
    renderMode: RenderModes.CANVAS,
    parentColumnSpace: 3,
    parentRowSpace: 4,
  },
};

jest.mock("workers/Evaluation/handlers/evalTree", () => ({
  get dataTreeEvaluator() {
    return {
      evalTree: dataTree,
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

describe("Tests for entity function to be defined", () => {
  beforeAll(() => {
    self["$isDataField"] = false;
    setEvalContext({
      dataTree: dataTree,
      isTriggerBased: true,
      isDataField: false,
    });
    addPlatformFunctionsToEvalContext(self);
  });

  it("1. After resetWidget is executed", async () => {
    requestMock.mockReturnValue(
      Promise.resolve({
        data: ["resolved"],
      }),
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evalContext = globalThis as any;
    evalContext.resetWidget("WidgetName", true);

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
});
