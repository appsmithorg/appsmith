import { mutation_setPropertiesToUpdate } from "./helpers";

describe("auto height saga helpers", () => {
  it("When property exists, it should update correctly", () => {
    const propertiesToUpdate = {
      x: 50,
      y: "newValue",
    };
    const originalObject = {
      key1: [
        {
          propertyPath: "z",
          propertyValue: 20,
        },
      ],
    };
    const expectedResult = {
      key1: [
        {
          propertyPath: "z",
          propertyValue: 20,
        },
        {
          propertyPath: "x",
          propertyValue: 50,
        },
        {
          propertyPath: "y",
          propertyValue: "newValue",
        },
      ],
    };
    const result = mutation_setPropertiesToUpdate(
      originalObject,
      "key1",
      propertiesToUpdate,
    );

    expect(result).toStrictEqual(expectedResult);
  });
  it("When property does not exist, it should update correctly", () => {
    const propertiesToUpdate = {
      x: 50,
      y: "newValue",
    };
    const originalObject = {
      key1: [
        {
          propertyPath: "z",
          propertyValue: 20,
        },
      ],
    };
    const expectedResult = {
      key1: [
        {
          propertyPath: "z",
          propertyValue: 20,
        },
      ],
      key2: [
        {
          propertyPath: "x",
          propertyValue: 50,
        },
        {
          propertyPath: "y",
          propertyValue: "newValue",
        },
      ],
    };
    const result = mutation_setPropertiesToUpdate(
      originalObject,
      "key2",
      propertiesToUpdate,
    );

    expect(result).toStrictEqual(expectedResult);
  });
});
