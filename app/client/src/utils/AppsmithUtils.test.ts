import { areArraysEqual, getCamelCaseString } from "utils/AppsmithUtils";

describe("getCamelCaseString", () => {
  it("Should return a string in camelCase", () => {
    const inputs = ["abcd", "ab12cd", "开关", "😃 😃 😃"];
    const expected = ["abcd", "ab12Cd", "", ""];

    inputs.forEach((input, index) => {
      const result = getCamelCaseString(input);
      expect(result).toStrictEqual(expected[index]);
    });
  });
});

describe("test areArraysEqual", () => {
  it("test areArraysEqual method", () => {
    const OGArray = ["test1", "test2", "test3"];

    let testArray: string[] = [];
    expect(areArraysEqual(OGArray, testArray)).toBe(false);

    testArray = ["test1", "test3"];
    expect(areArraysEqual(OGArray, testArray)).toBe(false);

    testArray = ["test1", "test2", "test3"];
    expect(areArraysEqual(OGArray, testArray)).toBe(true);

    testArray = ["test1", "test3", "test2"];
    expect(areArraysEqual(OGArray, testArray)).toBe(true);
  });
});
