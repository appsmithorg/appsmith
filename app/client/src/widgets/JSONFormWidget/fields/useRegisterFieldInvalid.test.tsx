import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { FormProvider, useForm } from "react-hook-form";

import { FormContextProvider } from "../FormContext";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import { FieldType } from "../constants";

const initialFieldState = {
  lastName: {
    isValid: false,
    isVisible: true,
  },
  firstName: {
    isValid: false,
    isVisible: true,
  },
  array: [
    {
      first: {
        isValid: false,
        isVisible: true,
      },
    },
  ],
};

describe("useRegisterFieldInvalid", () => {
  it("updates fieldState and error state with the updated isValid value", () => {
    const mockUpdateWidgetMetaProperty = jest.fn();
    function Wrapper({ children }: any) {
      const methods = useForm();

      return (
        <FormContextProvider
          executeAction={jest.fn}
          fieldState={initialFieldState}
          renderMode="CANVAS"
          updateWidgetMetaProperty={mockUpdateWidgetMetaProperty}
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
      lastName: {
        isValid: false,
        isVisible: true,
      },
      firstName: {
        isValid: false,
        isVisible: true,
      },
      array: [
        {
          first: {
            isValid: true,
            isVisible: true,
          },
        },
      ],
    };

    result.current.onFieldValidityChange(true);

    expect(mockUpdateWidgetMetaProperty).toBeCalledTimes(1);
    expect(mockUpdateWidgetMetaProperty).toBeCalledWith(
      "fieldState",
      expectedUpdatedFieldState,
    );
  });

  it("does not trigger meta update if field validity is same", () => {
    const mockUpdateWidgetMetaProperty = jest.fn();
    function Wrapper({ children }: any) {
      const methods = useForm();

      return (
        <FormContextProvider
          executeAction={jest.fn}
          fieldState={initialFieldState}
          renderMode="CANVAS"
          updateWidgetMetaProperty={mockUpdateWidgetMetaProperty}
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
      lastName: {
        isValid: false,
        isVisible: true,
      },
      firstName: {
        isValid: false,
        isVisible: true,
      },
      array: [
        {
          first: {
            isValid: true,
            isVisible: true,
          },
        },
      ],
    };

    result.current.onFieldValidityChange(true);

    expect(mockUpdateWidgetMetaProperty).toBeCalledTimes(1);
    expect(mockUpdateWidgetMetaProperty).toBeCalledWith(
      "fieldState",
      expectedUpdatedFieldState,
    );

    result.current.onFieldValidityChange(true);
    expect(mockUpdateWidgetMetaProperty).toBeCalledTimes(1);
  });
});
