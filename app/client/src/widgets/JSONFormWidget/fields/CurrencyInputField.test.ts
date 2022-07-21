import { CurrencyInputFieldProps, isValid } from "./CurrencyInputField";

describe("Currency Input Field", () => {
  it("return validity when not required", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      isRequired: false,
    } as CurrencyInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when required", () => {
    const inputs = [
      { value: "", expectedOutput: false },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      isRequired: true,
    } as CurrencyInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when validation is true", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      validation: true,
    } as CurrencyInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when validation is false", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: false },
      { value: "1", expectedOutput: false },
      { value: "-1", expectedOutput: false },
      { value: "1.2", expectedOutput: false },
      { value: "1.200", expectedOutput: false },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      validation: false,
    } as CurrencyInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when validation is false with required true", () => {
    const inputs = [
      { value: "", expectedOutput: false },
      { value: "0", expectedOutput: false },
      { value: "1", expectedOutput: false },
      { value: "-1", expectedOutput: false },
      { value: "1.2", expectedOutput: false },
      { value: "1.200", expectedOutput: false },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      validation: false,
      isRequired: true,
    } as CurrencyInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });
});
