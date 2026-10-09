import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import PhoneInputComponent, { type PhoneInputComponentProps } from "./index";

const renderPhoneInput = (props: Partial<PhoneInputComponentProps> = {}) => {
  const defaultProps: PhoneInputComponentProps = {
    allowDialCodeChange: false,
    compactMode: false,
    dialCode: "+1",
    disabled: false,
    inputHTMLType: "TEL",
    inputType: "PHONE_NUMBER",
    isInvalid: false,
    isLoading: false,
    label: "Phone",
    onFocusChange: jest.fn(),
    onISDCodeChange: jest.fn(),
    onValueChange: jest.fn(),
    showError: false,
    value: "",
    widgetId: "phone-input-widget",
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <PhoneInputComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("PhoneInputComponent required marker", () => {
  it("renders the required marker when isRequired is true", () => {
    renderPhoneInput({ isRequired: true });

    expect(screen.getByLabelText("(required)")).toBeInTheDocument();
  });

  it("does not render the required marker when isRequired is false", () => {
    renderPhoneInput({ isRequired: false });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
