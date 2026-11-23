import { InputTypes } from "widgets/BaseInputWidget/constants";
import { parseText, validateInput } from "./helper";
import type { InputWidgetProps } from "./types";

describe("getParsedText", () => {
  it("should test with all possible values", () => {
    let text;

    text = parseText("test", InputTypes.TEXT);
    expect(text).toBe("test");

    text = parseText("test1", InputTypes.PASSWORD);
    expect(text).toBe("test1");

    text = parseText("test@appsmith.com", InputTypes.EMAIL);
    expect(text).toBe("test@appsmith.com");

    text = parseText("", InputTypes.NUMBER);
    expect(text).toBe(null);

    text = parseText(undefined as unknown as string, InputTypes.NUMBER);
    expect(text).toBe(null);

    text = parseText(null as unknown as string, InputTypes.NUMBER);
    expect(text).toBe(null);

    text = parseText(1 as unknown as string, InputTypes.NUMBER);
    expect(text).toBe(1);

    text = parseText("1.01", InputTypes.NUMBER);
    expect(text).toBe(1.01);

    text = parseText("1.00", InputTypes.NUMBER);
    expect(text).toBe(1);
  });
});

describe("validateInput", () => {
  const props = {
    inputType: InputTypes.NUMBER,
    isDirty: true,
    isRequired: false,
    minNum: 0,
    maxNum: 10,
  } as InputWidgetProps;

  it.each([
    [-1, "Value must be greater than or equal to 0"],
    [11, "Value must be less than or equal to 10"],
  ])("shows a runtime range error for %s", (text, errorMessage) => {
    expect(
      validateInput({
        ...props,
        text: text as unknown as string,
        rawText: String(text),
      }),
    ).toEqual({
      validationStatus: "invalid",
      errorMessage,
    });
  });

  it("shows a sentence case type mismatch error for letters", () => {
    expect(
      validateInput({
        ...props,
        text: null as unknown as string,
        rawText: "abc",
      }),
    ).toEqual({
      validationStatus: "invalid",
      errorMessage: "Type mismatch. Please enter a valid value",
    });
  });

  it.each([0, 5, 10])("accepts an in-range value of %s", (text) => {
    expect(
      validateInput({
        ...props,
        text: text as unknown as string,
        rawText: String(text),
      }),
    ).toEqual({
      validationStatus: "valid",
      errorMessage: "",
    });
  });

  it("accepts an empty optional number", () => {
    expect(
      validateInput({ ...props, text: null as unknown as string, rawText: "" }),
    ).toEqual({
      validationStatus: "valid",
      errorMessage: "",
    });
  });
});
