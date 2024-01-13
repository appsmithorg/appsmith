import { fn_keys, stringifyFnsInObject } from "./helpers";

describe("stringifyFnsInObject", () => {
  it("includes full path of key having a function in the parent object", () => {
    const obj = {
      key1: "value",
      key2: {
        key3: {
          fnKey: () => {},
        },
      },
    };
    const result = stringifyFnsInObject(obj);

    expect(result[fn_keys]).toEqual(["key2.key3.fnKey"]);
    expect(result).toEqual({
      __fn_keys__: ["key2.key3.fnKey"],
      key1: "value",
      key2: {
        key3: {
          fnKey: "() => { }",
        },
      },
    });
  });

  it("includes an array index if a function is present inside an array", () => {
    const obj = {
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", () => {}, "string3"],
        },
      },
    };
    const result = stringifyFnsInObject(obj);

    expect(result[fn_keys]).toEqual(["key2.key3.key4.[1]"]);
    expect(result).toEqual({
      __fn_keys__: ["key2.key3.key4.[1]"],
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", "() => { }", "string3"],
        },
      },
    });
  });

  it("includes an array index if a function is present inside a nested object inside an array", () => {
    const obj = {
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", { key5: () => {}, key6: "value" }, "string3"],
        },
      },
    };
    const result = stringifyFnsInObject(obj);

    expect(result[fn_keys]).toEqual(["key2.key3.key4.[1].key5"]);
    expect(result).toEqual({
      __fn_keys__: ["key2.key3.key4.[1].key5"],
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", { key5: "() => { }", key6: "value" }, "string3"],
        },
      },
    });
  });

  it("includes a nested array index if a function is present inside a nested array inside an array", () => {
    const obj = {
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", [() => {}], "string3"],
        },
      },
    };
    const result = stringifyFnsInObject(obj);

    expect(result[fn_keys]).toEqual(["key2.key3.key4.[1].[0]"]);
    expect(result).toEqual({
      __fn_keys__: ["key2.key3.key4.[1].[0]"],
      key1: "value",
      key2: {
        key3: {
          key4: ["string1", ["() => { }"], "string3"],
        },
      },
    });
  });
});
