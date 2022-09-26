import { FieldType } from "../constants";
import { InputFieldProps, isValid } from "./InputField";

describe("Input Field - Number", () => {
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
      fieldType: FieldType.NUMBER_INPUT,
    } as InputFieldProps["schemaItem"];

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
      fieldType: FieldType.NUMBER_INPUT,
    } as InputFieldProps["schemaItem"];

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
      fieldType: FieldType.NUMBER_INPUT,
    } as InputFieldProps["schemaItem"];

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
      fieldType: FieldType.NUMBER_INPUT,
    } as InputFieldProps["schemaItem"];

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
      fieldType: FieldType.NUMBER_INPUT,
    } as InputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });
});

describe("Input Field - Text/Password/Multiline", () => {
  it("return validity when not required", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      isRequired: false,
      fieldType: FieldType.TEXT_INPUT,
    } as InputFieldProps["schemaItem"];

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
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      isRequired: true,
      fieldType: FieldType.TEXT_INPUT,
    } as InputFieldProps["schemaItem"];

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
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      validation: true,
      fieldType: FieldType.TEXT_INPUT,
    } as InputFieldProps["schemaItem"];

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
      fieldType: FieldType.TEXT_INPUT,
    } as InputFieldProps["schemaItem"];

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
      fieldType: FieldType.TEXT_INPUT,
    } as InputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });
});

describe("Input Field - Email", () => {
  it("return validity when not required", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: false },
      { value: "1", expectedOutput: false },
      { value: "-1", expectedOutput: false },
      { value: "1.2", expectedOutput: false },
      { value: "1.200", expectedOutput: false },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: "test@demo.com", expectedOutput: true },
      { value: "test@demo.c", expectedOutput: false },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      isRequired: false,
      fieldType: FieldType.EMAIL_INPUT,
    } as InputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when required", () => {
    const inputs = [
      { value: "", expectedOutput: false },
      { value: "0", expectedOutput: false },
      { value: "1", expectedOutput: false },
      { value: "-1", expectedOutput: false },
      { value: "1.2", expectedOutput: false },
      { value: "1.200", expectedOutput: false },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: "test@demo.com", expectedOutput: true },
      { value: "test@demo.c", expectedOutput: false },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      isRequired: true,
      fieldType: FieldType.EMAIL_INPUT,
    } as InputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when validation is true", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: false },
      { value: "1", expectedOutput: false },
      { value: "-1", expectedOutput: false },
      { value: "1.2", expectedOutput: false },
      { value: "1.200", expectedOutput: false },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: "test@demo.com", expectedOutput: true },
      { value: "test@demo.c", expectedOutput: false },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      validation: true,
      fieldType: FieldType.EMAIL_INPUT,
    } as InputFieldProps["schemaItem"];

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
      { value: "test@demo.com", expectedOutput: false },
      { value: "test@demo.c", expectedOutput: false },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      validation: false,
      fieldType: FieldType.EMAIL_INPUT,
    } as InputFieldProps["schemaItem"];

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
      { value: "test@demo.com", expectedOutput: false },
      { value: "test@demo.c", expectedOutput: false },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      validation: false,
      isRequired: true,
      fieldType: FieldType.EMAIL_INPUT,
    } as InputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);
      expect(result).toEqual(input.expectedOutput);
    });
  });
});
