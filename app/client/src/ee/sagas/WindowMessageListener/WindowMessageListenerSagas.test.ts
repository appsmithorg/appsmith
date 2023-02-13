/* eslint-disable @typescript-eslint/ban-types */
import {
  TUnlistenWindowMessageDescription,
  TWindowMessageListenerDescription,
} from "@appsmith/workers/Evaluation/fns/messageListenerFns";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  windowMessageListener,
  unListenWindowMessage,
  __listenersMap__,
  checkEventIsFromParent,
  checkUrlError,
} from "./WindowMessageListenerSagas";
import * as WindowMessageListenerSagas from "./WindowMessageListenerSagas";
import { fireEvent } from "@testing-library/react";
import AppsmithConsole from "utils/AppsmithConsole";

const eventListenerCallbackMock = jest.fn();
const getEventListenerSpy = jest
  .spyOn(WindowMessageListenerSagas, "getEventListener")
  .mockImplementation(() => {
    return eventListenerCallbackMock;
  });

const addEventListenerSpy = jest.spyOn(window, "addEventListener");
const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
const ConsoleErrorSpy = jest.spyOn(AppsmithConsole, "error");
const ConsoleWarningSpy = jest.spyOn(AppsmithConsole, "warning");

describe("Window message listener", () => {
  afterEach(() => {
    eventListenerCallbackMock.mockClear();
    jest.clearAllMocks();
  });
  afterAll(() => {
    eventListenerCallbackMock.mockRestore();
    jest.restoreAllMocks();
  });
  it("1. addEventListener should be called", () => {
    const payload: TWindowMessageListenerDescription["payload"] = {
      callbackString: "() => {}",
      acceptedOrigin: "https://domain.com",
    };

    const iter = windowMessageListener(
      payload,
      EventType.ON_JS_FUNCTION_EXECUTE,
      {},
    );

    // The first value sent to next is always lost
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next
    iter.next();

    // first yield
    expect(iter.next().done).toBe(true);

    expect(getEventListenerSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).toHaveBeenCalled();

    expect(__listenersMap__.get("https://domain.com")).toBeDefined();
  });

  it("2. should execute callback on message event", () => {
    expect(__listenersMap__.get("https://domain.com")).toBeDefined();
    fireEvent(
      window,
      new MessageEvent("message", {
        data: "My message",
        origin: "https://domain.com",
      }),
    );

    expect(eventListenerCallbackMock).toHaveBeenCalled();
  });

  it("3. checkEventIsFromParent checks event properties", () => {
    let result = checkEventIsFromParent(
      {
        source: window.parent,
        type: "message",
        origin: "https://domain.com",
      } as MessageEvent,
      {
        acceptedOrigin: "https://domain.com",
        callbackString: "() => {}",
      },
    );
    expect(result).toBeTruthy();

    // when event.source is not equal to window.parent
    result = checkEventIsFromParent(
      {
        source: {},
        type: "message",
        origin: "https://domain.com",
      } as MessageEvent,
      {
        acceptedOrigin: "https://domain.com",
        callbackString: "() => {}",
      },
    );
    expect(result).toBeFalsy();

    // when event.type is not equal to "message"
    result = checkEventIsFromParent(
      {
        source: window.parent,
        type: "somthing",
        origin: "https://domain.com",
      } as MessageEvent,
      {
        acceptedOrigin: "https://domain.com",
        callbackString: "() => {}",
      },
    );
    expect(result).toBeFalsy();

    // when event.origin is not equal to acceptedOrigin
    result = checkEventIsFromParent(
      {
        source: window.parent,
        type: "message",
        origin: "https://domain1.com",
      } as MessageEvent,
      {
        acceptedOrigin: "https://domain.com",
        callbackString: "() => {}",
      },
    );
    expect(result).toBeFalsy();
  });

  it("4. addEventListener shouldn't be called again", () => {
    expect(__listenersMap__.get("https://domain.com")).toBeDefined();
    const payload: TWindowMessageListenerDescription["payload"] = {
      callbackString: "() => {}",
      acceptedOrigin: "https://domain.com",
    };

    const iter = windowMessageListener(
      payload,
      EventType.ON_JS_FUNCTION_EXECUTE,
      {},
    );

    expect(iter.next().done).toBe(true);
    expect(ConsoleWarningSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it("5. removeEventListener shouldn't be called", () => {
    expect(__listenersMap__.get("https://domain1.com")).not.toBeDefined();
    const payload: TUnlistenWindowMessageDescription["payload"] = {
      origin: "https://domain1.com",
    };

    const iter = unListenWindowMessage(
      payload,
      EventType.ON_JS_FUNCTION_EXECUTE,
      {},
    );

    expect(iter.next().done).toBe(true);
    expect(ConsoleWarningSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();
  });

  it("6. removeEventListener should be called", () => {
    expect(__listenersMap__.get("https://domain.com")).toBeDefined();
    const payload: TUnlistenWindowMessageDescription["payload"] = {
      origin: "https://domain.com",
    };

    const iter = unListenWindowMessage(
      payload,
      EventType.ON_JS_FUNCTION_EXECUTE,
      {},
    );

    // first yield
    iter.next();

    expect(iter.next().done).toBe(true);
    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(__listenersMap__.get("https://domain.com")).not.toBeDefined();
  });

  it("7. shouldn't execute callback after removeEventListener", () => {
    expect(__listenersMap__.get("https://domain.com")).not.toBeDefined();
    fireEvent(
      window,
      new MessageEvent("message", {
        data: "My message",
        origin: "https://domain.com",
      }),
    );

    expect(eventListenerCallbackMock).not.toHaveBeenCalled();
  });

  it("8. checkUrlError does validations", () => {
    expect(checkUrlError("https://domain.com")).toBeUndefined();
    expect(checkUrlError("https://domain.com?abc=123")).toEqual(
      "Please use a valid domain name. e.g. https://domain.com (No query params)",
    );
    expect(checkUrlError("https://domain.com/my-page")).toEqual(
      "Please use a valid domain name. e.g. https://domain.com (No sub-directories)",
    );
    expect(checkUrlError("https://domain.com/")).toEqual(
      "Please use a valid domain name. e.g. https://domain.com (No trailing slash)",
    );
    expect(checkUrlError("random")).toEqual(
      "Please use a valid domain name. e.g. https://domain.com",
    );
  });

  it("9. addEventListener shouldn't be called with invalid URL", () => {
    const payload: TWindowMessageListenerDescription["payload"] = {
      callbackString: "() => {}",
      acceptedOrigin: "random",
    };

    const iter = windowMessageListener(
      payload,
      EventType.ON_JS_FUNCTION_EXECUTE,
      {},
    );

    expect(iter.next().done).toBe(true);
    expect(ConsoleErrorSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it("10. removeEventListener shouldn't be called with invalid URL", () => {
    const payload: TUnlistenWindowMessageDescription["payload"] = {
      origin: "random",
    };

    const iter = unListenWindowMessage(
      payload,
      EventType.ON_JS_FUNCTION_EXECUTE,
      {},
    );

    expect(iter.next().done).toBe(true);
    expect(ConsoleErrorSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();
  });
});
