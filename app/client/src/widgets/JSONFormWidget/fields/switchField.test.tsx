import React from "react";
import '@testing-library/jest-dom'
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import SwitchField from "./SwitchField";
import { FormContextProvider } from "../FormContext";
import { ThemeProvider } from "styled-components";
import { LabelPosition } from "components/constants";
import { AlignWidgetTypes } from "WidgetProvider/constants";


const mockExecuteAction = jest.fn();

const TestComponent = (props: any) => {
  const methods = useForm({
    defaultValues: {
      [props.name || "test-switch"]: props.passedDefaultValue || false,
    },
  });

  return (
    <ThemeProvider
      theme={{
        colors: {
          icon: {
            normal: "#C5C5C5",
            hover: "#4B4848",
            active: "#302D2D",
          },
        },
      }}
    >
      <FormContextProvider
        executeAction={mockExecuteAction}
        renderMode="CANVAS"
        setMetaInternalFieldState={jest.fn()}
        updateFormData={jest.fn()}
        updateWidgetMetaProperty={jest.fn()}
        updateWidgetProperty={jest.fn()}
      >
        <FormProvider {...methods}>
          <SwitchField
            fieldClassName="test-switch-field"
            name="test-switch"
            passedDefaultValue={props.passedDefaultValue || false}
            schemaItem={{
              accessor: "test-switch",
              fieldType: "SWITCH",
              identifier: "test-switch",
              isCustomField: false,
              originalIdentifier: "test-switch",
              position: 0,
              sourceData: false,
              isRequired: false,
              isDisabled: false,
              labelTextSize: "16px",
              label: "Test Switch",
              labelPosition: LabelPosition.Left,
              alignWidget: AlignWidgetTypes.LEFT,
              onChange: "testOnChangeAction",
              ...props.schemaItem,
            }} propertyPath={props.propertyPath}
            />
        </FormProvider>
      </FormContextProvider>
    </ThemeProvider>
  );
};

describe("SwitchField", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the switch field with default props", () => {
    render(<TestComponent />);
    expect(screen.getByText("Test Switch")).toBeInTheDocument();
  });

  it("applies the correct label position and width for the switch widget", () => {
    render(<TestComponent/>);
    const labelElement = screen.getByTestId("inlinelabel");
    expect(labelElement).toHaveStyle("width: 100%");
  });
  it("applies the correct label position", async () => {
    render(<TestComponent schemaItem={{ labelPosition:LabelPosition.Right }}/>);
    const labelElement = screen.getByTestId("inlinelabel");
    const switchComponent = screen.getByRole("checkbox");

    const switchComponentPosition = switchComponent.compareDocumentPosition(labelElement);
    expect(switchComponentPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
  it("applies the correct label position left and alignment right", () => {
    render(
      <TestComponent
        alignWidget={AlignWidgetTypes.RIGHT}
      />
    );

    const switchComponent = screen.getByRole("checkbox");
    const labelElement = screen.getByText("Test Switch");

    const labelElementPosition = labelElement.compareDocumentPosition(switchComponent);
   
    expect(labelElementPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

});
