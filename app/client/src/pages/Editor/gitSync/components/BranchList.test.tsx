import "@testing-library/jest-dom";
import { removeSpecialChars } from "./BranchList";

describe("Remove special characters from Branch name", () => {
  it("it should replace special characters except / and - with _", () => {
    const inputs = [
      "abc_def",
      "abc-def",
      "abc*def",
      "abc/def",
      "abc&def",
      "abc%def",
      "abc#def",
      "abc@def",
      "abc!def",
      "abc,def",
      "abc<def",
      "abc>def",
      "abc?def",
      "abc.def",
      "abc;def",
      "abc(def",
    ];

    const expected = [
      "abc_def",
      "abc-def",
      "abc_def",
      "abc/def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
      "abc_def",
    ];

    inputs.forEach((input, index) => {
      const result = removeSpecialChars(input);
      expect(result).toStrictEqual(expected[index]);
    });
  });
});
