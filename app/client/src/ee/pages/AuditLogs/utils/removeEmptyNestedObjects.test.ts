import { removeEmptyNestedObjects } from "./removeEmptyNestedObjects";

describe("audit-logs/utils/removeEmptyNestedObjects", () => {
  it("returns object as it is if there are no keys with empty object values", () => {
    const object = {
      a: "a",
      b: { c: "c" },
      d: [1, 2, "3"],
    };
    const actual = removeEmptyNestedObjects(object);
    const expected = { ...object };
    expect(actual).toEqual(expected);
  });
  it("returns object after removing keys with empty object values", () => {
    const object = {
      a: "a",
      b: { c: "c" },
      d: [1, 2, "3"],
      e: {} /* removed because empty object */,
      f: [] /* removed because empty object; Arrays are objects */,
      g: 0,
      h: "",
      i: new Set() /* removed because empty object; Sets are objects */,
    };
    const actual = removeEmptyNestedObjects(object);
    const expected = {
      a: "a",
      b: { c: "c" },
      d: [1, 2, "3"],
      g: 0,
      h: "",
    };
    expect(actual).toEqual(expected);
  });
});
