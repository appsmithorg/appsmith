import React from "react";
import { act, renderHook } from "@testing-library/react-hooks";
import { FormProvider, useForm } from "react-hook-form";

import { FormContextProvider } from "../FormContext";
import type { UseRegisterFieldValidityProps } from "./useRegisterFieldValidity";
import useRegisterFieldValidity from "./useRegisterFieldValidity";
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

describe("useRegisterFieldInvalid - setMetaInternalFieldState", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it("calls clearErrors when isValid is true and error is present", () => {
    const mocksetMetaInternalFieldState = jest.fn();
    const mockClearErrors = jest.fn();
    const mockSetError = jest.fn();
    const mockGetFieldState = jest
      .fn()
      .mockReturnValue({ error: { message: "Some error" } });

    function Wrapper({ children }: { children: React.ReactNode }) {
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
          <FormProvider
            {...methods}
            clearErrors={mockClearErrors}
            getFieldState={mockGetFieldState}
            setError={mockSetError}
          >
            {children}
          </FormProvider>
        </FormContextProvider>
      );
    }

    const fieldName = "testField";

    act(() => {
      renderHook(
        () =>
          useRegisterFieldValidity({
            isValid: true,
            fieldName,
            fieldType: FieldType.TEXT_INPUT,
          }),
        {
          wrapper: Wrapper,
        },
      );

      jest.runAllTimers();
    });

    expect(mockClearErrors).toBeCalledWith(fieldName);
    expect(mockSetError).not.toBeCalled();
  });

  it("does not call clearErrors when isValid is false", () => {
    const mocksetMetaInternalFieldState = jest.fn();
    const mockClearErrors = jest.fn();
    const mockSetError = jest.fn();
    const mockGetFieldState = jest
      .fn()
      .mockReturnValue({ error: { message: "Some error" } });

    function Wrapper({ children }: { children: React.ReactNode }) {
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
          <FormProvider
            {...methods}
            clearErrors={mockClearErrors}
            getFieldState={mockGetFieldState}
            setError={mockSetError}
          >
            {children}
          </FormProvider>
        </FormContextProvider>
      );
    }

    const fieldName = "testField";
    act(() => {
      renderHook(
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
      jest.runAllTimers();
    });

    expect(mockClearErrors).not.toBeCalled();
  });

  it("does not call clearErrors when there is no existing error", () => {
    const mocksetMetaInternalFieldState = jest.fn();
    const mockClearErrors = jest.fn();
    const mockSetError = jest.fn();
    const mockGetFieldState = jest.fn().mockReturnValue({ error: null });

    function Wrapper({ children }: { children: React.ReactNode }) {
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
          <FormProvider
            {...methods}
            clearErrors={mockClearErrors}
            getFieldState={mockGetFieldState}
            setError={mockSetError}
          >
            {children}
          </FormProvider>
        </FormContextProvider>
      );
    }

    const fieldName = "testField";

    act(() => {
      renderHook(
        () =>
          useRegisterFieldValidity({
            isValid: true,
            fieldName,
            fieldType: FieldType.TEXT_INPUT,
          }),
        {
          wrapper: Wrapper,
        },
      );

      jest.runAllTimers();
    });

    expect(mockClearErrors).not.toBeCalled();
    expect(mockSetError).not.toBeCalled();
  });

  it("calls setError when isValid is false and error is not present", () => {
    const mocksetMetaInternalFieldState = jest.fn();
    const mockClearErrors = jest.fn();
    const mockSetError = jest.fn();

    function Wrapper({ children }: { children: React.ReactNode }) {
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
          <FormProvider
            {...methods}
            clearErrors={mockClearErrors}
            setError={mockSetError}
          >
            {children}
          </FormProvider>
        </FormContextProvider>
      );
    }

    const fieldName = "testField";

    act(() => {
      renderHook(
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
    });

    jest.runAllTimers();

    expect(mockSetError).toBeCalledTimes(1);
    expect(mockClearErrors).not.toBeCalledWith(fieldName);
  });

  it("updates fieldState and error state with the updated isValid value", () => {
    const mocksetMetaInternalFieldState = jest.fn();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const cbResult =
      mocksetMetaInternalFieldState.mock.calls[1][0](initialFieldState);

    expect(cbResult).toEqual(expectedUpdatedFieldState);
  });

  it("does not trigger meta update if field validity is same", () => {
    const mocksetMetaInternalFieldState = jest.fn();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
