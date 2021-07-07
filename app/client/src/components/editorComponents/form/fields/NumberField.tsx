import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import TextInput, { TextInputProps } from "components/ads/TextInput";

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
