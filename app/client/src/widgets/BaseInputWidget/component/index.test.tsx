import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import BaseInputComponent, {
  normalizeNumericInputValue,
  type BaseInputComponentProps,
} from "./index";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";

const renderBaseInputComponent = (
  props: Partial<BaseInputComponentProps> = {},
) => {
  const defaultProps: BaseInputComponentProps = {
    value: "",
    inputType: "TEXT",
    inputHTMLType: "TEXT",
    disabled: false,
    isLoading: false,
    compactMode: false,
    isInvalid: false,
    label: "Salary",
    showError: false,
    onValueChange: jest.fn(),
    onFocusChange: jest.fn(),
    widgetId: "test-widget",
    rtl: true,
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <BaseInputComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("BaseInputComponent TestCases", () => {
  test("1. Icon should be visible and aligned to the right when the input type is a number", () => {
    const { container } = renderBaseInputComponent({
      inputType: "NUMBER",
      inputHTMLType: "NUMBER",
      value: "123",
      onStep: jest.fn(),
      rtl: false,
      shouldUseLocale: true,
      iconName: "add",
      iconAlign: "right",
    });

    const numericInputIcon = container.getElementsByClassName(
      "bp3-icon bp3-icon-add",
    )[0];

    expect(numericInputIcon).toBeInTheDocument();
  });

  test("2. Numeric input should have inputmode attribute set to decimal", () => {
    const { container } = renderBaseInputComponent({
      inputType: "NUMBER",
      inputHTMLType: "NUMBER",
      value: "123",
    });

    const inputElement = container.querySelector("input");

    expect(inputElement).toHaveAttribute("inputmode", "decimal");
  });

  test("3. Numeric input normalizes alternate decimal separator on change and allows it on keyPress", () => {
    const onValueChange = jest.fn();
    const { container } = renderBaseInputComponent({
      inputType: "CURRENCY",
      inputHTMLType: "NUMBER",
      shouldUseLocale: true,
      value: "12",
      onValueChange,
    });

    const inputElement = container.querySelector("input")!;
    const commaEventNotCancelled = fireEvent.keyPress(inputElement, {
      key: ",",
      charCode: 44,
    });

    expect(commaEventNotCancelled).toBe(true);

    const alphaEventNotCancelled = fireEvent.keyPress(inputElement, {
      key: "a",
      charCode: 97,
    });

    expect(alphaEventNotCancelled).toBe(false);

    fireEvent.change(inputElement, { target: { value: "12,34" } });

    expect(onValueChange).toHaveBeenCalledWith("12.34");
  });

  test("4. Currency input with comma locale accepts dot keypad input and normalizes to comma", () => {
    const languagesSpy = jest
      .spyOn(window.navigator, "languages", "get")
      .mockReturnValue(["de-DE"]);
    const onValueChange = jest.fn();

    try {
      const { container } = renderBaseInputComponent({
        inputType: "CURRENCY",
        inputHTMLType: "NUMBER",
        shouldUseLocale: true,
        value: "12",
        onValueChange,
      });

      const inputElement = container.querySelector("input")!;
      const dotEventNotCancelled = fireEvent.keyPress(inputElement, {
        key: ".",
        charCode: 46,
      });

      expect(dotEventNotCancelled).toBe(true);

      fireEvent.change(inputElement, { target: { value: "12.34" } });

      expect(onValueChange).toHaveBeenCalledWith("12,34");
    } finally {
      languagesSpy.mockRestore();
    }
  });
});

describe("normalizeNumericInputValue", () => {
  it("maps a single alternate comma separator to dot when dot is expected", () => {
    expect(normalizeNumericInputValue("12,", ".", "en-US")).toBe("12.");
    expect(normalizeNumericInputValue("12,34", ".", "en-US")).toBe("12.34");
    expect(normalizeNumericInputValue("12.3,", ".", "en-US")).toBe("12.3");
    expect(normalizeNumericInputValue("1,234.56", ".", "en-US")).toBe(
      "1234.56",
    );
    expect(normalizeNumericInputValue("1,234,567", ".", "en-US")).toBe(
      "1234567",
    );
    expect(normalizeNumericInputValue("12abc,5", ".", "en-US")).toBe("12.5");
  });

  it("maps a single alternate dot separator to comma when comma is expected", () => {
    expect(normalizeNumericInputValue("12.", ",", "de-DE")).toBe("12,");
    expect(normalizeNumericInputValue("12.34", ",", "de-DE")).toBe("12,34");
    expect(normalizeNumericInputValue("12,3.", ",", "de-DE")).toBe("12,3");
    expect(normalizeNumericInputValue("1.234,56", ",", "de-DE")).toBe(
      "1234,56",
    );
  });
});
