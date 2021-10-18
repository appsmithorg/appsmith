import React, { PropsWithChildren } from "react";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  DefaultValues,
} from "react-hook-form";

type FormProps<TValues = any> = PropsWithChildren<{
  defaultValues: DefaultValues<TValues>;
  onSubmit: SubmitHandler<TValues>;
}>;

function Form<TValues = any>({
  children,
  defaultValues,
  onSubmit,
}: FormProps<TValues>) {
  const methods = useForm({
    defaultValues,
  });
  const { getValues, watch } = methods;

  // TODO: Using watch here would lead to re-rendering of every field component.
  // Find alternative
  // eslint-disable-next-line
  console.log("FORM VALUES", watch());

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
}

export default Form;
