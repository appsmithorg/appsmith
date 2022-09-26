import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { FormProvider, useForm } from "react-hook-form";

import { FormContextProvider } from "../FormContext";
import useRegisterFieldValidity, {
  UseRegisterFieldValidityProps,
} from "./useRegisterFieldValidity";
import { FieldType } from "../constants";

const initialFieldState = {
  metaInternalFieldState: {
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
    const mocksetMetaInternalFieldState = jest.fn();
    function Wrapper({ children }: any) {
      const methods = useForm();

      return (
        <FormContextProvider
          executeAction={jest.fn}
          renderMode="CANVAS"
          setMetaInternalFieldState={mocksetMetaInternalFieldState}
          updateFormData={jest.fn}
          updateWidgetMetaProperty={jest.fn}
          updateWidgetProperty={jest.fn}
        >
          <FormProvider {...methods}>{children}</FormProvider>
        </FormContextProvider>
      );
    }

    const fieldName = "array[0].first";
    const { rerender } = renderHook(
      ({ fieldName, isValid }: UseRegisterFieldValidityProps) =>
        useRegisterFieldValidity({
          isValid,
          fieldName,
          fieldType: FieldType.TEXT_INPUT,
        }),
      {
        wrapper: Wrapper,
        initialProps: {
          isValid: false,
          fieldName,
          fieldType: FieldType.TEXT_INPUT,
        },
      },
    );

    const expectedUpdatedFieldState = {
      metaInternalFieldState: {
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

    expect(mocksetMetaInternalFieldState).toBeCalledTimes(1);

    rerender({
      isValid: true,
      fieldName,
      fieldType: FieldType.TEXT_INPUT,
    });

    expect(mocksetMetaInternalFieldState).toBeCalledTimes(2);
    const cbResult = mocksetMetaInternalFieldState.mock.calls[1][0](
      initialFieldState,
    );

    expect(cbResult).toEqual(expectedUpdatedFieldState);
  });

  it("does not trigger meta update if field validity is same", () => {
    const mocksetMetaInternalFieldState = jest.fn();
    function Wrapper({ children }: any) {
      const methods = useForm();

      return (
        <FormContextProvider
          executeAction={jest.fn}
          renderMode="CANVAS"
          setMetaInternalFieldState={mocksetMetaInternalFieldState}
          updateFormData={jest.fn}
          updateWidgetMetaProperty={jest.fn}
          updateWidgetProperty={jest.fn}
        >
          <FormProvider {...methods}>{children}</FormProvider>
        </FormContextProvider>
      );
    }

    const fieldName = "array[0].first";
    const { rerender } = renderHook(
      () =>
        useRegisterFieldValidity({
          isValid: false,
          fieldName,
          fieldType: FieldType.TEXT_INPUT,
        }),
      {
        wrapper: Wrapper,
      },
    );

    rerender({
      isValid: true,
      fieldName,
      fieldType: FieldType.TEXT_INPUT,
    });

    expect(mocksetMetaInternalFieldState).toBeCalledTimes(1);
    rerender({
      isValid: true,
      fieldName,
      fieldType: FieldType.TEXT_INPUT,
    });
    expect(mocksetMetaInternalFieldState).toBeCalledTimes(1);
  });
});
