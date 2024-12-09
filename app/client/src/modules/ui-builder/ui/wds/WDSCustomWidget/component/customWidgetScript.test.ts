import {
  createChannelToParent,
  generateAppsmithCssVariables,
  EVENTS,
  main,
} from "./customWidgetscript";

jest.mock("queue-microtask", () => ({
  queueMicrotask: jest.fn().mockImplementationOnce((fn) => fn()),
}));

declare global {
  interface Window {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appsmith: any;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    triggerEvent: any;
  }
}

describe("createChannelToParent", () => {
  beforeEach(() => {
    const events = new Map();

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener = (type: string, handler: any) => {
      events.set(type, handler);
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.triggerEvent = (type: string, event: any) => {
      events.get(type)(event);
    };
  });

  it("should check the onMessage function", () => {
    const channel = createChannelToParent();

    const handler = jest.fn();

    channel.onMessage("test", handler);

    expect(channel.onMessageMap.get("test")[0]).toBe(handler);

    window.triggerEvent("message", {
      source: window.parent,
      data: {
        type: "test",
      },
    });

    expect(handler).toHaveBeenCalledWith({
      type: "test",
    });
  });

  it("should check the postMessage function", async () => {
    const channel = createChannelToParent();

    window.parent.postMessage = jest.fn().mockImplementationOnce((data) => {
      window.triggerEvent("message", {
        source: window.parent,
        data: {
          type: EVENTS.CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK,
          key: data.key,
          success: true,
        },
      });
    });

    channel.postMessage("test1", { index: 1 });

    channel.postMessage("test2", { index: 2 });

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window.parent.postMessage).toHaveBeenCalledWith(
          {
            type: "test1",
            data: { index: 1 },
            key: expect.any(Number),
          },
          "*",
        );

        expect(window.parent.postMessage).toHaveBeenCalledWith(
          {
            type: "test2",
            data: { index: 2 },
            key: expect.any(Number),
          },
          "*",
        );

        resolve(true);
      });
    });
  });
});

describe("generateAppsmithCssVariables", () => {
  it("should generate CSS variables in the style element", () => {
    const source = {
      key1: "value1",
      key2: 42,
      key3: [],
    };

    const provider = "model";

    generateAppsmithCssVariables(provider)(source);

    expect(
      document
        .getElementById(`appsmith-${provider}-css-tokens`)
        ?.innerHTML.replace(/\s+/g, "")
        .replace(/\n/g, ""),
    ).toBe(`:root{--appsmith-model-key1:value1;--appsmith-model-key2:42;}`);
  });
});

describe("CustomWidgetScript", () => {
  beforeAll(() => {
    const events = new Map();

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener = (type: string, handler: any) => {
      events.set(type, handler);
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.triggerEvent = (type: string, event: any) => {
      events.get(type)(event);
    };

    window.parent.postMessage = jest.fn().mockImplementationOnce((data) => {
      window.triggerEvent("message", {
        source: window.parent,
        data: {
          type: EVENTS.CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK,
          key: data.key,
          success: true,
        },
      });
    });

    main();
  });

  it("should check API functions - onReady and init", () => {
    const handler = jest.fn();

    window.appsmith.onReady(handler);

    window.triggerEvent("message", {
      source: window.parent,
      data: {
        type: EVENTS.CUSTOM_WIDGET_READY_ACK,
        model: {
          test: 1,
        },
        ui: {
          width: 1,
          height: 2,
        },
        mode: "test",
        theme: {
          color: "#fff",
        },
      },
    });

    expect(window.appsmith.mode).toBe("test");

    expect(window.appsmith.model).toEqual({
      test: 1,
    });

    expect(window.appsmith.ui).toEqual({
      width: 1,
      height: 2,
    });

    expect(handler).toHaveBeenCalled();
  });

  it("should check API functions - onModelChange", () => {
    const handler = jest.fn();

    const unlisten = window.appsmith.onModelChange(handler);

    expect(handler).toHaveBeenCalledWith({
      test: 1,
    });

    window.triggerEvent("message", {
      source: window.parent,
      data: {
        type: EVENTS.CUSTOM_WIDGET_MODEL_CHANGE,
        model: {
          test: 2,
        },
      },
    });

    expect(window.appsmith.model).toEqual({
      test: 2,
    });

    expect(handler).toHaveBeenCalledWith(
      {
        test: 2,
      },
      {
        test: 1,
      },
    );

    handler.mockClear();
    unlisten();

    window.triggerEvent("message", {
      source: window.parent,
      data: {
        type: EVENTS.CUSTOM_WIDGET_MODEL_CHANGE,
        model: {
          test: 3,
        },
      },
    });

    expect(window.appsmith.model).toEqual({
      test: 3,
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should check API functions - onThemeChange", () => {
    const handler = jest.fn();

    const unlisten = window.appsmith.onThemeChange(handler);

    expect(handler).toHaveBeenCalledWith({
      color: "#fff",
    });

    window.triggerEvent("message", {
      source: window.parent,
      data: {
        type: EVENTS.CUSTOM_WIDGET_THEME_UPDATE,
        theme: {
          color: "#000",
        },
      },
    });

    expect(window.appsmith.theme).toEqual({
      color: "#000",
    });

    expect(handler).toHaveBeenCalledWith(
      {
        color: "#000",
      },
      {
        color: "#fff",
      },
    );

    handler.mockClear();
    unlisten();

    window.triggerEvent("message", {
      source: window.parent,
      data: {
        type: EVENTS.CUSTOM_WIDGET_THEME_UPDATE,
        theme: {
          color: "#f0f",
        },
      },
    });

    expect(window.appsmith.theme).toEqual({
      color: "#f0f",
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should check API functions - updateModel", async () => {
    window.appsmith.updateModel({
      test: 4,
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window.parent.postMessage).toHaveBeenCalledWith(
          {
            type: EVENTS.CUSTOM_WIDGET_UPDATE_MODEL,
            data: {
              test: 4,
            },
            key: expect.any(Number),
          },
          "*",
        );

        expect(window.appsmith.model).toEqual({
          test: 4,
        });

        resolve(true);
      });
    });
  });

  it("should check API functions - triggerEvent", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.parent.postMessage as any).mockClear();

    window.appsmith.triggerEvent("test", {
      test: 5,
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(window.parent.postMessage).toHaveBeenCalledWith(
          {
            type: EVENTS.CUSTOM_WIDGET_TRIGGER_EVENT,
            data: {
              eventName: "test",
              contextObj: {
                test: 5,
              },
            },
            key: expect.any(Number),
          },
          "*",
        );

        resolve(true);
      });
    });
  });
});
