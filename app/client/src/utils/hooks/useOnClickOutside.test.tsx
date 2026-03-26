import { renderHook } from "@testing-library/react-hooks";
import { useOnClickOutside } from "./useOnClickOutside";
import { createRef } from "react";

describe("useOnClickOutside hook", () => {
  let handler: jest.Mock;

  beforeEach(() => {
    handler = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("should call handler when clicking outside the referenced element", () => {
    const ref = createRef<HTMLDivElement>();
    const element = document.createElement("div");
    document.body.appendChild(element);
    // @ts-expect-error - assigning to ref.current for testing
    ref.current = element;

    renderHook(() => useOnClickOutside([ref], handler));

    // Simulate a click outside
    const clickEvent = new MouseEvent("mousedown", { bubbles: true });
    document.body.dispatchEvent(clickEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(clickEvent);
  });

  it("should not call handler when clicking inside the referenced element", () => {
    const ref = createRef<HTMLDivElement>();
    const element = document.createElement("div");
    document.body.appendChild(element);
    // @ts-expect-error - assigning to ref.current for testing
    ref.current = element;

    renderHook(() => useOnClickOutside([ref], handler));

    // Simulate a click inside
    const clickEvent = new MouseEvent("mousedown", { bubbles: true });
    element.dispatchEvent(clickEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle multiple refs correctly", () => {
    const ref1 = createRef<HTMLDivElement>();
    const ref2 = createRef<HTMLDivElement>();
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");
    document.body.appendChild(element1);
    document.body.appendChild(element2);
    // @ts-expect-error - assigning to ref.current for testing
    ref1.current = element1;
    // @ts-expect-error - assigning to ref.current for testing
    ref2.current = element2;

    renderHook(() => useOnClickOutside([ref1, ref2], handler));

    // Click outside both elements
    const clickEvent = new MouseEvent("mousedown", { bubbles: true });
    document.body.dispatchEvent(clickEvent);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not call handler when clicking inside any of the referenced elements", () => {
    const ref1 = createRef<HTMLDivElement>();
    const ref2 = createRef<HTMLDivElement>();
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");
    document.body.appendChild(element1);
    document.body.appendChild(element2);
    // @ts-expect-error - assigning to ref.current for testing
    ref1.current = element1;
    // @ts-expect-error - assigning to ref.current for testing
    ref2.current = element2;

    renderHook(() => useOnClickOutside([ref1, ref2], handler));

    // Click inside element1
    const clickEvent1 = new MouseEvent("mousedown", { bubbles: true });
    element1.dispatchEvent(clickEvent1);

    expect(handler).not.toHaveBeenCalled();

    // Click inside element2
    const clickEvent2 = new MouseEvent("mousedown", { bubbles: true });
    element2.dispatchEvent(clickEvent2);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle touch events (touchstart)", () => {
    const ref = createRef<HTMLDivElement>();
    const element = document.createElement("div");
    document.body.appendChild(element);
    // @ts-expect-error - assigning to ref.current for testing
    ref.current = element;

    renderHook(() => useOnClickOutside([ref], handler));

    // Simulate a touch outside
    const touchEvent = new TouchEvent("touchstart", { bubbles: true });
    document.body.dispatchEvent(touchEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(touchEvent);
  });

  it("should not call handler when touching inside the referenced element", () => {
    const ref = createRef<HTMLDivElement>();
    const element = document.createElement("div");
    document.body.appendChild(element);
    // @ts-expect-error - assigning to ref.current for testing
    ref.current = element;

    renderHook(() => useOnClickOutside([ref], handler));

    // Simulate a touch inside
    const touchEvent = new TouchEvent("touchstart", { bubbles: true });
    element.dispatchEvent(touchEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should clean up event listeners on unmount", () => {
    const ref = createRef<HTMLDivElement>();
    const element = document.createElement("div");
    document.body.appendChild(element);
    // @ts-expect-error - assigning to ref.current for testing
    ref.current = element;

    const removeEventListenerSpy = jest.spyOn(document.body, "removeEventListener");

    const { unmount } = renderHook(() => useOnClickOutside([ref], handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should not call handler if ref.current is null", () => {
    const ref = createRef<HTMLDivElement>();

    renderHook(() => useOnClickOutside([ref], handler));

    // Click anywhere
    const clickEvent = new MouseEvent("mousedown", { bubbles: true });
    document.body.dispatchEvent(clickEvent);

    // When ref.current is null, the handler should NOT be called
    // because the hook returns early when el is null
    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle nested elements correctly", () => {
    const ref = createRef<HTMLDivElement>();
    const parentElement = document.createElement("div");
    const childElement = document.createElement("span");
    parentElement.appendChild(childElement);
    document.body.appendChild(parentElement);
    // @ts-expect-error - assigning to ref.current for testing
    ref.current = parentElement;

    renderHook(() => useOnClickOutside([ref], handler));

    // Click on child element (inside parent)
    const clickEvent = new MouseEvent("mousedown", { bubbles: true });
    childElement.dispatchEvent(clickEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should update when handler changes", () => {
    const ref = createRef<HTMLDivElement>();
    const element = document.createElement("div");
    document.body.appendChild(element);
    // @ts-expect-error - assigning to ref.current for testing
    ref.current = element;

    const { rerender } = renderHook(
      ({ handler }: { handler: jest.Mock }) => useOnClickOutside([ref], handler),
      { initialProps: { handler } },
    );

    // Click outside
    const clickEvent1 = new MouseEvent("mousedown", { bubbles: true });
    document.body.dispatchEvent(clickEvent1);

    expect(handler).toHaveBeenCalledTimes(1);

    // Update handler
    const newHandler = jest.fn();
    rerender({ handler: newHandler });

    // Click outside again
    const clickEvent2 = new MouseEvent("mousedown", { bubbles: true });
    document.body.dispatchEvent(clickEvent2);

    expect(newHandler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1); // Should still be 1, not called again
  });
});