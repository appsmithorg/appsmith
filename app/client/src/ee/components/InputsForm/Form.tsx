import React, { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import type { PropsWithChildren } from "react";
import { InputsFormContextProvider } from "./InputsFormContext";

interface EvalValues {
  useWatchEvalAndSetForm: (methods: UseFormReturn<any, any>) => void;
  useWatchEvalPath: (name: string) => any;
}

export type FormProps<TValues> = PropsWithChildren<{
  defaultValues: TValues;
  onUpdateForm: (values: TValues) => void;
  useEvalValues?: () => EvalValues;
}>;

function Form<TValues extends FieldValues>({
  children,
  defaultValues,
  onUpdateForm,
  useEvalValues,
}: FormProps<TValues>) {
  const methods = useForm<TValues>({
    defaultValues: defaultValues as any,
  });
  const { watch } = methods;
  const { useWatchEvalAndSetForm, useWatchEvalPath } = useEvalValues?.() || {};

  useWatchEvalAndSetForm?.(methods);

  useEffect(() => {
    const subscription = watch((values) => {
      onUpdateForm(values as TValues);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <InputsFormContextProvider useWatchEvalPath={useWatchEvalPath}>
      <FormProvider {...methods}>{children}</FormProvider>
    </InputsFormContextProvider>
  );
}

export default Form;
