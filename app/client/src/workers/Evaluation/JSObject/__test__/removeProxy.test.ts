import { addPatch, jsObjectProxyHandler } from "../JSVariableProxy";
import { removeProxyObject } from "../removeProxy";

describe("remove Proxy method", () => {
  it("proxy inside nested object", () => {
    const obj = {
      a: 1,
      b: 2,
      c: {
        d: {
          e: {
            f: new Proxy(
              { a: "hello world" },
              jsObjectProxyHandler(addPatch, ""),
            ),
          },
        },
      },
    };

    const result = removeProxyObject(obj);
    expect(result.c.d.e.f).toEqual({ a: "hello world" });
  });

  it("proxy inside nested array", () => {
    const proxiedValue = new Proxy([], jsObjectProxyHandler(addPatch, ""));
    const testValue = [1, 2, 3, [4, 5, 6, [7, 8, 9, proxiedValue]]];

    const result = removeProxyObject(testValue);
    expect(result[3][3][3]).toEqual([]);
    expect(result[3][3][3].$isProxy).toEqual(undefined);
  });

  it("proxied date object", () => {
    const date = new Date();
    const proxiedValue = new Proxy(date, jsObjectProxyHandler(addPatch, ""));
    const testValue = [1, 2, 3, [4, 5, 6, [7, 8, 9, proxiedValue]]];

    const result = removeProxyObject(testValue);
    expect(result[3][3][3]).toEqual(date);
    expect(result[3][3][3].$isProxy).toEqual(undefined);
  });

  it("proxied map object", () => {
    const map = new Map();
    const proxiedValue = new Proxy(map, jsObjectProxyHandler(addPatch, ""));
    const testValue = [1, 2, 3, [4, 5, 6, [7, 8, 9, proxiedValue]]];

    const result = removeProxyObject(testValue);
    expect(result[3][3][3]).toEqual(map);
    expect(result[3][3][3].$isProxy).toEqual(undefined);
  });

  it("proxied set object", () => {
    const set = new Set();
    const proxiedValue = new Proxy(set, jsObjectProxyHandler(addPatch, ""));
    const testValue = [1, 2, 3, [4, 5, 6, [7, 8, 9, proxiedValue]]];

    const result = removeProxyObject(testValue);
    expect(result[3][3][3]).toEqual(set);
    expect(result[3][3][3].$isProxy).toEqual(undefined);
  });
});
