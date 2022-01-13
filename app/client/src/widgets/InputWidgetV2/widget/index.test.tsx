import { defaultValueValidation, InputWidgetProps } from "./index";
import _ from "lodash";

describe("defaultValueValidation", () => {
  let result: any;

  it("should validate defaulttext of text type", () => {
    result = defaultValueValidation(
      "text",
      { inputType: "TEXT" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "text",
      messages: [""],
    });

    result = defaultValueValidation(
      1,
      { inputType: "TEXT" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "1",
      messages: [""],
    });
  });

  it("should validate defaulttext of Number type", () => {
    result = defaultValueValidation(
      1,
      { inputType: "NUMBER" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: 1,
      messages: [""],
    });

    result = defaultValueValidation(
      "test",
      { inputType: "NUMBER" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: false,
      parsed: undefined,
      messages: ["This value must be number"],
    });
  });

  it("should validate defaulttext of Email type", () => {
    result = defaultValueValidation(
      "test@appsmith.com",
      { inputType: "EMAIL" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "test@appsmith.com",
      messages: [""],
    });

    result = defaultValueValidation(
      1,
      { inputType: "EMAIL" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "1",
      messages: [""],
    });
  });

  it("should validate defaulttext of Password type", () => {
    result = defaultValueValidation(
      "admin123",
      { inputType: "PASSWORD" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "admin123",
      messages: [""],
    });

    result = defaultValueValidation(
      1,
      { inputType: "PASSWORD" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "1",
      messages: [""],
    });
  });

  it("should validate defaulttext with type missing", () => {
    result = defaultValueValidation(
      "admin123",
      { inputType: "" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: false,
      parsed: "",
      messages: ["This value must be string"],
    });
  });

  it("should validate defaulttext with object value", () => {
    const value = {};
    result = defaultValueValidation(
      value,
      { inputType: "" } as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: ["This value must be string"],
    });
  });
});
