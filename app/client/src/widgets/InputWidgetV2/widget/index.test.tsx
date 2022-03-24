import {
  defaultValueValidation,
  InputWidgetProps,
  minValueValidation,
  maxValueValidation,
} from "./index";
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
      parsed: null,
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
      ({ inputType: "" } as any) as InputWidgetProps,
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
      ({ inputType: "" } as any) as InputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: ["This value must be string"],
    });
  });
});

describe("minValueValidation - ", () => {
  it("should return true if minNum is empty", () => {
    expect(
      minValueValidation("", { maxNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeTruthy();

    expect(
      minValueValidation(null, { maxNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeTruthy();
  });

  it("should return false if minNum is not a valid number", () => {
    expect(
      minValueValidation("test", { maxNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeFalsy();
  });

  it("should return false if minNum is not lesser than maxNum", () => {
    expect(
      minValueValidation("11", { maxNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeFalsy();
  });

  it("should return true if minNum is a finite number and lesser than maxNum", () => {
    expect(
      minValueValidation("1", { maxNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeTruthy();
  });
});

describe("maxValueValidation - ", () => {
  it("should return true if maxNum is empty", () => {
    expect(
      maxValueValidation("", { minNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeTruthy();

    expect(
      maxValueValidation(null, { minNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeTruthy();
  });

  it("should return false if maxNum is not a valid number", () => {
    expect(
      maxValueValidation("test", { minNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeFalsy();
  });

  it("should return false if maxNum is not greater than minNum", () => {
    expect(
      maxValueValidation("9", { minNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeFalsy();
  });

  it("should return true if maxNum is a finite number and lesser than minNum", () => {
    expect(
      maxValueValidation("18", { minNum: 10 } as InputWidgetProps, _ as any)
        .isValid,
    ).toBeTruthy();
  });
});
