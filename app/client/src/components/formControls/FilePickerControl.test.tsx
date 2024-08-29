import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import { ThemeProvider } from "styled-components";
import { reducer as formReducer } from "redux-form";
import { theme } from "constants/DefaultTheme"; // Adjust the path as necessary
import { BrowserRouter as Router } from "react-router-dom";
import FilePickerControl, { RenderFilePicker } from "./FilePickerControl"; // Adjust the path as necessary
import { Field, reduxForm } from "redux-form";

const rootReducer = combineReducers({
  form: formReducer,
});

const mockStore = createStore(rootReducer);

const mockInput = {
  value: {},
  onChange: jest.fn(),
};

const mockProps = {
  input: mockInput,
  meta: {},
  disabled: false,
  onChange: jest.fn(),
};

const TestForm = reduxForm({ form: "testForm" })(() => (
  <Field component={RenderFilePicker} name="filePicker" {...mockProps} />
));

const renderComponent = () =>
  render(
    <Provider store={mockStore}>
      <Router>
        <ThemeProvider theme={theme}>
          <TestForm />
        </ThemeProvider>
      </Router>
    </Provider>
  );

describe("FilePickerControl Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the component", () => {
    renderComponent();
    expect(screen.getByText("Select")).toBeInTheDocument();
  });

  test("selects a file and triggers onChange", async () => {
    renderComponent();

    const file = new File(["file contents"], "example.txt", {
      type: "text/plain",
    });

    userEvent.click(screen.getByText("Select"));
    userEvent.click(screen.getByText("Browse"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      if (fileInput) {
        console.log('File input found, uploading file...');
        await userEvent.upload(fileInput, file);
        console.log('File uploaded.');
      } else {
        throw new Error("File input not found");
      }
    });

    await waitFor(() => {
      console.log('Waiting for file name to appear...');
      expect(screen.getByText("example.txt")).toBeInTheDocument();
    });

  });
});
