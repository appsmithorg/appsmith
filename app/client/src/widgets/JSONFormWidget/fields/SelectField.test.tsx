import { isValid, SelectFieldProps } from "./SelectField";

describe(".isValid", () => {
  it("returns true when isRequired is false", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: 0, expectedOutput: true },
      { value: 1, expectedOutput: true },
      { value: -1, expectedOutput: true },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      isRequired: false,
    } as SelectFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("returns true when isRequired is true and value is valid", () => {
    const inputs = [
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: 0, expectedOutput: true },
      { value: 1, expectedOutput: true },
      { value: -1, expectedOutput: true },
    ];
    const schemaItem = {
      isRequired: true,
    } as SelectFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("returns false when isRequired is true and value is invalid", () => {
    const inputs = [
      { value: "", expectedOutput: false },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      isRequired: true,
    } as SelectFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });
});
