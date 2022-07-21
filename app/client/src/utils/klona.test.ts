import isEqual from "lodash/isEqual";
import { klona } from "klona/full";
import moment from "moment";

describe("Klona clone test", () => {
  it("Strings, Booleans, numbers, null & undefined values", () => {
    const input: {
      meta: {
        stringLiteral: string;
        string: string;
        boolean: boolean;
        number: number;
        nan: number;
        null: null | string;
        undefined: undefined | number;
      };
    } = {
      meta: {
        stringLiteral: "abc",
        string: String("ABC"),
        boolean: true,
        number: Number(45),
        nan: NaN,
        null: null,
        undefined: undefined,
      },
    };

    const expected: Record<string, unknown> = {
      meta: {
        stringLiteral: "abc",
        string: String("ABC"),
        boolean: true,
        number: Number(45),
        nan: NaN,
        null: null,
        undefined: undefined,
      },
    };
    const result = klona(input);

    // mutate
    input.meta.string = "hello1";
    input.meta.boolean = false;
    input.meta.number = Number(89);
    input.meta.null = "efewf";
    input.meta.undefined = NaN;

    expect(isEqual(expected, result)).toEqual(true);
  });

  it("Dates and regex values", () => {
    const currentDate = new Date();
    const currentMoment = moment();
    const input = {
      meta: {
        date: currentDate,
        moment: currentMoment,
        regex: /^abc$/g,
        regexExp: new RegExp(/^abc$/),
      },
    };

    const expected = {
      meta: {
        date: currentDate,
        moment: currentMoment,
        regex: /^abc$/g,
        regexExp: new RegExp(/^abc$/),
      },
    };
    const result = klona(input);

    // mutate
    input.meta.date = new Date(327392879);
    input.meta.moment = moment();
    input.meta.regex = /^def$/g;
    input.meta.regexExp = new RegExp(/^def$/);

    expect(isEqual(expected, result)).toEqual(true);
  });

  it("Objects and Arrays values", () => {
    function getNestedArray() {
      return ["foo", [1, 2, ["hello", "world"], 3], "bar", "baz", {}];
    }

    function getNestedObject() {
      return {
        Input: { text: "abc" },
      };
    }

    const objectWithMethod = Object.create({
      method() {
        return "hello";
      },
    });

    const input = {
      meta: {
        nestedArray: [...getNestedArray()],
        objectWithMethod,
        nestedObject: { ...getNestedObject() },
      },
    };

    const expected = {
      meta: {
        nestedArray: [...getNestedArray()],
        objectWithMethod,
        nestedObject: { ...getNestedObject() },
      },
    };

    const result = klona(input);

    // mutate
    input.meta.nestedArray[0] = "abc";
    input.meta.nestedArray[1] = { a: "bc" };
    input.meta.nestedObject.Input.text = "hello";

    expect(
      isEqual(expected.meta.nestedArray[0], result.meta.nestedArray[0]),
    ).toEqual(true);

    expect(
      isEqual(expected.meta.nestedArray[1], result.meta.nestedArray[1]),
    ).toEqual(true);

    expect(
      isEqual(
        expected.meta.objectWithMethod.method(),
        result.meta.objectWithMethod.method(),
      ),
    ).toEqual(true);

    expect(
      isEqual(
        expected.meta.nestedObject.Input.text,
        result.meta.nestedObject.Input.text,
      ),
    ).toEqual(true);
  });

  it("Functions, Pollutions and Classes values", () => {
    const fn = async () => {
      return "hello";
    };
    const input = {
      fn,
    };

    const expected = {
      fn,
    };
    const result = klona(input);

    expect(expected.fn === result.fn).toEqual(true);
  });

  it("Maps and Sets values", () => {
    const map = new Map();
    const set = new Set();

    map.set("abc", "value");
    set.add("1");
    set.add("2");

    const input = { map, set };

    const result = klona(input);

    // changes after clone
    input.map.set("1", "value1");
    input.map.set("2", "value1");

    expect(result.map.get("abc")).toStrictEqual("value");
    expect(result.map.get("1")).toStrictEqual(undefined);
    expect(result.map.get("2")).toStrictEqual(undefined);

    // add new value and verify it is not present in cloned set
    set.add("3");
    expect(result.set.has("3")).toStrictEqual(false);
    // delete a value and verify it is still present in cloned set
    set.delete("2");
    expect(result.set.has("2")).toStrictEqual(true);
  });

  it("TypedArrays values", () => {
    const int16Array = new Int16Array([42]);
    const buf = new ArrayBuffer(8);
    const int32Array = new Int32Array(buf);

    const resultInt16Array = klona(int16Array);
    const resultInt32Array = klona(int32Array);

    // add value at 1st index and verify cloned value doesn't contain it.
    resultInt16Array[1] = 42;
    expect(int16Array[1]).toStrictEqual(undefined);
    expect(int16Array[0]).toStrictEqual(42);

    expect(resultInt32Array[1]).toStrictEqual(0);
  });

  it("Symbols and Descriptors values", () => {
    // Symbol
    const key = Symbol("key");
    const input = { foo: 123, [key]: 456 };
    const result = klona(input);

    expect(result[key]).toStrictEqual(456);

    // Descriptor
    const inputDesc = { foo: 123 };
    Object.defineProperty(inputDesc, "bar", {
      enumerable: false,
      value: [1, 2, 3],
    });
    const outputDesc = klona(inputDesc);
    expect(Object.getOwnPropertyDescriptor(outputDesc, "bar")).toStrictEqual({
      enumerable: false,
      configurable: false,
      writable: false,
      value: [1, 2, 3],
    });
  });
});
