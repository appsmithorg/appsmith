import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
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

  const renderArrayFieldAndClickAdd = (options: {
    name: string;
    initialValue: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arrayItemSchema: Record<string, any>;
  }) => {
    let latestValues: Record<string, unknown> = {};
    const arraySchema = {
      children: {
        __array_item__: options.arrayItemSchema,
      },
      dataType: "array",
      defaultValue: options.initialValue,
      fieldType: "Array",
      sourceData: options.initialValue,
      isCustomField: false,
      accessor: options.name,
      identifier: options.name,
      position: 0,
      originalIdentifier: options.name,
      accentColor: "#553DE9",
      borderRadius: "0.375rem",
      boxShadow: "none",
      isDisabled: false,
      isRequired: false,
      isVisible: true,
      labelTextSize: "0.875rem",
      label: options.name,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          [options.name]: options.initialValue,
        },
      });

      latestValues = methods.watch();

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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
          }
        >
          <FormContextProvider
            executeAction={jest.fn}
            renderMode="CANVAS"
            setMetaInternalFieldState={jest.fn}
            updateFormData={jest.fn}
            updateWidgetMetaProperty={jest.fn}
            updateWidgetProperty={jest.fn}
          >
            <FormProvider {...methods}>
              <ArrayField
                fieldClassName={options.name}
                name={options.name}
                passedDefaultValue={options.initialValue}
                propertyPath={`schema.__root_schema__.children.${options.name}`}
                schemaItem={arraySchema}
              />
            </FormProvider>
          </FormContextProvider>
        </ThemeProvider>
      );
    };

    const utils = render(<TestComponent />);
    const addBtn = utils.container.querySelector(
      ".t--jsonformfield-array-add-btn",
    );

    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn!);

    return { ...utils, getLatestValues: () => latestValues };
  };

  it("adds empty scalar value instead of [object Object] when clicking Add New on a scalar Text Input array", () => {
    const { container } = renderArrayFieldAndClickAdd({
      name: "tags",
      initialValue: ["alpha"],
      arrayItemSchema: {
        children: {},
        dataType: "string",
        fieldType: "Text Input",
        sourceData: "alpha",
        isCustomField: false,
        accessor: "__array_item__",
        identifier: "__array_item__",
        position: -1,
        originalIdentifier: "__array_item__",
        isDisabled: false,
        isRequired: false,
        isSpellCheck: false,
        isVisible: true,
        labelTextSize: "0.875rem",
        label: "Array Item",
        validation: true,
      },
    });

    const inputs = container.querySelectorAll("input");

    expect(inputs.length).toBe(2);
    expect(inputs[0].value).toBe("alpha");
    expect(inputs[1].value).toBe("");
    expect(inputs[1].value).not.toBe("[object Object]");
  });

  it("uses scalar item defaultValue when clicking Add New on an empty scalar array", () => {
    const { container } = renderArrayFieldAndClickAdd({
      name: "tags",
      initialValue: [],
      arrayItemSchema: {
        children: {},
        dataType: "string",
        fieldType: "Text Input",
        defaultValue: "default-tag",
        sourceData: "",
        isCustomField: false,
        accessor: "__array_item__",
        identifier: "__array_item__",
        position: -1,
        originalIdentifier: "__array_item__",
        isDisabled: false,
        isRequired: false,
        isSpellCheck: false,
        isVisible: true,
        labelTextSize: "0.875rem",
        label: "Array Item",
        validation: true,
      },
    });

    const inputs = container.querySelectorAll("input");

    expect(inputs.length).toBe(1);
    expect(inputs[0].value).toBe("default-tag");
  });

  it("pushes an empty array instead of {} when array item type is Array", () => {
    const { getLatestValues } = renderArrayFieldAndClickAdd({
      name: "matrix",
      initialValue: [],
      arrayItemSchema: {
        children: {
          __array_item__: {
            children: {},
            dataType: "string",
            fieldType: "Text Input",
            isCustomField: false,
            accessor: "__array_item__",
            identifier: "__array_item__",
            position: -1,
            originalIdentifier: "__array_item__",
            isDisabled: false,
            isRequired: false,
            isSpellCheck: false,
            isVisible: true,
            labelTextSize: "0.875rem",
            label: "Array Item",
          },
        },
        dataType: "array",
        fieldType: "Array",
        isCustomField: false,
        accessor: "__array_item__",
        identifier: "__array_item__",
        position: -1,
        originalIdentifier: "__array_item__",
        isDisabled: false,
        isRequired: false,
        isVisible: true,
        labelTextSize: "0.875rem",
        label: "Array Item",
        isCollapsible: true,
      },
    });

    expect(getLatestValues().matrix).toEqual([[]]);
  });
});
