import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { FormProvider, useForm } from "react-hook-form";

import { FormContextProvider } from "../FormContext";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import { FieldType } from "../constants";

const initialFieldState = {
  fieldValidity: {
    lastName: {
      isValid: false,
    },
    firstName: {
      isValid: false,
    },
    array: [
      {
        first: {
          isValid: false,
        },
      },
    ],
  },
};

describe("useRegisterFieldInvalid", () => {
  it("updates fieldState and error state with the updated isValid value", () => {
    const mockSetFieldValidityState = jest.fn();
    function Wrapper({ children }: any) {
      const methods = useForm();

      return (
        <FormContextProvider
          executeAction={jest.fn}
          renderMode="CANVAS"
          setFieldValidityState={mockSetFieldValidityState}
          updateWidgetMetaProperty={jest.fn}
          updateWidgetProperty={jest.fn}
        >
          <FormProvider {...methods}>{children}</FormProvider>
        </FormContextProvider>
      );
    }

    const fieldName = "array[0].first";
    const { result } = renderHook(
      () =>
        useRegisterFieldValidity({
          fieldName,
          fieldType: FieldType.TEXT,
        }),
      {
        wrapper: Wrapper,
      },
    );

    const expectedUpdatedFieldState = {
      fieldValidity: {
        lastName: {
          isValid: false,
        },
        firstName: {
          isValid: false,
        },
        array: [
          {
            first: {
              isValid: true,
            },
          },
        ],
      },
    };

    result.current.onFieldValidityChange(true);

    expect(mockSetFieldValidityState).toBeCalledTimes(1);
    const cbResult = mockSetFieldValidityState.mock.calls[0][0](
      initialFieldState,
    );
    expect(cbResult).toEqual(expectedUpdatedFieldState);
  });

  it("does not trigger meta update if field validity is same", () => {
    const mockSetFieldValidityState = jest.fn();
    function Wrapper({ children }: any) {
      const methods = useForm();

      return (
        <FormContextProvider
          executeAction={jest.fn}
          renderMode="CANVAS"
          setFieldValidityState={mockSetFieldValidityState}
          updateWidgetMetaProperty={jest.fn}
          updateWidgetProperty={jest.fn}
        >
          <FormProvider {...methods}>{children}</FormProvider>
        </FormContextProvider>
      );
    }

    const fieldName = "array[0].first";
    const { result } = renderHook(
      () =>
        useRegisterFieldValidity({
          fieldName,
          fieldType: FieldType.TEXT,
        }),
      {
        wrapper: Wrapper,
      },
    );

    result.current.onFieldValidityChange(true);

    expect(mockSetFieldValidityState).toBeCalledTimes(1);
    result.current.onFieldValidityChange(true);
    expect(mockSetFieldValidityState).toBeCalledTimes(1);
  });
});
