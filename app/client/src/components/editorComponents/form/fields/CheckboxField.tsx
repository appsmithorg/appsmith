import Checkbox, { CheckboxProps } from "components/ads/Checkbox";
import React from "react";
import { Field, BaseFieldProps } from "redux-form";

type RenderComponentProps = CheckboxProps & {
  input?: {
    onChange?: (value: boolean) => void;
    value?: boolean;
    checked?: boolean;
    name?: string;
  };
};

const RenderComponent = (props: RenderComponentProps) => {
  const onChangeHandler = (value: boolean) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  return (
    <Checkbox
      isDefaultChecked={props.input?.checked}
      label={props.label}
      onCheckChange={onChangeHandler}
      info={props.info}
      cypressSelector={props.input?.name}
    />
  );
};

export const CheckboxField = (props: BaseFieldProps & CheckboxProps) => {
  return <Field type="checkbox" component={RenderComponent} {...props} />;
};

export default CheckboxField;
