import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";

import InputsForm from "./InputsForm";
import store from "store";
import {
  MODULE_INSTANCE_EMPTY_INPUT,
  createMessage,
} from "@appsmith/constants/messages";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { useController } from "react-hook-form";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: jest.fn(() => mockDispatch),
}));

jest.mock(
  "@appsmith/components/InputsForm/Fields/InputField",
  () => (props: any) => {
    const {
      field: { onBlur, onChange, value },
    } = useController({
      name: props.name,
    });

    return (
      <input
        data-testid={`t--input-${props.name}`}
        onBlur={onBlur}
        onChange={onChange}
        placeholder="Default value"
        value={value}
      />
    );
  },
);

describe("InputsForm", () => {
  const defaultValues = {
    inputs: {
      // ...mock data
    },
  };

  const inputsForm = [
    {
      id: "pjdquuvhxf",
      sectionName: "",
      children: [
        {
          id: "inp-1",
          label: "userId",
          propertyName: "inputs.userId",
          controlType: "TEXT_INPUT",
          defaultValue: "demoUser",
        },
        {
          id: "inp-2",
          label: "limit",
          propertyName: "inputs.limit",
          controlType: "TEXT_INPUT",
          defaultValue: 20,
        },
      ],
    },
  ] as Module["inputsForm"];

  it("renders empty message when formSection is empty", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <InputsForm
            defaultValues={{ inputs: undefined }}
            inputsForm={[
              {
                id: "pjdquuvhxf",
                sectionName: "",
                children: [],
              },
            ]}
          />
        </ThemeProvider>
      </Provider>,
    );

    expect(
      screen.getByText(createMessage(MODULE_INSTANCE_EMPTY_INPUT)),
    ).toBeInTheDocument();
  });

  it("renders form with correct labels and input fields", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <InputsForm defaultValues={defaultValues} inputsForm={inputsForm} />,
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByText("userId")).toBeInTheDocument();
    expect(screen.getByText("limit")).toBeInTheDocument();
  });

  it("dispatches updateModuleInstance with debounced values", async () => {
    jest.useFakeTimers();

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <InputsForm
            defaultValues={defaultValues}
            inputsForm={inputsForm}
            moduleInstanceId="1"
          />
        </ThemeProvider>
      </Provider>,
    );

    // Simulate changing input value
    fireEvent.change(screen.getByTestId("t--input-inputs.userId"), {
      target: { value: "new value" },
    });

    jest.runOnlyPendingTimers();

    // Assertions
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_MODULE_INSTANCE_INIT",
      payload: {
        id: "1",
        moduleInstance: {
          inputs: { userId: "new value", limit: undefined },
        },
      },
    });
  });
});
