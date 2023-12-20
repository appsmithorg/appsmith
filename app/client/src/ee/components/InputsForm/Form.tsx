import React, { useEffect, useRef } from "react";
import type { FieldValues } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import type { PropsWithChildren } from "react";
import { InputsFormContextProvider } from "./InputsFormContext";
import equal from "fast-deep-equal/es6";
import { klona } from "klona";

export type FormProps<TValues> = PropsWithChildren<{
  dataTreePathPrefix?: string;
  defaultValues: TValues;
  onUpdateForm: (values: TValues) => void;
  evaluatedValues?: Record<string, unknown>;
  triggerReset?: boolean;
  onResetComplete?: () => void;
}>;

function Form<TValues extends FieldValues>({
  children,
  dataTreePathPrefix,
  defaultValues,
  evaluatedValues,
  onResetComplete,
  onUpdateForm,
  triggerReset,
}: FormProps<TValues>) {
  const currentValues = useRef<TValues>(defaultValues);
  const methods = useForm<TValues>({
    defaultValues: defaultValues as any,
  });
  const { reset, watch } = methods;

  useEffect(() => {
    const subscription = watch((values) => {
      if (!equal(currentValues.current, values)) {
        onUpdateForm(values as TValues);
        currentValues.current = klona(values) as TValues;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onUpdateForm, currentValues.current]);

  useEffect(() => {
    if (triggerReset) {
      currentValues.current = klona(defaultValues);
      reset(defaultValues as any);
      onResetComplete?.();
    }
  }, [triggerReset, onResetComplete, reset, defaultValues]);

  return (
    <InputsFormContextProvider
      dataTreePathPrefix={dataTreePathPrefix}
      evaluatedValues={evaluatedValues}
    >
      <FormProvider {...methods}>{children}</FormProvider>
    </InputsFormContextProvider>
  );
}

export default Form;
