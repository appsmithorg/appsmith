import { addPlatformFunctionsToEvalContext } from "ee/workers/Evaluation/Actions";
import TriggerEmitter, { BatchKey } from "../utils/TriggerEmitter";
import { evalContext } from "../mock";

const pingMock = jest.fn();

jest.mock("../utils/Messenger.ts", () => ({
  WorkerMessenger: {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ping: (payload: any) => pingMock(JSON.stringify(payload)),
  },
}));

describe("Post window message works", () => {
  beforeAll(() => {
    self["$isDataField"] = false;
    addPlatformFunctionsToEvalContext(evalContext);
  });

  it("postMessage payload check", async () => {
    const targetOrigin = "https://dev.appsmith.com/";
    const source = "window";
    const message = {
      key1: 1,
      key2: undefined,
      key3: undefined,
      key4: "test",
      key5: {
        key6: "test",
      },
      key7: [1, 2, 3, [4, 5, 6]],
    };
    const batchSpy = jest.fn();

    TriggerEmitter.on(BatchKey.process_batched_triggers, batchSpy);
    expect(evalContext.postWindowMessage(message, source, targetOrigin)).toBe(
      undefined,
    );
    expect(batchSpy).toBeCalledTimes(1);
    expect(batchSpy).toBeCalledTimes(1);
    expect(batchSpy).toBeCalledWith({
      trigger: {
        payload: {
          message,
          source: "window",
          targetOrigin: "https://dev.appsmith.com/",
        },
        type: "POST_MESSAGE",
      },
      triggerMeta: {
        source: {},
        triggerPropertyName: undefined,
        onPageLoad: false,
      },
      eventType: undefined,
      enableJSFnPostProcessors: true,
      enableJSVarUpdateTracking: true,
    });
    TriggerEmitter.removeListener(BatchKey.process_batched_triggers, batchSpy);
    batchSpy.mockClear();
  });
});
