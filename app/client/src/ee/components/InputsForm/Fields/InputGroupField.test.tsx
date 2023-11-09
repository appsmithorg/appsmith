import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom";

import InputGroupField from "./InputGroupField";
import { lightTheme } from "selectors/themeSelectors";

const mockHiddenField = jest.fn();
jest.mock("./HiddenField", () => (props: any) => {
  mockHiddenField(props);
  return <div data-testid="field" />;
});
const mockLabelField = jest.fn();
let deleteFn: any;
jest.mock("./LabelField", () => (props: any) => {
  deleteFn = props.onDeleteClick;
  mockLabelField(props);
  return (
    <div data-testid="field">
      <button
        data-testid="t--delete-input-btn"
        onClick={deleteFn}
        type="button"
      />
    </div>
  );
});

const mockInputField = jest.fn();
jest.mock("./InputField", () => (props: any) => {
  mockInputField(props);
  return <div data-testid="field" />;
});

function Wrapper({ children }: { children: React.ReactNode }) {
  const formMethods = useForm();

  return (
    <ThemeProvider theme={lightTheme}>
      <FormProvider {...formMethods}>{children}</FormProvider>
    </ThemeProvider>
  );
}

describe("InputGroupField", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component and adds a new input group with indexed names", () => {
    render(
      <Wrapper>
        <InputGroupField name="testInputGroups" />
      </Wrapper>,
    );

    // Ensure that the component is rendered
    const addButton = screen.getByTestId("t--add-input-btn");
    expect(addButton).toBeInTheDocument();

    // Add a new input group
    fireEvent.click(addButton);

    expect(mockHiddenField).toBeCalledTimes(3);
    expect(mockHiddenField).toHaveBeenCalledWith({
      name: "testInputGroups.0.id",
    });
    expect(mockHiddenField).toHaveBeenCalledWith({
      name: "testInputGroups.0.propertyName",
    });
    expect(mockHiddenField).toHaveBeenCalledWith({
      name: "testInputGroups.0.controlType",
    });
    expect(mockLabelField).toHaveBeenCalledWith({
      name: "testInputGroups.0.label",
      onDeleteClick: deleteFn,
    });
    expect(mockInputField).toHaveBeenNthCalledWith(1, {
      evaluatedValueLookupPath: "testInputGroups.0.label",
      name: "testInputGroups.0.defaultValue",
    });
  });

  it("deletes an input group and updates indexed names", () => {
    render(
      <Wrapper>
        <InputGroupField name="testInputGroups" />
      </Wrapper>,
    );

    const addBtn = screen.getByTestId("t--add-input-btn");
    // Add a new input group
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);

    const deleteBtns = screen.getAllByTestId("t--delete-input-btn");

    let fields = screen.getAllByTestId("field");

    expect(fields.length).toBe(10);

    // Delete the added input group
    fireEvent.click(deleteBtns[1]);

    fields = screen.getAllByTestId("field");
    expect(fields.length).toBe(5);
  });
});
