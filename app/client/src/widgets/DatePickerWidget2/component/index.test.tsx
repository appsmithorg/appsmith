import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { TimePrecision } from "../constants";
import DatePickerComponent from "./index";

type DatePickerComponentProps = React.ComponentProps<
  typeof DatePickerComponent
>;

const renderDatePicker = (props: Partial<DatePickerComponentProps> = {}) => {
  const defaultProps: DatePickerComponentProps = {
    accentColor: "#553DE9",
    borderRadius: "0px",
    closeOnSelection: true,
    compactMode: false,
    dateFormat: "YYYY-MM-DD",
    datePickerType: "DATE_PICKER",
    isDisabled: false,
    isLoading: false,
    labelText: "Birthday",
    onDateSelected: jest.fn(),
    shortcuts: false,
    timePrecision: TimePrecision.NONE,
    widgetId: "date-picker-widget",
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <DatePickerComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("DatePickerComponent required marker", () => {
  it("renders the required marker when isRequired is true", () => {
    renderDatePicker({ isRequired: true });

    expect(screen.getByLabelText("(required)")).toBeInTheDocument();
  });

  it("does not render the required marker when isRequired is false", () => {
    renderDatePicker({ isRequired: false });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
