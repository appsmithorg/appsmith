import React, { PropsWithChildren, useEffect } from "react";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  DefaultValues,
} from "react-hook-form";

type FormProps<TValues = any> = PropsWithChildren<{
  formData: DefaultValues<TValues>;
  onSubmit: SubmitHandler<TValues>;
  useFormDataValues: boolean;
}>;

function Form<TValues = any>({
  children,
  formData,
  onSubmit,
  useFormDataValues,
}: FormProps<TValues>) {
  const methods = useForm();
  const { reset, watch } = methods;

  // TODO: Using watch here would lead to re-rendering of every field component.
  // Find alternative
  // eslint-disable-next-line
  console.log("FORM VALUES", watch());

  useEffect(() => {
    // If the user chooses to use the formData's values as default value (useful when
    // Table.selectedRow is set as the formData)
    if (useFormDataValues) {
      reset(formData);
    }
  }, [formData, useFormDataValues]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
}

export default Form;
