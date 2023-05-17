import { fireEvent } from "@testing-library/react";
import TriggerEmitter from "workers/Evaluation/fns/utils/TriggerEmitter";
import {
  clearAllWindowMessageListeners,
  unlistenWindowMessage,
  windowMessageListener,
  windowMessageListenerId,
  _clearAllCallback,
  __listenersMap__,
} from ".";
import { checkUrlError } from "./validations";

const emitMethodMock = jest.spyOn(TriggerEmitter, "emit").mockImplementation();
const ConsoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
const ConsoleWarningSpy = jest.spyOn(console, "warn").mockImplementation();
const callbackMock = jest.fn();
const callback_2_Mock = jest.fn();

const sendMessage = (messageId: string, domain: string, data: unknown) => {
  const message = new MessageEvent("message", {
    data: {
      messageId,
      body: {
        data,
        origin: domain,
      },
    },
  });
  fireEvent(self, message);
};

const getListener = (origin: string) => {
  return __listenersMap__.get(origin);
};

describe("messageListenerFns", () => {
  afterEach(() => {
    emitMethodMock.mockClear();
    callbackMock.mockClear();
    callback_2_Mock.mockClear();
    ConsoleErrorSpy.mockClear();
    ConsoleWarningSpy.mockClear();
  });
  afterAll(() => {
    emitMethodMock.mockRestore();
    callbackMock.mockRestore();
    callback_2_Mock.mockRestore();
    ConsoleErrorSpy.mockRestore();
    ConsoleWarningSpy.mockRestore();
  });

  it("1. executes callback for parent message listener", () => {
    expect(_clearAllCallback).toBeUndefined();
    windowMessageListener("https://domain.com", callbackMock);
    expect(emitMethodMock).toHaveBeenCalled();
    expect(_clearAllCallback).toBeDefined();

    // shouldn't execute with random id
    sendMessage("randomId", "https://domain.com", "My data");
    expect(callbackMock).not.toHaveBeenCalled();

    sendMessage(windowMessageListenerId, "https://domain.com", "My data");
    expect(callbackMock).toHaveBeenCalledWith("My data");
  });

  it("2. removes message listener", () => {
    unlistenWindowMessage("https://domain.com");
    expect(getListener("https://domain.com")).toBeUndefined();
    expect(emitMethodMock).toHaveBeenCalled();

    // test if previous listener is inactive
    sendMessage(windowMessageListenerId, "https://domain.com", "My data");
    expect(callbackMock).not.toHaveBeenCalled();
  });

  it("3. doesn't execute callback for different domain", () => {
    windowMessageListener("https://domain.com", callbackMock);
    expect(emitMethodMock).toHaveBeenCalled();
    sendMessage(windowMessageListenerId, "https://domain-1.com", "My data");
    expect(callbackMock).not.toHaveBeenCalledWith("My data");
    unlistenWindowMessage("https://domain.com");
  });

  it("4. doesn't register callback twice for a domain", () => {
    windowMessageListener("https://domain.com", callbackMock);
    expect(emitMethodMock).toHaveBeenCalled();
    emitMethodMock.mockClear();
    windowMessageListener("https://domain.com", callback_2_Mock);
    expect(emitMethodMock).not.toHaveBeenCalled();
    expect(__listenersMap__.size).toBe(1);

    sendMessage(windowMessageListenerId, "https://domain.com", "My data");
    expect(callbackMock).toHaveBeenCalled();
    expect(callback_2_Mock).not.toHaveBeenCalled();
    unlistenWindowMessage("https://domain.com");
  });

  it("5. unlisten - calling other-domain.com shouldn't remove domain.com", () => {
    windowMessageListener("https://domain.com", callbackMock);
    expect(getListener("https://domain.com")).toBeDefined();
    emitMethodMock.mockClear();
    unlistenWindowMessage("https://other-domain");
    expect(emitMethodMock).not.toHaveBeenCalled();
    expect(getListener("https://domain.com")).toBeDefined();

    unlistenWindowMessage("https://domain.com");
  });

  it("6. shouldn't register with invalid domain", () => {
    windowMessageListener("invalid-domain.com", callbackMock);
    expect(getListener("invalid-domain.com")).toBeUndefined();
    expect(__listenersMap__.size).toBe(0);
    expect(emitMethodMock).not.toHaveBeenCalled();
  });

  it("7. shouldn't unlisten with invalid domain", () => {
    windowMessageListener("https://domain.com", callbackMock);
    emitMethodMock.mockClear();
    unlistenWindowMessage("invalid-domain.com");
    expect(__listenersMap__.size).toBe(1);
    expect(emitMethodMock).not.toHaveBeenCalled();

    unlistenWindowMessage("https://domain.com");
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

  it("9. listening works with multiple domains", () => {
    windowMessageListener("https://domain.com", callbackMock);
    windowMessageListener("https://domain-2.com", callback_2_Mock);
    expect(emitMethodMock).toHaveBeenCalledTimes(2);

    sendMessage(windowMessageListenerId, "https://domain.com", "data1");
    expect(callbackMock).toHaveBeenCalledWith("data1");
    sendMessage(windowMessageListenerId, "https://domain-2.com", "data2");
    expect(callback_2_Mock).toHaveBeenCalledWith("data2");

    callbackMock.mockClear();
    callback_2_Mock.mockClear();

    // clears all listeners
    clearAllWindowMessageListeners();
    expect(__listenersMap__.size).toBe(0);

    sendMessage(windowMessageListenerId, "https://domain.com", "data1");
    expect(callbackMock).not.toHaveBeenCalled();
    sendMessage(windowMessageListenerId, "https://domain-2.com", "data2");
    expect(callback_2_Mock).not.toHaveBeenCalled();

    expect(_clearAllCallback).toBeUndefined();
  });
});
