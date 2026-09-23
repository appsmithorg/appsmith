import { draggableElement } from "./utils";

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

jest.mock("resize-observer-polyfill", () => ({
  __esModule: true,
  // The polyfill is instantiated by other modules at import time, before the
  // spies above are initialized — defer the spy lookup to call time.
  default: class MockResizeObserver {
    observe = (...args: unknown[]) => mockObserve(...args);
    disconnect = (...args: unknown[]) => mockDisconnect(...args);
  },
}));

function createDraggableTarget() {
  const element = document.createElement("div");

  document.body.appendChild(element);
  Object.defineProperty(element, "clientWidth", { value: 300 });
  Object.defineProperty(element, "clientHeight", { value: 120 });
  element.getBoundingClientRect = () =>
    ({
      left: 200,
      top: 150,
      width: 300,
      height: 120,
      right: 500,
      bottom: 270,
      x: 200,
      y: 150,
      toJSON: () => ({}),
    }) as DOMRect;

  return element;
}

function mouseEvent(type: string, clientX: number, clientY: number) {
  return new MouseEvent(type, {
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
  });
}

describe("draggableElement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Make sure no drag handlers survive a test.
    document.onmousemove = null;
    document.onmouseup = null;
    document.body.innerHTML = "";
  });

  it("prevents the default mousedown action so the anchored editor keeps focus", () => {
    const element = createDraggableTarget();
    const teardown = draggableElement("t--test-drag", element, jest.fn());

    const mousedown = mouseEvent("mousedown", 10, 10);

    element.dispatchEvent(mousedown);

    expect(mousedown.defaultPrevented).toBe(true);

    document.dispatchEvent(mouseEvent("mouseup", 10, 10));
    teardown();
  });

  it("reports the drag lifecycle exactly once per phase via onDragStateChange", () => {
    const element = createDraggableTarget();
    const onDragStateChange = jest.fn();
    const teardown = draggableElement(
      "t--test-drag",
      element,
      jest.fn(),
      null,
      undefined,
      undefined,
      undefined,
      undefined,
      onDragStateChange,
    );

    element.dispatchEvent(mouseEvent("mousedown", 10, 10));

    expect(onDragStateChange).toHaveBeenCalledTimes(1);
    expect(onDragStateChange).toHaveBeenLastCalledWith(true);

    document.dispatchEvent(mouseEvent("mousemove", 40, 50));
    document.dispatchEvent(mouseEvent("mouseup", 40, 50));

    expect(onDragStateChange).toHaveBeenCalledTimes(2);
    expect(onDragStateChange).toHaveBeenLastCalledWith(false);

    teardown();
  });

  it("does not start observing resizes mid-drag, only after the drag settles", () => {
    const element = createDraggableTarget();
    const teardown = draggableElement("t--test-drag", element, jest.fn());

    element.dispatchEvent(mouseEvent("mousedown", 10, 10));
    document.dispatchEvent(mouseEvent("mousemove", 40, 50));

    // Observing mid-drag persisted a position mid-gesture, which re-rendered
    // the owning popper and tore the live drag down.
    expect(mockObserve).not.toHaveBeenCalled();

    document.dispatchEvent(mouseEvent("mouseup", 40, 50));

    expect(mockObserve).toHaveBeenCalledWith(element);

    teardown();
  });

  it("persists the position on mouseup for a straight single-axis drag", () => {
    const element = createDraggableTarget();
    const onPositionChange = jest.fn();
    const teardown = draggableElement(
      "t--test-drag",
      element,
      onPositionChange,
    );

    element.dispatchEvent(mouseEvent("mousedown", 10, 10));
    // Vertical-only drag: zero delta on the x axis.
    document.dispatchEvent(mouseEvent("mousemove", 10, 60));
    document.dispatchEvent(mouseEvent("mouseup", 10, 60));

    expect(onPositionChange).toHaveBeenCalledWith({ left: 200, top: 150 });

    teardown();
  });

  it("does not persist a position for a click that never moved", () => {
    const element = createDraggableTarget();
    const onPositionChange = jest.fn();
    const teardown = draggableElement(
      "t--test-drag",
      element,
      onPositionChange,
    );

    element.dispatchEvent(mouseEvent("mousedown", 10, 10));
    document.dispatchEvent(mouseEvent("mouseup", 10, 10));

    expect(onPositionChange).not.toHaveBeenCalled();
    expect(mockObserve).not.toHaveBeenCalled();

    teardown();
  });

  it("ends the reported drag and releases handlers when torn down mid-drag", () => {
    const element = createDraggableTarget();
    const onDragStateChange = jest.fn();
    const teardown = draggableElement(
      "t--test-drag",
      element,
      jest.fn(),
      null,
      undefined,
      undefined,
      undefined,
      undefined,
      onDragStateChange,
    );

    element.dispatchEvent(mouseEvent("mousedown", 10, 10));

    expect(onDragStateChange).toHaveBeenLastCalledWith(true);

    teardown();

    expect(onDragStateChange).toHaveBeenLastCalledWith(false);
    expect(document.onmousemove).toBeNull();
    expect(document.onmouseup).toBeNull();
  });
});
