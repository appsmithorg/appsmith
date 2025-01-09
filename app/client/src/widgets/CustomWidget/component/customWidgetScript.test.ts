import {
  createChannelToParent,
  generateAppsmithCssVariables,
  EVENTS,
  main,
} from "./customWidgetscript";

interface CustomEventDetail {
  type: string;
  data?: Record<string, unknown>;
  key?: number;
  success?: boolean;
  model?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  mode?: string;
}

interface AppsmithCustomEvent extends CustomEvent {
  detail: CustomEventDetail;
}

type ModelHandler = (
  model: Record<string, unknown>,
  prevModel?: Record<string, unknown>,
) => void;
type UiHandler = (
  ui: Record<string, unknown>,
  prevUi?: Record<string, unknown>,
) => void;
type ThemeHandler = (
  theme: Record<string, unknown>,
  prevTheme?: Record<string, unknown>,
) => void;

const modelSubscribers = new Set<ModelHandler>();
const uiSubscribers = new Set<UiHandler>();
const themeSubscribers = new Set<ThemeHandler>();

jest.mock("queue-microtask", () => ({
  queueMicrotask: jest.fn().mockImplementationOnce((fn) => fn()),
}));

declare global {
  interface Window {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appsmith: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    triggerEvent: any;
  }
}

describe("createChannelToParent", () => {
  beforeEach(() => {
    const eventHandlers = new Map();

    document.addEventListener = jest.fn(
      (type: string, handler: EventListenerOrEventListenerObject) => {
        if (!eventHandlers.has(type)) {
          eventHandlers.set(type, new Set());
        }

        eventHandlers.get(type).add(handler);
      },
    );

    document.dispatchEvent = jest.fn((event: Event) => {
      const handlers = eventHandlers.get(event.type);

      if (handlers) {
        handlers.forEach((handler: EventListenerOrEventListenerObject) => {
          if (typeof handler === "function") {
            handler(event as AppsmithCustomEvent);
          } else {
            handler.handleEvent(event as AppsmithCustomEvent);
          }
        });
      }

      return true;
    });

    window.triggerEvent = (type: string, detail: CustomEventDetail) => {
      const event = new CustomEvent(type, {
        detail,
        bubbles: true,
        composed: true,
      }) as AppsmithCustomEvent;

      document.dispatchEvent(event);
    };
  });

  it("should check the onMessage function", () => {
    const channel = createChannelToParent();
    const handler = jest.fn();

    channel.onMessage("test", handler);
    expect(channel.onMessageMap.get("test")[0]).toBe(handler);

    window.triggerEvent("custom-widget-event", {
      type: "test",
    });

    expect(handler).toHaveBeenCalledWith({
      type: "test",
    });
  });

  it("should check the postMessage function", async () => {
    const channel = createChannelToParent();
    const dispatchEventSpy = jest.spyOn(document, "dispatchEvent");

    // Add handler for message acknowledgment
    document.addEventListener("custom-widget-event", (event: Event) => {
      const customEvent = event as AppsmithCustomEvent;

      if (
        customEvent.detail.type === "test1" ||
        customEvent.detail.type === "test2"
      ) {
        window.triggerEvent("custom-widget-event", {
          type: EVENTS.CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK,
          key: customEvent.detail.key,
          success: true,
        });
      }
    });

    channel.postMessage("test1", { index: 1 });
    channel.postMessage("test2", { index: 2 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "custom-widget-event",
        detail: expect.objectContaining({
          type: "test1",
          data: { index: 1 },
          key: expect.any(Number),
        }),
      }),
    );

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "custom-widget-event",
        detail: expect.objectContaining({
          type: "test2",
          data: { index: 2 },
          key: expect.any(Number),
        }),
      }),
    );
  }, 1000);
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
    const eventHandlers = new Map();

    document.addEventListener = jest.fn(
      (type: string, handler: EventListenerOrEventListenerObject) => {
        if (!eventHandlers.has(type)) {
          eventHandlers.set(type, new Set());
        }

        eventHandlers.get(type).add(handler);
      },
    );

    document.dispatchEvent = jest.fn((event: Event) => {
      const handlers = eventHandlers.get(event.type);

      if (handlers) {
        handlers.forEach((handler: EventListenerOrEventListenerObject) => {
          if (typeof handler === "function") {
            handler(event as AppsmithCustomEvent);
          } else {
            handler.handleEvent(event as AppsmithCustomEvent);
          }
        });
      }

      return true;
    });

    window.triggerEvent = (type: string, detail: CustomEventDetail) => {
      const event = new CustomEvent(type, {
        detail,
        bubbles: true,
        composed: true,
      }) as AppsmithCustomEvent;

      document.dispatchEvent(event);
    };

    // Clear all subscribers before each test
    modelSubscribers.clear();
    uiSubscribers.clear();
    themeSubscribers.clear();

    // Initialize appsmith object with default values and methods
    window.appsmith = {
      model: { test: 1 },
      ui: { width: 1, height: 2 },
      theme: { color: "#fff" },
      mode: "test",
      onReady: jest.fn((fn) => {
        if (typeof fn === "function") fn();
      }),
      onModelChange: jest.fn((fn) => {
        if (typeof fn === "function") {
          modelSubscribers.add(fn);
          fn(window.appsmith.model);
        }

        return () => {
          modelSubscribers.delete(fn);
        };
      }),
      onUiChange: jest.fn((fn) => {
        if (typeof fn === "function") {
          uiSubscribers.add(fn);
          fn(window.appsmith.ui);
        }

        return () => {
          uiSubscribers.delete(fn);
        };
      }),
      onThemeChange: jest.fn((fn) => {
        if (typeof fn === "function") {
          themeSubscribers.add(fn);
          fn(window.appsmith.theme);
        }

        return () => {
          themeSubscribers.delete(fn);
        };
      }),
      updateModel: jest.fn((data) => {
        const prevModel = { ...window.appsmith.model };

        window.appsmith.model = { ...prevModel, ...data };
        const event = new CustomEvent("custom-widget-event", {
          detail: {
            type: EVENTS.CUSTOM_WIDGET_UPDATE_MODEL,
            data,
            key: Math.random(),
          },
          bubbles: true,
          composed: true,
        });

        document.dispatchEvent(event);
        modelSubscribers.forEach((fn: ModelHandler) =>
          fn(window.appsmith.model, prevModel),
        );
      }),
      triggerEvent: jest.fn((eventName, contextObj) => {
        const event = new CustomEvent("custom-widget-event", {
          detail: {
            type: EVENTS.CUSTOM_WIDGET_TRIGGER_EVENT,
            data: {
              eventName,
              contextObj,
            },
            key: Math.random(),
          },
          bubbles: true,
          composed: true,
        });

        document.dispatchEvent(event);
      }),
    };

    main();
  });

  it("should check API functions - onReady and init", () => {
    const handler = jest.fn();

    window.appsmith.onReady(handler);

    window.triggerEvent("custom-widget-event", {
      type: EVENTS.CUSTOM_WIDGET_READY_ACK,
      model: { test: 1 },
      ui: { width: 1, height: 2 },
      mode: "test",
      theme: { color: "#fff" },
    });

    expect(window.appsmith.mode).toBe("test");
    expect(window.appsmith.model).toEqual({ test: 1 });
    expect(window.appsmith.ui).toEqual({ width: 1, height: 2 });
    expect(handler).toHaveBeenCalled();
  });

  it("should check API functions - onModelChange", () => {
    const handler = jest.fn();
    const unlisten = window.appsmith.onModelChange(handler);

    expect(handler).toHaveBeenCalledWith({ test: 1 });

    const prevModel = { ...window.appsmith.model };

    window.appsmith.model = { test: 2 };
    window.triggerEvent("custom-widget-event", {
      type: EVENTS.CUSTOM_WIDGET_MODEL_CHANGE,
      model: { test: 2 },
    });
    modelSubscribers.forEach((fn: ModelHandler) =>
      fn(window.appsmith.model, prevModel),
    );

    expect(window.appsmith.model).toEqual({ test: 2 });
    expect(handler).toHaveBeenCalledWith({ test: 2 }, { test: 1 });

    handler.mockClear();
    unlisten();

    window.triggerEvent("custom-widget-event", {
      type: EVENTS.CUSTOM_WIDGET_MODEL_CHANGE,
      model: { test: 3 },
    });

    expect(window.appsmith.model).toEqual({ test: 3 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("should check API functions - onUiChange", () => {
    const handler = jest.fn();
    const unlisten = window.appsmith.onUiChange(handler);

    expect(handler).toHaveBeenCalledWith({ width: 1, height: 2 });

    const prevUi = { ...window.appsmith.ui };

    window.appsmith.ui = { width: 2, height: 3 };
    window.triggerEvent("custom-widget-event", {
      type: EVENTS.CUSTOM_WIDGET_UI_CHANGE,
      ui: { width: 2, height: 3 },
    });
    uiSubscribers.forEach((fn: UiHandler) => fn(window.appsmith.ui, prevUi));

    expect(window.appsmith.ui).toEqual({ width: 2, height: 3 });
    expect(handler).toHaveBeenCalledWith(
      { width: 2, height: 3 },
      { width: 1, height: 2 },
    );

    handler.mockClear();
    unlisten();

    window.triggerEvent("custom-widget-event", {
      type: EVENTS.CUSTOM_WIDGET_UI_CHANGE,
      ui: { width: 3, height: 4 },
    });

    expect(window.appsmith.ui).toEqual({ width: 3, height: 4 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("should check API functions - onThemeChange", () => {
    const handler = jest.fn();
    const unlisten = window.appsmith.onThemeChange(handler);

    expect(handler).toHaveBeenCalledWith({ color: "#fff" });

    const prevTheme = { ...window.appsmith.theme };

    window.appsmith.theme = { color: "#000" };
    window.triggerEvent("custom-widget-event", {
      type: EVENTS.CUSTOM_WIDGET_THEME_UPDATE,
      theme: { color: "#000" },
    });
    themeSubscribers.forEach((fn: ThemeHandler) =>
      fn(window.appsmith.theme, prevTheme),
    );

    expect(window.appsmith.theme).toEqual({ color: "#000" });
    expect(handler).toHaveBeenCalledWith({ color: "#000" }, { color: "#fff" });

    handler.mockClear();
    unlisten();

    window.triggerEvent("custom-widget-event", {
      type: EVENTS.CUSTOM_WIDGET_THEME_UPDATE,
      theme: { color: "#f0f" },
    });

    expect(window.appsmith.theme).toEqual({ color: "#f0f" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("should check API functions - updateModel", async () => {
    const dispatchEventSpy = jest.spyOn(document, "dispatchEvent");

    window.appsmith.updateModel({ test: 4 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "custom-widget-event",
        detail: expect.objectContaining({
          type: EVENTS.CUSTOM_WIDGET_UPDATE_MODEL,
          data: { test: 4 },
          key: expect.any(Number),
        }),
      }),
    );

    expect(window.appsmith.model).toEqual({ test: 4 });
  }, 1000);

  it("should check API functions - triggerEvent", async () => {
    const dispatchEventSpy = jest.spyOn(document, "dispatchEvent");

    dispatchEventSpy.mockClear();

    window.appsmith.triggerEvent("test", { test: 5 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "custom-widget-event",
        detail: expect.objectContaining({
          type: EVENTS.CUSTOM_WIDGET_TRIGGER_EVENT,
          data: {
            eventName: "test",
            contextObj: { test: 5 },
          },
          key: expect.any(Number),
        }),
      }),
    );
  }, 1000);
});
