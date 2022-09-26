import { createGlobalData } from "workers/evaluate";
import _ from "lodash";
import { RequestOrigin } from "utils/WorkerUtil";
jest.mock("./evaluation.worker.ts", () => {
  return {
    dataTreeEvaluator: {
      evalTree: {},
      resolvedFunctions: {},
    },
  };
});

describe("promise execution", () => {
  const postMessageMock = jest.fn();
  const requestId = _.uniqueId("TEST_REQUEST");
  const dataTreeWithFunctions = createGlobalData({
    dataTree: {},
    resolvedFunctions: {},
    isTriggerBased: true,
    context: { requestId },
  });

  beforeEach(() => {
    self.ALLOW_ASYNC = true;
    self.postMessage = postMessageMock;
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("throws when allow async is not enabled", () => {
    self.ALLOW_ASYNC = false;
    self.IS_ASYNC = false;
    expect(dataTreeWithFunctions.showAlert).toThrowError();
    expect(self.IS_ASYNC).toBe(true);
    expect(postMessageMock).not.toHaveBeenCalled();
  });
  it("sends an event from the worker", () => {
    dataTreeWithFunctions.showAlert("test alert", "info");
    expect(postMessageMock).toBeCalledWith({
      requestId: expect.stringContaining(`SHOW_ALERT_`),
      requestOrigin: RequestOrigin.Worker,
      data: expect.objectContaining({
        trigger: {
          type: "SHOW_ALERT",
          payload: {
            message: "test alert",
            style: "info",
          },
        },
        errors: [],
      }),
    });
  });
  it("returns a promise that resolves", async () => {
    postMessageMock.mockReset();
    const returnedPromise = dataTreeWithFunctions.showAlert(
      "test alert",
      "info",
    );
    const requestArgs = postMessageMock.mock.calls[0][0];
    const requestId = requestArgs.requestId;

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          requestData: {
            data: { resolve: "123" },
            success: true,
          },
          requestId,
          method: "PROCESS_TRIGGER",
        },
      }),
    );

    await expect(returnedPromise).resolves.toBe("123");
  });

  it("returns a promise that rejects", async () => {
    postMessageMock.mockReset();
    const returnedPromise = dataTreeWithFunctions.showAlert(
      "test alert",
      "info",
    );
    const requestArgs = postMessageMock.mock.calls[0][0];
    const requestId = requestArgs.requestId;
    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          requestData: {
            data: { reason: "testing" },
            success: false,
          },
          requestId,
          method: "PROCESS_TRIGGER",
        },
      }),
    );

    await expect(returnedPromise).rejects.toBe("testing");
  });
  it("does not process till right event is triggered", async () => {
    postMessageMock.mockReset();
    const returnedPromise = dataTreeWithFunctions.showAlert(
      "test alert",
      "info",
    );

    const requestArgs = postMessageMock.mock.calls[0][0];
    const correctRequestId = requestArgs.requestId;
    const differentRequestId = "wrongRequestId";

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          requestData: {
            data: {
              resolve: { reason: "wrongRequest" },
              success: false,
            },
          },
          method: "PROCESS_TRIGGER",
          requestId: differentRequestId,
        },
      }),
    );

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          requestData: {
            data: { resolve: "testing" },
            success: true,
          },
          method: "PROCESS_TRIGGER",
          requestId: correctRequestId,
        },
      }),
    );

    await expect(returnedPromise).resolves.toBe("testing");
  });
  it("same subRequestId is not accepted again", async () => {
    postMessageMock.mockReset();
    const returnedPromise = dataTreeWithFunctions.showAlert(
      "test alert",
      "info",
    );

    const requestArgs = postMessageMock.mock.calls[0][0];
    const requestId = requestArgs.requestId;

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          requestData: {
            data: { resolve: "testing" },
            success: true,
          },
          method: "PROCESS_TRIGGER",
          requestId,
        },
      }),
    );

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          requestData: {
            data: { resolve: ["wrongRequest"] },
            success: false,
          },
          method: "PROCESS_TRIGGER",
          requestId,
        },
      }),
    );

    await expect(returnedPromise).resolves.toBe("testing");
  });
});
