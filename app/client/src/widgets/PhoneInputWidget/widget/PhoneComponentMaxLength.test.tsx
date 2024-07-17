import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import type { PhoneInputComponentProps } from "../component";
import PhoneInputComponent from "../component";
import _ from "lodash";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import store from "store";
import { theme } from "constants/DefaultTheme";

describe("PhoneInputComponent", () => {
  let result: any;
  const defaultProps: PhoneInputComponentProps = {
    accentColor: "",
    autoFocus: false,
    borderRadius: "",
    boxShadow: "",
    compactMode: false,
    disableNewLineOnPressEnterKey: false,
    disabled: false,
    errorMessage: "",
    fill: false,
    iconAlign: "left",
    inputType: "PHONE_NUMBER",
    intent: "none",
    isDynamicHeightEnabled: false,
    isInvalid: false,
    isLoading: false,
    label: "",
    labelAlignment: "left",
    labelStyle: "",
    labelTextColor: "",
    labelTextSize: "",
    labelWidth: 0,
    onFocusChange: jest.fn(),
    onKeyDown: jest.fn(),
    onValueChange: jest.fn(),
    placeholder: "Enter phone number",
    showError: false,
    tooltip: "",
    value: "",
    widgetId: "test-widget-id",
    onISDCodeChange: jest.fn(),
    allowDialCodeChange: true,
  };

  it("should display error message when maxChars is exceeded", () => {
    const errorMessage = "Default text length must be less than or equal to 9 characters";
    const defaultValue = 93702197302123
    const props = {
      ...defaultProps,
      defaultValue,
      showError:true,
      errorMessage,
      isInvalid: true,
      maxLength:9
    };

    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <PhoneInputComponent {...props} />
        </ThemeProvider>
      </Provider>,
    );
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
