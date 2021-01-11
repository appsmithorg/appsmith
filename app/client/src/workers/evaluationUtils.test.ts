import { isChildPropertyPath } from "./evaluationUtils";

describe("isChildPropertyPath function", () => {
  it("works", () => {
    const cases: Array<[string, string, boolean]> = [
      ["Table1.selectedRow", "Table1.selectedRows", false],
      ["Table1.selectedRow", "Table1.selectedRow.email", true],
      ["Table1.selectedRow", "1Table1.selectedRow", false],
      ["Table1.selectedRow", "Table11selectedRow", false],
      ["Table1.selectedRow", "Table1.selectedRow", true],
    ];
    cases.forEach((testCase) => {
      const result = isChildPropertyPath(testCase[0], testCase[1]);
      expect(result).toBe(testCase[2]);
    });
  });
});
