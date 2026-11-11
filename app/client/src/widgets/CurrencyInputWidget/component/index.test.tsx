import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import CurrencyInputComponent, {
  type CurrencyInputComponentProps,
} from "./index";

const renderCurrencyInput = (
  props: Partial<CurrencyInputComponentProps> = {},
) => {
  const defaultProps: CurrencyInputComponentProps = {
    compactMode: false,
    currencyCode: "USD",
    disabled: false,
    inputHTMLType: "NUMBER",
    inputType: "CURRENCY",
    isInvalid: false,
    isLoading: false,
    label: "Salary",
    onCurrencyTypeChange: jest.fn(),
    onFocusChange: jest.fn(),
    onStep: jest.fn(),
    onValueChange: jest.fn(),
    renderMode: "CANVAS",
    showError: false,
    value: "",
    widgetId: "currency-input-widget",
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <CurrencyInputComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("CurrencyInputComponent required marker", () => {
  it("renders the required marker when isRequired is true", () => {
    renderCurrencyInput({ isRequired: true });

    expect(screen.getByLabelText("(required)")).toBeInTheDocument();
  });

  it("does not render the required marker when isRequired is false", () => {
    renderCurrencyInput({ isRequired: false });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
