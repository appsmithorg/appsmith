import { renderHook, act } from "@testing-library/react-hooks";
import useWindowDimensions from "./useWindowDimensions";

describe("useWindowDimensions hook", () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });

    // Clean up event listeners
    window.removeEventListener("resize", () => {});
  });

  it("should return current window dimensions on initial render", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { result } = renderHook(() => useWindowDimensions());

    const [width, height] = result.current;

    expect(width).toBe(1024);
    expect(height).toBe(768);
  });

  it("should update dimensions when window is resized", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 600,
    });

    const { result } = renderHook(() => useWindowDimensions());

    // Initial dimensions
    expect(result.current[0]).toBe(800);
    expect(result.current[1]).toBe(600);

    // Simulate resize
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 900,
      });

      window.dispatchEvent(new Event("resize"));
    });

    // Updated dimensions
    expect(result.current[0]).toBe(1200);
    expect(result.current[1]).toBe(900);
  });

  it("should handle multiple resize events", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 400,
    });

    const { result } = renderHook(() => useWindowDimensions());

    expect(result.current[0]).toBe(500);
    expect(result.current[1]).toBe(400);

    // First resize
    act(() => {
      Object.defineProperty(window, "innerWidth", { value: 600 });
      Object.defineProperty(window, "innerHeight", { value: 500 });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current[0]).toBe(600);
    expect(result.current[1]).toBe(500);

    // Second resize
    act(() => {
      Object.defineProperty(window, "innerWidth", { value: 700 });
      Object.defineProperty(window, "innerHeight", { value: 600 });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current[0]).toBe(700);
    expect(result.current[1]).toBe(600);
  });

  it("should clean up event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { unmount } = renderHook(() => useWindowDimensions());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should return an array with width as first element and height as second", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 1080,
    });

    const { result } = renderHook(() => useWindowDimensions());

    const dimensions = result.current;

    expect(Array.isArray(dimensions)).toBe(true);
    expect(dimensions.length).toBe(2);
    expect(dimensions[0]).toBe(1920);
    expect(dimensions[1]).toBe(1080);
  });

  it("should handle very small window dimensions", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 320,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 240,
    });

    const { result } = renderHook(() => useWindowDimensions());

    expect(result.current[0]).toBe(320);
    expect(result.current[1]).toBe(240);
  });

  it("should handle large window dimensions", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 3840,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 2160,
    });

    const { result } = renderHook(() => useWindowDimensions());

    expect(result.current[0]).toBe(3840);
    expect(result.current[1]).toBe(2160);
  });
});