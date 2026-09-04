import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FilePickerComponent, { type FilePickerComponentProps } from "./index";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";

const mockProps: FilePickerComponentProps = {
  label: "Select files",
  openModal: jest.fn(),
  isLoading: false,
  files: [],
  buttonColor: "blue",
  borderRadius: "5px",
  shouldFitContent: true,
  widgetId: "",
  maxNumFiles: 2,
  errorMessage: "Cannot upload any files",
};

describe("FilePickerComponent", () => {
  test("1.renders with default label", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <FilePickerComponent {...mockProps} />
      </ThemeProvider>,
    );
    const button = screen.getByRole("button", { name: /select files/i });
    expect(button).toBeInTheDocument();
  });

  test("2.displays number of selected files", () => {
    const propsWithFiles = {
      ...mockProps,
      files: [{ name: "file1" }, { name: "file2" }],
    };
    render(
      <ThemeProvider theme={lightTheme}>
        <FilePickerComponent {...propsWithFiles} />
      </ThemeProvider>,
    );
    const button = screen.getByRole("button", { name: /2 files selected/i });
    expect(button).toBeInTheDocument();
  });

  test("3.opens modal on button click", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <FilePickerComponent {...mockProps} />
      </ThemeProvider>,
    );
    const button = screen.getByRole("button", { name: /select files/i });
    fireEvent.click(button);
    expect(mockProps.openModal).toHaveBeenCalled();
  });

  test("4.displays error message when provided", () => {
    const propsWithError = {
      ...mockProps,
      maxNumFiles: 0,
    };
    render(
      <ThemeProvider theme={lightTheme}>
        <FilePickerComponent {...propsWithError} />
      </ThemeProvider>,
    );
    expect(screen.getByText(/Cannot upload any files/i)).toBeInTheDocument();
  });
});
