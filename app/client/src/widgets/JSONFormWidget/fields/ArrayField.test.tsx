import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import ArrayField from "./ArrayField";
import { FormContextProvider } from "../FormContext";
import { ThemeProvider } from "styled-components";

const schemaItem = {
  children: {
    __array_item__: {
      children: {
        name: {
          children: {},
          dataType: "string",
          fieldType: "Text Input",
          sourceData: "Crime",
          isCustomField: false,
          accessor: "name",
          identifier: "name",
          position: 0,
          originalIdentifier: "name",
          accentColor: "#553DE9",
          borderRadius: "0.375rem",
          boxShadow: "none",
          iconAlign: "left",
          isDisabled: false,
          isRequired: false,
          isSpellCheck: false,
          isVisible: true,
          labelTextSize: "0.875rem",
          label: "Name",
          iconName: "",
          labelStyle: "",
          labelTextColor: "",
          placeholderText: "",
          tooltip: "",
          errorMessage: "",
          validation: true,
          regex: "",
        },
        id: {
          children: {},
          dataType: "number",
          fieldType: "Number Input",
          sourceData: 80,
          isCustomField: false,
          accessor: "id",
          identifier: "id",
          position: 1,
          originalIdentifier: "id",
          accentColor: "#553DE9",
          borderRadius: "0.375rem",
          boxShadow: "none",
          iconAlign: "left",
          isDisabled: false,
          isRequired: false,
          isSpellCheck: false,
          isVisible: true,
          labelTextSize: "0.875rem",
          label: "Id",
          iconName: "",
          labelStyle: "",
          labelTextColor: "",
          placeholderText: "",
          tooltip: "",
          errorMessage: "",
          validation: true,
          regex: "",
        },
      },
      dataType: "object",
      fieldType: "Object",
      sourceData: {
        name: "Crime",
        id: 80,
      },
      isCustomField: false,
      accessor: "__array_item__",
      identifier: "__array_item__",
      position: -1,
      originalIdentifier: "__array_item__",
      borderRadius: "0.375rem",
      boxShadow: "none",
      cellBorderRadius: "0.375rem",
      cellBoxShadow: "none",
      isDisabled: false,
      isRequired: false,
      isVisible: true,
      labelTextSize: "0.875rem",
      label: "Array Item",
      borderColor: "",
      backgroundColor: "",
      labelStyle: "",
      labelTextColor: "",
    },
  },
  dataType: "array",
  defaultValue:
    '[\n  {\n    "name": "Comedy",\n    "id": 35\n  },\n  {\n    "name": "Crime",\n    "id": 80\n  }\n]',
  fieldType: "Array",
  sourceData: [
    {
      name: "Comedy",
      id: 35,
    },
    {
      name: "Crime",
      id: 80,
    },
  ],
  isCustomField: false,
  accessor: "genres",
  identifier: "genres",
  position: 3,
  originalIdentifier: "genres",
  accentColor: "#553DE9",
  borderRadius: "0.375rem",
  boxShadow: "none",
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  labelTextSize: "0.875rem",
  label: "Genres",
  cellBorderColor: "",
  cellBackgroundColor: "",
  borderColor: "",
  labelStyle: "",
  labelTextColor: "",
  tooltip: "",
  cellBorderRadius: "0.375rem",
  cellBoxShadow: "none",
  backgroundColor: "#FAFAFA",
  isCollapsible: true,
};

describe("ArrayField", () => {
  it("check if stringified defaultValue array generates correct number of array fields", async () => {
    const mocksetMetaInternalFieldState = jest.fn();

    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          genres: schemaItem.defaultValue,
        },
      });
      return (
        <ThemeProvider
          theme={
            {
              colors: {
                icon: {
                  normal: "#C5C5C5",
                  hover: "#4B4848",
                  active: "#302D2D",
                },
              },
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
          }
        >
          <FormContextProvider
            executeAction={jest.fn}
            renderMode="CANVAS"
            setMetaInternalFieldState={mocksetMetaInternalFieldState}
            updateFormData={jest.fn}
            updateWidgetMetaProperty={jest.fn}
            updateWidgetProperty={jest.fn}
          >
            <FormProvider {...methods}>
              <ArrayField
                fieldClassName={"genres"}
                name={"genres"}
                passedDefaultValue={[
                  {
                    name: "Comedy",
                    id: 35,
                  },
                  {
                    name: "Crime",
                    id: 80,
                  },
                ]}
                propertyPath={"schema.__root_schema__.children.genres"}
                schemaItem={schemaItem}
              />
            </FormProvider>
          </FormContextProvider>
        </ThemeProvider>
      );
    };
    const { container } = render(<TestComponent />);
    expect(
      container.getElementsByClassName("t--jsonformfield-genres-item").length,
    ).toBe(2);
  });

  it("check if defaultValue array generates correct number of array fields", async () => {
    const mocksetMetaInternalFieldState = jest.fn();

    const TestComponent = () => {
      schemaItem.defaultValue = [
        {
          name: "Comedy",
          id: 35,
        },
        {
          name: "Crime",
          id: 80,
        },
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;

      const methods = useForm({
        defaultValues: {
          genres: schemaItem.defaultValue,
        },
      });
      return (
        <ThemeProvider
          theme={
            {
              colors: {
                icon: {
                  normal: "#C5C5C5",
                  hover: "#4B4848",
                  active: "#302D2D",
                },
              },
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
          }
        >
          <FormContextProvider
            executeAction={jest.fn}
            renderMode="CANVAS"
            setMetaInternalFieldState={mocksetMetaInternalFieldState}
            updateFormData={jest.fn}
            updateWidgetMetaProperty={jest.fn}
            updateWidgetProperty={jest.fn}
          >
            <FormProvider {...methods}>
              <ArrayField
                fieldClassName={"genres"}
                name={"genres"}
                passedDefaultValue={[
                  {
                    name: "Comedy",
                    id: 35,
                  },
                  {
                    name: "Crime",
                    id: 80,
                  },
                ]}
                propertyPath={"schema.__root_schema__.children.genres"}
                schemaItem={schemaItem}
              />
            </FormProvider>
          </FormContextProvider>
        </ThemeProvider>
      );
    };
    const { container } = render(<TestComponent />);
    expect(
      container.getElementsByClassName("t--jsonformfield-genres-item").length,
    ).toBe(2);
  });
});
