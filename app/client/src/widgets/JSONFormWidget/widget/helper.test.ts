import { getGrandParentPropertyPath, getParentPropertyPath } from "./helper";

describe(".getParentPropertyPath", () => {
  it("returns parent path", () => {
    const inputs = ["", "a.b.c", "a", "a.b"];
    const expectedOutputs = ["", "a.b", "", "a"];

    inputs.forEach((input, index) => {
      const result = getParentPropertyPath(input);

      expect(result).toEqual(expectedOutputs[index]);
    });
  });
});

describe(".getGrandParentPropertyPath", () => {
  it("returns parent path", () => {
    const inputs = ["", "a.b.c", "a", "a.b", "a.b.c.d"];
    const expectedOutputs = ["", "a", "", "", "a.b"];

    inputs.forEach((input, index) => {
      const result = getGrandParentPropertyPath(input);

      expect(result).toEqual(expectedOutputs[index]);
    });
  });
});
