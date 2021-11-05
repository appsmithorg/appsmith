import { getCamelCaseString, isArrayEqual } from "utils/AppsmithUtils";

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

describe("isArrayEqual", () => {
  it("Should return true if two arrays are equal, otherwise return false", () => {
    const inputs = [
      [
        [
          { a: 1, b: 2 },
          { b: 3, d: 4 },
        ],
        [{ a: 1, b: 2 }],
      ],
      [
        [
          { a: 1, b: 2 },
          { c: 3, d: 4 },
        ],
        [
          { b: 2, a: 1 },
          { d: 4, c: 3 },
        ],
      ],
      [
        [
          { a: 1, b: 2, c: 1 },
          { c: 3, d: 4 },
        ],
        [
          { b: 2, a: 1 },
          { d: 4, c: 3 },
        ],
      ],
    ];
    const expected = [false, true, false];
    inputs.forEach((input, index) => {
      const result = isArrayEqual(input[0], input[1]);
      expect(result).toStrictEqual(expected[index]);
    });
  });
});
