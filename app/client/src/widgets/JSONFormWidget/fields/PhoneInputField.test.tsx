import React, { useEffect } from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import type { UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { ThemeProvider } from "styled-components";
import { AsYouType } from "libphonenumber-js";
import { RenderModes } from "constants/WidgetConstants";
import { lightTheme } from "selectors/themeSelectors";
import { DataType, FieldType } from "../constants";
import FormContext from "../FormContext";
import type { PhoneInputFieldProps } from "./PhoneInputField";
import PhoneInputField, { isValid, transformValue } from "./PhoneInputField";

describe("Phone Input Field", () => {
  it("return validity when not required", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      isRequired: false,
      fieldType: FieldType.TEXT_INPUT,
    } as PhoneInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);

      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when required", () => {
    const inputs = [
      { value: "", expectedOutput: false },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      isRequired: true,
      fieldType: FieldType.TEXT_INPUT,
    } as PhoneInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);

      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when validation is true", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: true },
      { value: "1", expectedOutput: true },
      { value: "-1", expectedOutput: true },
      { value: "1.2", expectedOutput: true },
      { value: "1.200", expectedOutput: true },
      { value: "asd", expectedOutput: true },
      { value: "1.2.1", expectedOutput: true },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      validation: true,
      fieldType: FieldType.TEXT_INPUT,
    } as PhoneInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);

      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when validation is false", () => {
    const inputs = [
      { value: "", expectedOutput: true },
      { value: "0", expectedOutput: false },
      { value: "1", expectedOutput: false },
      { value: "-1", expectedOutput: false },
      { value: "1.2", expectedOutput: false },
      { value: "1.200", expectedOutput: false },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: null, expectedOutput: true },
      { value: undefined, expectedOutput: true },
    ];
    const schemaItem = {
      validation: false,
      fieldType: FieldType.TEXT_INPUT,
    } as PhoneInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);

      expect(result).toEqual(input.expectedOutput);
    });
  });

  it("return validity when validation is false with required true", () => {
    const inputs = [
      { value: "", expectedOutput: false },
      { value: "0", expectedOutput: false },
      { value: "1", expectedOutput: false },
      { value: "-1", expectedOutput: false },
      { value: "1.2", expectedOutput: false },
      { value: "1.200", expectedOutput: false },
      { value: "asd", expectedOutput: false },
      { value: "1.2.1", expectedOutput: false },
      { value: null, expectedOutput: false },
      { value: undefined, expectedOutput: false },
    ];
    const schemaItem = {
      validation: false,
      isRequired: true,
      fieldType: FieldType.TEXT_INPUT,
    } as PhoneInputFieldProps["schemaItem"];

    inputs.forEach((input) => {
      const result = isValid(schemaItem, input.value);

      expect(result).toEqual(input.expectedOutput);
    });
  });
});

describe("Phone Input Field formatting", () => {
  let formValues: () => Record<string, unknown>;
  let resetForm: (values: Record<string, unknown>) => void;
  let changeCountry: (countryCode: string, dialCode: string) => void;
  const setMetaInternalFieldState = jest.fn();

  beforeEach(() => {
    setMetaInternalFieldState.mockClear();
  });

  const latestFieldValidity = () => {
    const updaters = setMetaInternalFieldState.mock.calls.map(([fn]) => fn);
    const state = updaters.reduce((prev, update) => update(prev), {
      metaInternalFieldState: {},
    });

    return state.metaInternalFieldState.phone?.isValid;
  };

  const formContextValue = {
    executeAction: jest.fn(),
    renderMode: RenderModes.PAGE,
    setMetaInternalFieldState,
    updateWidgetMetaProperty: jest.fn(),
    updateWidgetProperty: jest.fn(),
    updateFormData: jest.fn(),
  };

  const captureForm = (methods: UseFormReturn) => {
    formValues = methods.getValues;
    resetForm = methods.reset;
  };

  function MockFormWrapper({
    children,
    onFormReady,
  }: {
    children: React.ReactNode;
    onFormReady: (methods: UseFormReturn) => void;
  }) {
    const methods = useForm();

    useEffect(
      function exposeFormMethods() {
        onFormReady(methods);
      },
      [methods, onFormReady],
    );

    return (
      <ThemeProvider theme={lightTheme}>
        <FormProvider {...methods}>
          <FormContext.Provider value={formContextValue}>
            {children}
          </FormContext.Provider>
        </FormProvider>
      </ThemeProvider>
    );
  }

  const renderPhoneField = async (
    schemaItemOverrides: Partial<PhoneInputFieldProps["schemaItem"]> = {},
  ) => {
    const schemaItem = {
      fieldType: FieldType.PHONE_NUMBER_INPUT,
      accessor: "phone",
      identifier: "phone",
      originalIdentifier: "phone",
      position: 0,
      label: "Phone",
      isVisible: true,
      isDisabled: false,
      isRequired: false,
      countryCode: "US",
      dialCode: "+1",
      allowDialCodeChange: false,
      children: {},
      dataType: DataType.STRING,
      isCustomField: false,
      sourceData: "",
      ...schemaItemOverrides,
    } as unknown as PhoneInputFieldProps["schemaItem"];

    const renderField = (item: PhoneInputFieldProps["schemaItem"]) => (
      <MockFormWrapper onFormReady={captureForm}>
        <PhoneInputField
          fieldClassName="phone"
          name="phone"
          propertyPath="schema.__root_schema__.children.phone"
          schemaItem={item}
        />
      </MockFormWrapper>
    );

    const result = render(renderField(schemaItem));

    changeCountry = (countryCode: string, dialCode: string) =>
      result.rerender(renderField({ ...schemaItem, countryCode, dialCode }));

    // The Field component applies the default value in a setTimeout.
    if (schemaItem.defaultValue !== undefined) {
      await waitFor(() =>
        expect(formValues().phone).toBe(schemaItem.defaultValue),
      );
    }

    return result.container.querySelector(
      "input[type='tel']",
    ) as HTMLInputElement;
  };

  // Types one character at a time, like a user would.
  const typeInto = (input: HTMLInputElement, characters: string) => {
    characters.split("").forEach((character) => {
      fireEvent.change(input, { target: { value: input.value + character } });
    });
  };

  const backspace = (input: HTMLInputElement, times: number) => {
    for (let i = 0; i < times; i++) {
      fireEvent.change(input, { target: { value: input.value.slice(0, -1) } });
    }
  };

  it("formats an unformatted default value for the selected country", async () => {
    const input = await renderPhoneField({ defaultValue: "2025550106" });

    expect(input.value).toBe("(202) 555-0106");
    expect(formValues().phone).toBe("2025550106");
  });

  it("keeps a default value that is already formatted", async () => {
    const input = await renderPhoneField({ defaultValue: "(202) 555-0106" });

    expect(input.value).toBe("(202) 555-0106");
  });

  it("formats the number while typing and stores only the digits", async () => {
    const input = await renderPhoneField();

    typeInto(input, "2025550106");

    expect(input.value).toBe("(202) 555-0106");
    expect(formValues().phone).toBe("2025550106");
  });

  it("lets formatting characters be deleted", async () => {
    const input = await renderPhoneField();

    typeInto(input, "2025");
    expect(input.value).toBe("(202) 5");

    backspace(input, 3);

    expect(input.value).toBe("(202");
    expect(formValues().phone).toBe("202");
  });

  it("lets a bracket be deleted from a formatted default value", async () => {
    const input = await renderPhoneField({ defaultValue: "2025550106" });

    fireEvent.change(input, { target: { value: "(202 555-0106" } });

    expect(input.value).toBe("(202 555-0106");
    expect(formValues().phone).toBe("2025550106");
  });

  it("keeps the digits as typed after every formatting character is deleted", async () => {
    const input = await renderPhoneField({ defaultValue: "2025550106" });

    expect(input.value).toBe("(202) 555-0106");

    ["(", ")", " ", "-"].forEach((character) => {
      fireEvent.change(input, {
        target: { value: input.value.replace(character, "") },
      });
    });

    expect(input.value).toBe("2025550106");
    expect(formValues().phone).toBe("2025550106");
  });

  it("formats the typed number again when the country changes", async () => {
    const input = await renderPhoneField();

    typeInto(input, "2025550106");
    expect(input.value).toBe("(202) 555-0106");

    changeCountry("GB", "+44");

    const gbText = new AsYouType("GB").input("2025550106");

    expect(gbText).not.toBe("(202) 555-0106");
    expect(input.value).toBe(gbText);
    expect(formValues().phone).toBe("2025550106");
  });

  it("formats the value again after the form is reset", async () => {
    const input = await renderPhoneField();

    typeInto(input, "2025");
    act(() => resetForm({ phone: "4155550132" }));

    expect(input.value).toBe("(415) 555-0132");
  });

  it("formats for the country set on the field", async () => {
    const input = await renderPhoneField({
      countryCode: "GB",
      dialCode: "+44",
      defaultValue: "07400123456",
    });

    expect(input.value).toBe("07400 123456");
  });

  it("still validates the regex against the digits, not the formatted text", async () => {
    const input = await renderPhoneField({
      defaultValue: "2025550106",
      regex: "^\\d{10}$",
    });

    expect(input.value).toBe("(202) 555-0106");
    expect(latestFieldValidity()).toBe(true);
  });
});

describe("Phone Input Field transformValue", () => {
  it("formats the text for the country and keeps only digits in the value", () => {
    expect(transformValue("2025550106", "", "US")).toEqual({
      text: "(202) 555-0106",
      value: "2025550106",
    });
    expect(transformValue("07400123456", "", "GB")).toEqual({
      text: "07400 123456",
      value: "07400123456",
    });
  });

  it("does not format while characters are being deleted", () => {
    expect(transformValue("(202", "(202)", "US")).toEqual({
      text: "(202",
      value: "202",
    });
  });

  it("returns an empty value for empty text", () => {
    expect(transformValue("", "(2", "US")).toEqual({ text: "", value: "" });
  });
});
