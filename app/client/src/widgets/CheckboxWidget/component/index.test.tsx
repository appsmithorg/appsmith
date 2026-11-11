import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { LabelPosition } from "components/constants";
import CheckboxComponent, { type CheckboxComponentProps } from "./index";

const renderCheckbox = (props: Partial<CheckboxComponentProps> = {}) => {
  const defaultProps: CheckboxComponentProps = {
    accentColor: "#553DE9",
    borderRadius: "0px",
    isChecked: false,
    isDisabled: false,
    isLoading: false,
    isVisible: true,
    label: "Accept terms",
    labelPosition: LabelPosition.Left,
    onCheckChange: jest.fn(),
    widgetId: "checkbox-widget",
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <CheckboxComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("CheckboxComponent required marker", () => {
  it.each([LabelPosition.Left, LabelPosition.Right])(
    "renders the required marker when isRequired is true (label %s)",
    (labelPosition) => {
      renderCheckbox({ isRequired: true, labelPosition });

      expect(screen.getByLabelText("(required)")).toBeInTheDocument();
    },
  );

  it("does not render the required marker when isRequired is false", () => {
    renderCheckbox({ isRequired: false });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });

  it("does not render the required marker when the label is empty", () => {
    renderCheckbox({ isRequired: true, label: "" });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
