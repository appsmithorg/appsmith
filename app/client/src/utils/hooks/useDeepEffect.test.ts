import { renderHook } from "@testing-library/react-hooks";
import { useState } from "react";

import useDeepEffect from "./useDeepEffect";

describe(".useDeepEffect", () => {
  it("throws an error if using it with an empty array", () => {
    const { result } = renderHook(() =>
      useDeepEffect(() => {
        "test";
      }, []),
    );
    expect(result.error).toMatchInlineSnapshot(
      `[Error: useDeepEffect should not be used with no dependencies. Use React.useEffect instead.]`,
    );
  });

  it("throws an error if using it with an array of only primitive values", () => {
    const { result } = renderHook(() =>
      useDeepEffect(() => {
        "test";
      }, [true, 1, "string"]),
    );
    expect(result.error).toMatchInlineSnapshot(
      `[Error: useDeepEffect should not be used with dependencies that are all primitive values. Use React.useEffect instead.]`,
    );
  });

  it("production mode there are no errors thrown", () => {
    const env = process.env.NODE_ENV;
    // @ts-expect-error: Types are not available
    process.env.NODE_ENV = "production";
    renderHook(() =>
      useDeepEffect(() => {
        "";
      }, [true, 1, "string"]),
    );
    renderHook(() =>
      useDeepEffect(() => {
        "";
      }, []),
    );
    // @ts-expect-error: Types are not available
    process.env.NODE_ENV = env;
  });

  it("handles changing values as expected", () => {
    const callback = jest.fn();
    let deps = [1, { a: "b" }, true];
    const { rerender } = renderHook(() => useDeepEffect(callback, deps));

    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    // no change
    rerender();
    expect(callback).toHaveBeenCalledTimes(0);
    callback.mockClear();

    // no-change (new object with same properties)
    deps = [1, { a: "b" }, true];
    rerender();
    expect(callback).toHaveBeenCalledTimes(0);
    callback.mockClear();

    // change (new primitive value)
    deps = [2, { a: "b" }, true];
    rerender();
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    // no-change
    rerender();
    expect(callback).toHaveBeenCalledTimes(0);
    callback.mockClear();

    // change (new primitive value)
    deps = [1, { a: "b" }, false];
    rerender();
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    // change (new properties on object)
    deps = [1, { a: "c" }, false];
    rerender();
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();
  });

  it("works with deep object similarities/differences", () => {
    const callback = jest.fn();
    let deps: Array<Record<string, unknown>> = [{ a: { b: { c: "d" } } }];
    const { rerender } = renderHook(() => useDeepEffect(callback, deps));
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    // change primitive value
    deps = [{ a: { b: { c: "e" } } }];
    rerender();
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    // no-change
    deps = [{ a: { b: { c: "e" } } }];
    rerender();
    expect(callback).toHaveBeenCalledTimes(0);
    callback.mockClear();

    // add property
    deps = [{ a: { b: { c: "e" }, f: "g" } }];
    rerender();
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();
  });

  it("works with getDerivedStateFromProps", () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ a }: { a: number }) => {
        const [lastA, setLastA] = useState(a);
        const [c, setC] = useState(5);
        if (lastA !== a) {
          setLastA(a);
          setC(1);
        }
        useDeepEffect(callback, [{ a, c }]);
      },
      { initialProps: { a: 1 } },
    );
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    // change a, and reset c
    rerender({ a: 2 });
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();
  });
});
