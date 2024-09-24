import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import BaseInputComponent, { type BaseInputComponentProps } from "./index";
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
});
