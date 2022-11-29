import { cleanSet } from "../cleanSet";

describe("Test cleanSet method", () => {
  it("Assert source references are not mutated and property is set as expected", () => {
    const sourceObj = {
      a: {
        b: { c: "hello" },
      },
      d: { name: "" },
    };

    const targetObject = { ...sourceObj };
    cleanSet(targetObject, "a.b.c", "Welcome to appsmith");

    expect(targetObject.a.b.c).toEqual("Welcome to appsmith");
    expect(sourceObj.a.b.c).toEqual("hello");
    expect(sourceObj.a.b === targetObject.a.b).toEqual(false);
    expect(sourceObj.a === targetObject.a).toEqual(false);
    expect(sourceObj.a === targetObject.a).toEqual(false);
    expect(sourceObj === targetObject).toEqual(false);
  });
});
