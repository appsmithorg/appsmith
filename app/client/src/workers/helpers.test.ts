import { findDuplicateIndex } from "./helpers";

describe("Worker Helper functions test", () => {
  it("Correctly finds the duplicate index in an array of strings", () => {
    const input = ["a", "b", "c", "d", "e", "a", "b"];
    const expected = 5;
    const result = findDuplicateIndex(input);
    expect(result).toStrictEqual(expected);
  });
  it("Correctly finds the duplicate index in an array of objects and strings", () => {
    const input = [
      "a",
      "b",
      { a: 1, b: 2 },
      { a: 2, b: 3 },
      "e",
      { a: 1, b: 2 },
      "b",
    ];
    const expected = 5;
    const result = findDuplicateIndex(input);
    expect(result).toStrictEqual(expected);
  });

  /* TODO(abhinav): These kinds of issues creep up when dealing with JSON.stringify to make
                    things simple. So, the ideal solution here is to prevent the
                    usage of this function for array of objects
                    */
  it("Correctly ignores the duplicate index in an array of objects and strings, when properties are not ordered", () => {
    const input = [
      "a",
      "b",
      { a: 1, b: 2 },
      { a: 2, b: 3 },
      "e",
      { b: 2, a: 1 },
      "b",
    ];
    const expected = 6;
    const result = findDuplicateIndex(input);
    expect(result).toStrictEqual(expected);
  });
  it("Correctly returns -1 if no duplicates are found", () => {
    const input = ["a", "b", "c", "d", "e", "f", "g"];
    const expected = -1;
    const result = findDuplicateIndex(input);
    expect(result).toStrictEqual(expected);
  });
});
