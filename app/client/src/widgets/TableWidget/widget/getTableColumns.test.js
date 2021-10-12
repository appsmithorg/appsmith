import { getBooleanPropertyValue } from "./getTableColumns";

describe("Validates boolean ptoperties", () => {
  it("validates columns boolean ptoperties in different cases", () => {
    const input = [
      { value: "true", index: 1 },
      { value: "false", index: 1 },
      { value: true, index: 1 },
      { value: false, index: 1 },
      { value: {}, index: 1 },
      { value: [], index: 1 },
      { value: "", index: 1 },
      { value: null, index: 1 },
      { value: undefined, index: 1 },
      { value: [true, false, true], index: 2 },
      { value: [false, false, false], index: 1 },
    ];

    const expected = [
      true,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
    ];

    for (let index = 0; index < input.length; index++) {
      const currInput = input[index];
      let result = getBooleanPropertyValue(currInput.value, currInput.index);
      expect(result).toStrictEqual(expected[index]);
    }
  });
});
