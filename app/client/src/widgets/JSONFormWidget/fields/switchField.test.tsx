import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import SwitchField from "./SwitchField";
import { FormContextProvider } from "../FormContext";
import { ThemeProvider } from "styled-components";
import { LabelPosition } from "components/constants";
import { AlignWidgetTypes } from "WidgetProvider/constants";
import { DataType, FieldType } from "../constants";

const mockExecuteAction = jest.fn();

const DefaultschemaItem = {
  accessor: "Test Switch",
  accentColor: "#553DE9",
  alignWidget: AlignWidgetTypes.LEFT,
  boxShadow: "none",
  children: {},
  dataType: DataType.STRING,
  defaultValue: "",
  fieldType: FieldType.SWITCH,
  identifier: "TEST_IDENTIFIER",
  isCustomField: false,
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "Test Switch",
  labelPosition: LabelPosition.Left,
  labelStyle: "",
  labelTextColor: "",
  labelTextSize: "0.875rem",
  originalIdentifier: "Test Switch",
  position: 0,
  sourceData: "har",
  tooltip: "",
};

const schemaItemRight = {
  accessor: "Test Switch",
  accentColor: "#553DE9",
  alignWidget: AlignWidgetTypes.RIGHT,
  boxShadow: "none",
  children: {},
  dataType: DataType.STRING,
  defaultValue: "",
  fieldType: FieldType.SWITCH,
  identifier: "TEST_IDENTIFIER",
  isCustomField: false,
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "Test Switch",
  labelPosition: LabelPosition.Right,
  labelStyle: "",
  labelTextColor: "",
  labelTextSize: "0.875rem",
  originalIdentifier: "Test Switch",
  position: 0,
  sourceData: "har",
  tooltip: "",
};

const DefaultTestComponent = () => {
  const methods = useForm({
    defaultValues: {
      name: "test switch",
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
            passedDefaultValue={false}
            propertyPath={"schema.__root_schema__.children"}
            schemaItem={DefaultschemaItem}
          />
        </FormProvider>
      </FormContextProvider>
    </ThemeProvider>
  );
};

const TestComponentRight = () => {
  const methods = useForm({
    defaultValues: {
      name: "test switch",
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
            passedDefaultValue={false}
            propertyPath={"schema.__root_schema__.children"}
            schemaItem={schemaItemRight}
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
    render(<DefaultTestComponent />);
    expect(screen.getByText("Test Switch")).toBeInTheDocument();
  });

  it("applies the correct label position and width for the switch widget", () => {
    render(<DefaultTestComponent />);
    const labelElement = screen.getByTestId("inlinelabel");
    expect(labelElement).toHaveStyle("width: 100%");
  });
  it("applies the correct label position", async () => {
    render(<TestComponentRight />);
    const labelElement = screen.getByTestId("inlinelabel");
    const switchComponent = screen.getByRole("checkbox");

    const switchComponentPosition =
      switchComponent.compareDocumentPosition(labelElement);
    expect(switchComponentPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  it("applies the correct label position left and alignment right", () => {
    render(<DefaultTestComponent />);

    const switchComponent = screen.getByRole("checkbox");
    const labelElement = screen.getByText("Test Switch");

    const labelElementPosition =
      labelElement.compareDocumentPosition(switchComponent);

    expect(labelElementPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
