import React, { PropsWithChildren } from "react";
import { FormProvider, useForm } from "react-hook-form";

type FormProps = PropsWithChildren<{
  onSubmit: (data: Record<string, any>) => void;
}>;

function Form(props: FormProps) {
  const methods = useForm();
  const { getValues, watch } = methods;

  const { children, onSubmit } = props;

  // eslint-disable-next-line
  console.log("FORM VALUES", watch());

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
}

export default Form;
