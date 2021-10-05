import React, { PropsWithChildren } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

type FormProps<TValues> = PropsWithChildren<{
  defaultValues: TValues;
  onSubmit: SubmitHandler<TValues>;
}>;

function Form<TValues>({
  children,
  defaultValues,
  onSubmit,
}: FormProps<TValues>) {
  const methods = useForm({
    defaultValues,
  });
  const { getValues, watch } = methods;

  // eslint-disable-next-line
  console.log("FORM VALUES", watch());

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
}

export default Form;
