import React from "react";
import { act, render } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";

import { RenderModes } from "constants/WidgetConstants";
import FormContext from "../FormContext";
import { DataType, FieldType, type Schema } from "../constants";
import DateField from "./DateField";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";

interface MockDateComponentProps {
  isRequired?: boolean;
  onDateSelected: (selectedDate: string) => void;
}

const mockDateComponent = jest.fn();

jest.mock("widgets/DatePickerWidget2/component", () => ({
  __esModule: true,
  default: (props: MockDateComponentProps) => {
    mockDateComponent(props);

    return <div data-testid="t--date-component" />;
  },
}));

const getLastRenderedProps = (): MockDateComponentProps =>
  mockDateComponent.mock.calls[mockDateComponent.mock.calls.length - 1][0];

const formContextValue = {
  executeAction: jest.fn(),
  renderMode: RenderModes.CANVAS,
  setMetaInternalFieldState: jest.fn(),
  updateWidgetMetaProperty: jest.fn(),
  updateWidgetProperty: jest.fn(),
  updateFormData: jest.fn(),
};

function MockFormWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <FormContext.Provider value={formContextValue}>
        {children}
      </FormContext.Provider>
    </FormProvider>
  );
}

const schemaItem = {
  fieldType: FieldType.DATEPICKER,
  isRequired: true,
  isVisible: true,
  isDisabled: false,
  accessor: "dob",
  identifier: "dob",
  originalIdentifier: "dob",
  position: 0,
  label: "Date of birth",
  children: {} as Schema,
  dataType: DataType.STRING,
  isCustomField: false,
  sourceData: "",
  closeOnSelection: false,
  convertToISO: false,
  dateFormat: "YYYY-MM-DD HH:mm",
  maxDate: "2121-12-31T18:29:00.000Z",
  minDate: "1920-12-31T18:30:00.000Z",
  shortcuts: false,
  timePrecision: TimePrecision.MINUTE,
};

describe("DateField", () => {
  beforeEach(() => {
    mockDateComponent.mockClear();
  });

  it("does not mark an empty required field as invalid before the user interacts with it", () => {
    render(
      <MockFormWrapper>
        <DateField
          fieldClassName="dob"
          name="dob"
          propertyPath="schema.__root_schema__.children.dob"
          schemaItem={schemaItem}
        />
      </MockFormWrapper>,
    );

    expect(getLastRenderedProps().isRequired).toBeFalsy();
  });

  it("marks an empty required field as invalid once the user clears the selected date", () => {
    render(
      <MockFormWrapper>
        <DateField
          fieldClassName="dob"
          name="dob"
          propertyPath="schema.__root_schema__.children.dob"
          schemaItem={schemaItem}
        />
      </MockFormWrapper>,
    );

    act(() => {
      getLastRenderedProps().onDateSelected("2024-01-15T10:00:00.000Z");
    });

    act(() => {
      getLastRenderedProps().onDateSelected("");
    });

    expect(getLastRenderedProps().isRequired).toBe(true);
  });
});
