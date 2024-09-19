import { MessageType } from "utils/MessageUtil";
import { WorkerMessenger } from "../Messenger";

describe("Tests all worker messenger method", () => {
  const mockPostMessage = jest.fn();

  self.postMessage = mockPostMessage;
  afterEach(() => {
    mockPostMessage.mockClear();
  });
  it("messenger.request", () => {
    const response = WorkerMessenger.request({
      method: "test",
      data: {
        trigger: {
          type: "MOCK_TRIGGER",
          payload: {},
        },
        eventType: "Test",
        triggerMeta: {},
      },
    });

    expect(mockPostMessage).toBeCalledWith({
      messageId: expect.stringContaining("request-test"),
      messageType: MessageType.REQUEST,
      body: {
        method: "test",
        data: {
          trigger: {
            type: "MOCK_TRIGGER",
            payload: {},
          },
          eventType: "Test",
          triggerMeta: {},
        },
      },
    });
    const messageId = mockPostMessage.mock.calls[0][0].messageId;

    dispatchEvent(
      new MessageEvent("message", {
        data: {
          messageId,
          messageType: MessageType.RESPONSE,
          body: {
            data: {
              data: "resolved",
            },
          },
        },
      }),
    );
    expect(response).resolves.toStrictEqual({ data: "resolved" });
  });
  it("messenger.ping", () => {
    WorkerMessenger.ping({
      type: "MOCK_TRIGGER",
      payload: {},
    });
    expect(mockPostMessage).toBeCalledWith({
      messageType: MessageType.DEFAULT,
      body: {
        type: "MOCK_TRIGGER",
        payload: {},
      },
    });
  });
});
