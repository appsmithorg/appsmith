import { createEvaluationContext } from "workers/Evaluation/evaluate";
import _ from "lodash";
import { MessageType } from "utils/MessageUtil";
import { addPlatformFunctionsToEvalContext } from "ce/workers/Evaluation/Actions";
jest.mock("../handlers/evalTree", () => {
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
  const evalContext = createEvaluationContext({
    dataTree: {},
    resolvedFunctions: {},
    isTriggerBased: true,
    context: {},
  });

  addPlatformFunctionsToEvalContext(evalContext);

  const requestMessageCreator = (type: string, body: unknown) => ({
    messageId: expect.stringContaining(`${type}_`),
    messageType: MessageType.REQUEST,
    body,
  });

  beforeEach(() => {
    self.ALLOW_SYNC = false;
    self.postMessage = postMessageMock;
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("throws when allow async is not enabled", () => {
    self.ALLOW_SYNC = true;
    self.IS_SYNC = true;
    expect(evalContext.showAlert).toThrowError();
    expect(self.IS_SYNC).toBe(false);
    expect(postMessageMock).not.toHaveBeenCalled();
  });
  it("sends an event from the worker", () => {
    evalContext.showAlert("test alert", "info");
    expect(postMessageMock).toBeCalledWith(
      requestMessageCreator("SHOW_ALERT", {
        data: {
          trigger: {
            type: "SHOW_ALERT",
            payload: {
              message: "test alert",
              style: "info",
            },
          },
        },
        method: "PROCESS_TRIGGER",
      }),
    );
  });
  it("returns a promise that resolves", async () => {
    postMessageMock.mockReset();
    const returnedPromise = evalContext.showAlert("test alert", "info");
    const requestArgs = postMessageMock.mock.calls[0][0];
    const messageId = requestArgs.messageId;

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          messageId,
          messageType: MessageType.RESPONSE,
          body: {
            data: {
              data: { resolve: ["123"] },
              method: "PROCESS_TRIGGER",
              requestId,
              success: true,
            },
            method: "PROCESS_TRIGGER",
          },
        },
      }),
    );

    await expect(returnedPromise).resolves.toBe("123");
  });

  it("returns a promise that rejects", async () => {
    postMessageMock.mockReset();
    const returnedPromise = evalContext.showAlert("test alert", "info");
    const requestArgs = postMessageMock.mock.calls[0][0];
    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          messageId: requestArgs.messageId,
          messageType: MessageType.RESPONSE,
          body: {
            data: { data: { reason: "testing" }, success: false },
            method: "PROCESS_TRIGGER",
          },
        },
      }),
    );

    await expect(returnedPromise).rejects.toBe("testing");
  });
  it("does not process till right event is triggered", async () => {
    postMessageMock.mockReset();
    const returnedPromise = evalContext.showAlert("test alert", "info");

    const requestArgs = postMessageMock.mock.calls[0][0];
    const correctId = requestArgs.messageId;

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          messageId: "wrongMessageId",
          messageType: MessageType.RESPONSE,
          body: {
            data: {
              data: {
                resolve: ["wrongRequest"],
              },
              success: true,
            },
            method: "PROCESS_TRIGGER",
          },
        },
      }),
    );

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          messageId: correctId,
          messageType: MessageType.RESPONSE,
          body: {
            data: {
              data: {
                resolve: ["testing"],
              },
              success: true,
            },
            method: "PROCESS_TRIGGER",
          },
        },
      }),
    );

    await expect(returnedPromise).resolves.toBe("testing");
  });
  it("same subRequestId is not accepted again", async () => {
    postMessageMock.mockReset();
    const returnedPromise = evalContext.showAlert("test alert", "info");

    const requestArgs = postMessageMock.mock.calls[0][0];
    const messageId = requestArgs.messageId;

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          messageId,
          messageType: MessageType.RESPONSE,
          body: {
            data: {
              data: {
                resolve: ["testing"],
              },
              success: true,
            },
            method: "PROCESS_TRIGGER",
          },
        },
      }),
    );

    self.dispatchEvent(
      new MessageEvent("message", {
        data: {
          messageId,
          messageType: MessageType.RESPONSE,
          body: {
            data: { data: { resolve: ["wrongRequest"] }, success: true },
            method: "PROCESS_TRIGGER",
          },
        },
      }),
    );

    await expect(returnedPromise).resolves.toBe("testing");
  });
});
