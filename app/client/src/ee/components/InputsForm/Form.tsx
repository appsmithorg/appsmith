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
}>;

function Form<TValues extends FieldValues>({
  children,
  dataTreePathPrefix,
  defaultValues,
  evaluatedValues,
  onUpdateForm,
}: FormProps<TValues>) {
  const currentValues = useRef<TValues>(defaultValues);
  const methods = useForm<TValues>({
    defaultValues: defaultValues as any,
  });
  const { watch } = methods;

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
  }, []);

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
