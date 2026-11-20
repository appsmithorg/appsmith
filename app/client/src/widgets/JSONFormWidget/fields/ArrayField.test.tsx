import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import ArrayField, { getEmptyArrayItemValue } from "./ArrayField";
import { FormContextProvider } from "../FormContext";
import { ThemeProvider } from "styled-components";
import { FieldType } from "../constants";

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

const theme = {
  colors: {
    icon: {
      normal: "#C5C5C5",
      hover: "#4B4848",
      active: "#302D2D",
    },
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const scalarArraySchemaItem = {
  children: {
    __array_item__: {
      children: {},
      dataType: "string",
      fieldType: FieldType.TEXT_INPUT,
      sourceData: "",
      isCustomField: false,
      accessor: "__array_item__",
      identifier: "__array_item__",
      position: -1,
      originalIdentifier: "__array_item__",
      accentColor: "#553DE9",
      borderRadius: "0.375rem",
      boxShadow: "none",
      iconAlign: "left",
      isDisabled: false,
      isRequired: false,
      isSpellCheck: false,
      isVisible: true,
      labelTextSize: "0.875rem",
      label: "Array Item",
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
  dataType: "array",
  defaultValue: [],
  fieldType: FieldType.ARRAY,
  sourceData: [],
  isCustomField: false,
  accessor: "profileIds",
  identifier: "profileIds",
  position: 0,
  originalIdentifier: "profileIds",
  accentColor: "#553DE9",
  borderRadius: "0.375rem",
  boxShadow: "none",
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  labelTextSize: "0.875rem",
  label: "Profile Ids",
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

describe("getEmptyArrayItemValue", () => {
  it("returns type-appropriate empty values", () => {
    expect(getEmptyArrayItemValue(FieldType.OBJECT)).toEqual({});
    expect(getEmptyArrayItemValue(FieldType.ARRAY)).toEqual([]);
    expect(getEmptyArrayItemValue(FieldType.MULTISELECT)).toEqual([]);
    expect(getEmptyArrayItemValue(FieldType.SWITCH)).toBe(false);
    expect(getEmptyArrayItemValue(FieldType.CHECKBOX)).toBe(false);
    expect(getEmptyArrayItemValue(FieldType.NUMBER_INPUT)).toBeNull();
    expect(getEmptyArrayItemValue(FieldType.TEXT_INPUT)).toBe("");
    expect(getEmptyArrayItemValue(FieldType.EMAIL_INPUT)).toBe("");
    expect(getEmptyArrayItemValue()).toBe("");
  });
});

const renderArrayFieldWithAdd = ({
  name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemaItem,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemaItem: any;
}) => {
  const mocksetMetaInternalFieldState = jest.fn();
  let getFormValues: (fieldName?: string) => unknown = () => undefined;

  const TestComponent = () => {
    const methods = useForm({
      defaultValues: {
        [name]: [],
      },
    });

    getFormValues = methods.getValues;

    return (
      <ThemeProvider theme={theme}>
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
              fieldClassName={name}
              name={name}
              propertyPath={`schema.__root_schema__.children.${name}`}
              schemaItem={schemaItem}
            />
          </FormProvider>
        </FormContextProvider>
      </ThemeProvider>
    );
  };

  const view = render(<TestComponent />);
  const addButton = view.container.querySelector(
    ".t--jsonformfield-array-add-btn",
  );

  expect(addButton).not.toBeNull();
  fireEvent.click(addButton as HTMLButtonElement);

  return { ...view, getFormValues };
};

describe("ArrayField", () => {
  it("Add New for text Array Item leaves the value empty", () => {
    const { container, getFormValues } = renderArrayFieldWithAdd({
      name: "profileIds",
      schemaItem: scalarArraySchemaItem,
    });

    expect(getFormValues("profileIds")).toEqual([""]);
    expect(
      container.getElementsByClassName("t--jsonformfield-profileIds-item")
        .length,
    ).toBe(1);

    const input = container.querySelector(
      ".t--jsonformfield-profileIds-item input",
    ) as HTMLInputElement | null;

    expect(input).not.toBeNull();
    expect(input?.value).toBe("");
    expect(input?.value).not.toBe("[object Object]");
  });

  it("Add New for number Array Item pushes null", () => {
    const numberArraySchemaItem = {
      ...scalarArraySchemaItem,
      accessor: "scores",
      identifier: "scores",
      originalIdentifier: "scores",
      label: "Scores",
      children: {
        __array_item__: {
          ...scalarArraySchemaItem.children.__array_item__,
          dataType: "number",
          fieldType: FieldType.NUMBER_INPUT,
          sourceData: 0,
        },
      },
    };

    const { getFormValues } = renderArrayFieldWithAdd({
      name: "scores",
      schemaItem: numberArraySchemaItem,
    });

    expect(getFormValues("scores")).toEqual([null]);
  });

  it("Add New for switch Array Item pushes false", () => {
    const switchArraySchemaItem = {
      ...scalarArraySchemaItem,
      accessor: "flags",
      identifier: "flags",
      originalIdentifier: "flags",
      label: "Flags",
      children: {
        __array_item__: {
          ...scalarArraySchemaItem.children.__array_item__,
          dataType: "boolean",
          fieldType: FieldType.SWITCH,
          sourceData: false,
        },
      },
    };

    const { getFormValues } = renderArrayFieldWithAdd({
      name: "flags",
      schemaItem: switchArraySchemaItem,
    });

    expect(getFormValues("flags")).toEqual([false]);
  });

  it("check if stringified defaultValue array generates correct number of array fields", async () => {
    const mocksetMetaInternalFieldState = jest.fn();

    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          genres: schemaItem.defaultValue,
        },
      });

      return (
        <ThemeProvider theme={theme}>
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
        <ThemeProvider theme={theme}>
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

  it("Add New for object Array Item still pushes an empty object", () => {
    const { getFormValues } = renderArrayFieldWithAdd({
      name: "genres",
      schemaItem: {
        ...schemaItem,
        defaultValue: [],
      },
    });

    expect(getFormValues("genres")).toEqual([{}]);
  });
});
