import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { Alignment } from "@blueprintjs/core";
import { lightTheme } from "selectors/themeSelectors";
import RadioGroupComponent, { type RadioGroupComponentProps } from "./index";

const renderRadioGroup = (props: Partial<RadioGroupComponentProps> = {}) => {
  const defaultProps: RadioGroupComponentProps = {
    accentColor: "#553DE9",
    alignment: Alignment.LEFT,
    compactMode: false,
    disabled: false,
    inline: true,
    isVisible: true,
    labelText: "Gender",
    loading: false,
    onRadioSelectionChange: jest.fn(),
    options: [
      { label: "Yes", value: "Y" },
      { label: "No", value: "N" },
    ],
    selectedOptionValue: "",
    widgetId: "radio-group-widget",
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <RadioGroupComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("RadioGroupComponent required marker", () => {
  it.each([true, false])(
    "renders the required marker when required is true (inline: %s)",
    (inline) => {
      renderRadioGroup({ inline, required: true });

      expect(screen.getByLabelText("(required)")).toBeInTheDocument();
    },
  );

  it("does not render the required marker when required is false", () => {
    renderRadioGroup({ required: false });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
