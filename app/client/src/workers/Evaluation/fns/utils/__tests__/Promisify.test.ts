// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const requestMock = jest.fn(async (...args: any) => Promise.resolve("success"));

jest.mock("../Messenger.ts", () => ({
  ...jest.requireActual("../Messenger.ts"),
  WorkerMessenger: {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: async (...args: any) => requestMock(...args),
  },
}));

jest.mock("workers/Evaluation/handlers/evalTree", () => ({
  get dataTreeEvaluator() {
    return {
      evalTree: {},
    };
  },
}));

import { MAIN_THREAD_ACTION } from "ee/workers/Evaluation/evalWorkerActions";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import ExecutionMetaData from "../ExecutionMetaData";
import { promisify } from "../Promisify";

describe("Tests for promisify util", () => {
  const triggerMeta = {
    source: {
      id: "testId",
      name: "testName",
    },
    triggerPropertyName: "testProp",
    onPageLoad: false,
  };
  const eventType = EventType.ON_PAGE_LOAD;
  beforeAll(() => {
    ExecutionMetaData.setExecutionMetaData({ triggerMeta, eventType });
  });
  it("Should dispatch payload return by descriptor", async () => {
    const metaDataSpy = jest.spyOn(ExecutionMetaData, "setExecutionMetaData");
    //@ts-expect-error No types;
    self.showAlert = undefined;
    const descriptor = jest.fn((key) => ({
      type: "TEST_TYPE",
      payload: { key },
    }));
    const executor = promisify(descriptor);
    await executor(123);
    expect(requestMock).toBeCalledTimes(1);
    expect(requestMock).toBeCalledWith({
      method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
      data: {
        enableJSFnPostProcessors: true,
        enableJSVarUpdateTracking: true,
        trigger: {
          type: "TEST_TYPE",
          payload: { key: 123 },
        },
        eventType,
        triggerMeta,
      },
    });
    expect(metaDataSpy).toBeCalledTimes(1);
    expect(metaDataSpy).toBeCalledWith({
      triggerMeta,
      eventType,
      enableJSFnPostProcessors: true,
      enableJSVarUpdateTracking: true,
    });
  });
});
