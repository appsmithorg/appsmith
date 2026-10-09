import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import CheckboxGroupComponent, {
  type CheckboxGroupComponentProps,
} from "./index";

const renderCheckboxGroup = (
  props: Partial<CheckboxGroupComponentProps> = {},
) => {
  const defaultProps: CheckboxGroupComponentProps = {
    accentColor: "#553DE9",
    borderRadius: "0px",
    compactMode: false,
    isDisabled: false,
    isInline: true,
    isVisible: true,
    labelText: "Fruits",
    onChange: () => jest.fn(),
    onSelectAllChange: () => jest.fn(),
    options: [
      { label: "Apple", value: "apple" },
      { label: "Orange", value: "orange" },
    ],
    selectedValues: [],
    widgetId: "checkbox-group-widget",
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <CheckboxGroupComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("CheckboxGroupComponent required marker", () => {
  it.each([true, false])(
    "renders the required marker when isRequired is true (inline: %s)",
    (isInline) => {
      renderCheckboxGroup({ isInline, isRequired: true });

      expect(screen.getByLabelText("(required)")).toBeInTheDocument();
    },
  );

  it("does not render the required marker when isRequired is false", () => {
    renderCheckboxGroup({ isRequired: false });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
