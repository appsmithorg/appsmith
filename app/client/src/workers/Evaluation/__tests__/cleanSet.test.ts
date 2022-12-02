import { cleanSet } from "../cleanSet";

describe("Test cleanSet method", () => {
  it("Assert source references are not mutated and property is set as expected", () => {
    const sourceObj = {
      a: {
        b: { c: "hello" },
      },
      d: { name: "" },
    };

    const resultObj = cleanSet(sourceObj, "a.b.c", "Welcome to appsmith");

    expect(resultObj.a.b.c).toEqual("Welcome to appsmith");
    expect(sourceObj.a.b.c).toEqual("hello");
    expect(sourceObj.a.b === resultObj.a.b).toEqual(false);
    expect(sourceObj.a === resultObj.a).toEqual(false);
    expect(sourceObj.a === resultObj.a).toEqual(false);
    expect(sourceObj === resultObj).toEqual(false);
  });
});
