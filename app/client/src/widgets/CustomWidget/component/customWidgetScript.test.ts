import { createChannelToParent } from "./yourFile"; // Replace 'yourFile' with the actual file path

jest.mock("queue-microtask", () => ({
  queueMicrotask: jest.fn(),
}));

const originalWindowAddEventListener = window.addEventListener;
const originalWindowRemoveEventListener = window.removeEventListener;
const originalWindowPostMessage = window.parent.postMessage;

describe("createChannelToParent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    window.addEventListener = originalWindowAddEventListener;
    window.removeEventListener = originalWindowRemoveEventListener;
    window.parent.postMessage = originalWindowPostMessage;
  });

  it("registers and unregisters event handlers", () => {
    const channel = createChannelToParent();
    const eventHandler = jest.fn();

    const unsubscribe = channel.onMessage("TEST_EVENT", eventHandler);
    expect(channel.onMessageMap.get("TEST_EVENT")).toBeDefined();

    window.addEventListener("message", {
      source: window.parent,
      data: { type: "TEST_EVENT" },
    });
    expect(eventHandler).toHaveBeenCalled();

    unsubscribe();
    expect(channel.onMessageMap.get("TEST_EVENT")).toBeUndefined();

    window.addEventListener("message", {
      source: window.parent,
      data: { type: "TEST_EVENT" },
    });
    expect(eventHandler).not.toHaveBeenCalled();
  });

  it("posts messages to the parent and flushes the message queue", async () => {
    const channel = createChannelToParent();

    const postMessageable = {
      type: "POST_MESSAGEABLE",
      postMessage: jest.fn(),
    };

    channel.postMessage("TEST_MESSAGE", { key: "value" });
    expect(channel.postMessageQueue).toHaveLength(1);

    await Promise.resolve();
    expect(postMessageable.postMessage).toHaveBeenCalledWith(
      { type: "TEST_MESSAGE", data: { key: "value" } },
      "*",
    );
    expect(channel.postMessageQueue).toHaveLength(0);
  });

  it("throws an error when postMessageable is not postMessageable", () => {
    const channel = createChannelToParent();

    const nonPostMessageable = { type: "NON_POST_MESSAGEABLE" };

    expect(() =>
      channel.postMessage("TEST_MESSAGE", nonPostMessageable),
    ).toThrowError();
  });

  it("schedules microtasks to flush postMessageQueue", async () => {
    const channel = createChannelToParent();

    channel.postMessage("TEST_MESSAGE_1", { key: "value1" });
    channel.postMessage("TEST_MESSAGE_2", { key: "value2" });

    expect(channel.isFlushScheduled).toBe(false);

    channel.scheduleMicrotaskToflushPostMessageQueue();

    expect(channel.isFlushScheduled).toBe(true);

    await Promise.resolve();
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      {
        type: "TEST_MESSAGE_1",
        data: { key: "value1" },
        key: expect.any(Number),
      },
      "*",
    );
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      {
        type: "TEST_MESSAGE_2",
        data: { key: "value2" },
        key: expect.any(Number),
      },
      "*",
    );
    expect(channel.isFlushScheduled).toBe(false);
  });
});
