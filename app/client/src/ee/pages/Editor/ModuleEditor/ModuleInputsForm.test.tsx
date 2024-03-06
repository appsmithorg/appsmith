import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ModuleInputsForm from "./ModuleInputsForm";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

import "@testing-library/jest-dom";
import { useController } from "react-hook-form";
import { Provider } from "react-redux";
import store from "store";

function TestField({ name }: { name: string }) {
  const { field } = useController({
    name,
  });
  const { onBlur, onChange, value } = field;

  return (
    <input
      data-testid={`testField-${name}`}
      onBlur={onBlur}
      onChange={onChange}
      type="text"
      value={value}
    />
  );
}

/**
 * Mocked the HiddenField as the type of input in the Hidden field is "hidden" which has some issue
 * with either the testing-library or react-hook-form; due to which the onChange is not triggered.
 * To just verify the that the submit watchers are working, a changeable field is added.
 */
jest.mock(
  "@appsmith/components/InputsForm/Fields/HiddenField",
  () => TestField,
);

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("ModuleInputsForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component", () => {
    render(
      <Provider store={store}>
        <ModuleInputsForm />
      </Provider>,
    );
    // Check if the component is rendered
    const headingElement = screen.getByText("Inputs");
    expect(headingElement).toBeInTheDocument();
  });

  it("updates the form and dispatches an action when a field is changed", () => {
    jest.useFakeTimers();

    render(
      <Provider store={store}>
        <ModuleInputsForm moduleId="module123" />
      </Provider>,
    );

    // Simulate changing a field
    const field = screen.getByTestId("testField-inputsForm.0.sectionName");

    fireEvent.change(field, { target: { value: "NewValue" } });

    jest.runOnlyPendingTimers();

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.UPDATE_MODULE_INPUTS_INIT,
      payload: {
        id: "module123",
        inputsForm: [
          {
            id: expect.any(String), // Ensure a new ID is generated
            sectionName: "NewValue",
            children: [],
          },
        ],
      },
    });
  });

  it("does not dispatch action when moduleId is missing", () => {
    jest.useFakeTimers();

    render(
      <Provider store={store}>
        <ModuleInputsForm />
      </Provider>,
    );

    // Simulate changing a field
    const field = screen.getByTestId("testField-inputsForm.0.sectionName");
    fireEvent.change(field, { target: { value: "NewValue" } });

    jest.runOnlyPendingTimers();
    // Ensure that onUpdateForm is called with the expected values
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
