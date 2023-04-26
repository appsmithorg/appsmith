import {
  messageListener,
  windowMessageListener,
  checkEventIsFromParent,
  unListenWindowMessage,
} from "./WindowMessageListenerSagas";
import * as WindowMessageListenerSagas from "./WindowMessageListenerSagas";
import { fireEvent } from "@testing-library/react";

const eventListenerCallbackMock = jest.fn();
const getEventListenerSpy = jest
  .spyOn(WindowMessageListenerSagas, "getEventListener")
  .mockImplementation(() => {
    return eventListenerCallbackMock;
  });

const addEventListenerSpy = jest.spyOn(window, "addEventListener");
const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

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
    const iter = windowMessageListener();

    // The first value sent to next is always lost
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next
    iter.next();

    // first yield
    expect(iter.next().done).toBe(true);

    expect(getEventListenerSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).toHaveBeenCalled();

    expect(messageListener).toBeDefined();
  });

  it("2. should execute callback on message event", () => {
    expect(messageListener).toBeDefined();
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
    let result = checkEventIsFromParent({
      source: window.parent,
      type: "message",
      origin: "https://domain.com",
    } as MessageEvent);
    expect(result).toBeTruthy();

    // when event.source is not equal to window.parent
    result = checkEventIsFromParent({
      source: {},
      type: "message",
      origin: "https://domain.com",
    } as MessageEvent);
    expect(result).toBeFalsy();

    // when event.type is not equal to "message"
    result = checkEventIsFromParent({
      source: window.parent,
      type: "somthing",
      origin: "https://domain.com",
    } as MessageEvent);
    expect(result).toBeFalsy();
  });

  it("4. addEventListener shouldn't be called again", () => {
    expect(messageListener).toBeDefined();
    const iter = windowMessageListener();
    expect(iter.next().done).toBe(true);

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it("5. removeEventListener should be called", () => {
    expect(messageListener).toBeDefined();
    const iter = unListenWindowMessage();

    // The first value sent to next is always lost
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next
    iter.next();

    expect(iter.next().done).toBe(true);

    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(messageListener).not.toBeDefined();
  });

  it("6. removeEventListener shouldn't be called again", () => {
    expect(messageListener).not.toBeDefined();
    const iter = unListenWindowMessage();
    expect(iter.next().done).toBe(true);
    expect(removeEventListenerSpy).not.toHaveBeenCalled();
  });

  it("7. shouldn't execute callback after removeEventListener", () => {
    expect(messageListener).not.toBeDefined();
    fireEvent(
      window,
      new MessageEvent("message", {
        data: "My message",
        origin: "https://domain.com",
      }),
    );

    expect(eventListenerCallbackMock).not.toHaveBeenCalled();
  });
});
