import { createGlobalData } from "workers/evaluate";
import _ from "lodash";
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
      requestId,
      type: "PROCESS_TRIGGER",
      responseData: expect.objectContaining({
        subRequestId: expect.stringContaining(`${requestId}_`),
        trigger: {
          type: "SHOW_ALERT",
          payload: {
            message: "test alert",
            style: "info",
          },
        },
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
    const subRequestId = requestArgs.responseData.subRequestId;

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          data: { resolve: ["123"], subRequestId },
          method: "PROCESS_TRIGGER",
          requestId,
          success: true,
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
    const subRequestId = requestArgs.responseData.subRequestId;
    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          data: { reason: "testing", subRequestId },
          method: "PROCESS_TRIGGER",
          requestId,
          success: false,
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
    const correctSubRequestId = requestArgs.responseData.subRequestId;
    const differentSubRequestId = "wrongRequestId";

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          data: {
            resolve: ["wrongRequest"],
            subRequestId: differentSubRequestId,
          },
          method: "PROCESS_TRIGGER",
          requestId,
          success: true,
        },
      }),
    );

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          data: { resolve: ["testing"], subRequestId: correctSubRequestId },
          method: "PROCESS_TRIGGER",
          requestId,
          success: true,
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
    const subRequestId = requestArgs.responseData.subRequestId;

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          data: {
            resolve: ["testing"],
            subRequestId,
          },
          method: "PROCESS_TRIGGER",
          requestId,
          success: true,
        },
      }),
    );

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          data: { resolve: ["wrongRequest"], subRequestId },
          method: "PROCESS_TRIGGER",
          requestId,
          success: false,
        },
      }),
    );

    await expect(returnedPromise).resolves.toBe("testing");
  });
});
