import React from "react";
import type { BaseFieldProps } from "redux-form";
import { Field } from "redux-form";
import type { TextInputProps } from "design-system-old";
import { TextInput } from "design-system-old";

type RenderComponentProps = TextInputProps & {
  input?: {
    onChange?: (value: number) => void;
    value?: number;
  };
};

function RenderComponent(props: RenderComponentProps) {
  const onChangeHandler = (value: number) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  return (
    <TextInput
      dataType={props.dataType}
      defaultValue={props.input?.value?.toString()}
      onChange={(value: string) => onChangeHandler(Number(value))}
    />
  );
}

class NumberField extends React.Component<BaseFieldProps & TextInputProps> {
  render() {
    return (
      <Field
        component={RenderComponent}
        {...this.props}
        disabled={this.props.disabled}
        noValidate
      />
    );
  }
}

export default NumberField;
