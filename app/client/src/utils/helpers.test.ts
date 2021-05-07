import { flattenObject } from "./helpers";

describe("flattenObject test", () => {
  it("Check if non nested object is returned correctly", () => {
    const testObject = {
      isVisible: true,
      isDisabled: false,
      tableData: false,
    };

    expect(flattenObject(testObject)).toStrictEqual(testObject);
  });

  it("Check if nested objects are returned correctly", () => {
    const input = {
      isVisible: true,
      isDisabled: false,
      tableData: false,
      settings: {
        color: true,
      },
    };
    const output = {
      isVisible: true,
      isDisabled: false,
      tableData: false,
      "settings.color": true,
    };

    expect(flattenObject(input)).toStrictEqual(output);
  });
});
