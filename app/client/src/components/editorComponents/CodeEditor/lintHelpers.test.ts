import {
  getKeyPositionInString,
  getLintAnnotations,
  getAllOccurences,
} from "./lintHelpers";

describe("getAllOccurences()", function() {
  it("should get all the indexes", () => {
    const res = getAllOccurences("this is a `this` string", "this");
    expect(res).toEqual([0, 11]);
  });

  it("should return empty array", () => {
    expect(getAllOccurences("this is a string", "number")).toEqual([]);
  });
});

describe("getKeyPositionsInString()", () => {
  it("should return results for single line string", () => {
    const res = getKeyPositionInString("this is a `this` string", "this");
    expect(res).toEqual([
      { line: 0, ch: 0 },
      { line: 0, ch: 11 },
    ]);
  });

  it("should return results for multiline string", () => {
    const res = getKeyPositionInString("this is a \n`this` string", "this");
    expect(res).toEqual([
      { line: 0, ch: 0 },
      { line: 1, ch: 1 },
    ]);
  });
});
