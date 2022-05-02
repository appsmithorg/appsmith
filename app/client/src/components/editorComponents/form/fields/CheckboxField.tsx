import Checkbox, { CheckboxProps } from "components/ads/Checkbox";
import React from "react";
// @ts-expect-error: redux-form import
import { Field, BaseFieldProps } from "redux-form/dist/redux-form";

type RenderComponentProps = CheckboxProps & {
  input?: {
    onChange?: (value: boolean) => void;
    value?: boolean;
    checked?: boolean;
    name?: string;
  };
};

function RenderComponent(props: RenderComponentProps) {
  const onChangeHandler = (value: boolean) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  return (
    <Checkbox
      cypressSelector={props.input?.name}
      info={props.info}
      isDefaultChecked={props.input?.checked}
      label={props.label}
      onCheckChange={onChangeHandler}
    />
  );
}

export function CheckboxField(props: BaseFieldProps & CheckboxProps) {
  return <Field component={RenderComponent} type="checkbox" {...props} />;
}

export default CheckboxField;
