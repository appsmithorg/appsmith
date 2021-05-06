import React from "react";
import _ from "lodash";
import { Field } from "redux-form";
import RadioGroupWrapper, { RadioGroupWrapperProps } from "./RadioGroupWrapper";

interface RadioFieldProps {
  name: string;
  className?: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  placeholder: string;
}

const renderComponent = (
  componentProps: RadioFieldProps & RadioGroupWrapperProps,
) => {
  return <RadioGroupWrapper {...componentProps} />;
};

function RadioFieldGroup(
  props: RadioFieldProps & Partial<RadioGroupWrapperProps>,
) {
  return (
    <Field
      className={props.className}
      component={renderComponent}
      format={(value: string) => _.find(props.options, { value }) || ""}
      normalize={(option: { value: string }) => option.value}
      {...props}
    />
  );
}

export default RadioFieldGroup;
