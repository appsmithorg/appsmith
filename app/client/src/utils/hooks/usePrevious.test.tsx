import { renderHook } from "@testing-library/react-hooks";
import usePrevious from "./usePrevious";

describe("usePrevious hook", () => {
  it("should return undefined on the first render", () => {
    const { result } = renderHook(() => usePrevious("initial"));

    expect(result.current).toBeUndefined();
  });

  it("should return the previous value after the value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: "first" } },
    );

    // First render - should be undefined
    expect(result.current).toBeUndefined();

    // Rerender with a new value
    rerender({ value: "second" });

    // Now it should return the previous value ("first")
    expect(result.current).toBe("first");

    // Rerender again
    rerender({ value: "third" });

    // Now it should return "second"
    expect(result.current).toBe("second");
  });

  it("should work with different types of values", () => {
    // Test with numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 1 } },
    );

    expect(numberResult.current).toBeUndefined();
    numberRerender({ value: 2 });
    expect(numberResult.current).toBe(1);
    numberRerender({ value: 3 });
    expect(numberResult.current).toBe(2);

    // Test with objects
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: { a: 1 } } },
    );

    expect(objectResult.current).toBeUndefined();
    objectRerender({ value: { a: 2 } });
    expect(objectResult.current).toEqual({ a: 1 });
  });

  it("should handle undefined values correctly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: undefined as string | undefined } },
    );

    expect(result.current).toBeUndefined();

    rerender({ value: "defined" });
    expect(result.current).toBeUndefined();

    rerender({ value: undefined });
    expect(result.current).toBe("defined");
  });

  it("should handle null values correctly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: null as string | null } },
    );

    expect(result.current).toBeUndefined();

    rerender({ value: "not null" });
    expect(result.current).toBeNull();

    rerender({ value: null });
    expect(result.current).toBe("not null");
  });

  it("should handle boolean values correctly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: true } },
    );

    expect(result.current).toBeUndefined();

    rerender({ value: false });
    expect(result.current).toBe(true);

    rerender({ value: true });
    expect(result.current).toBe(false);
  });

  it("should handle array values correctly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: [1, 2, 3] } },
    );

    expect(result.current).toBeUndefined();

    rerender({ value: [4, 5, 6] });
    expect(result.current).toEqual([1, 2, 3]);

    rerender({ value: [] });
    expect(result.current).toEqual([4, 5, 6]);
  });

  it("should handle empty strings correctly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: "" } },
    );

    expect(result.current).toBeUndefined();

    rerender({ value: "not empty" });
    expect(result.current).toBe("");

    rerender({ value: "" });
    expect(result.current).toBe("not empty");
  });

  it("should maintain reference stability for object values", () => {
    const firstObject = { a: 1 };
    const secondObject = { a: 2 };
    const thirdObject = { a: 3 };

    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: firstObject } },
    );

    expect(result.current).toBeUndefined();

    rerender({ value: secondObject });
    expect(result.current).toBe(firstObject);

    rerender({ value: thirdObject });
    expect(result.current).toBe(secondObject);
  });
});