import { noop } from "lodash";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import InputComponent, {
  InputComponentProps,
} from "widgets/InputWidget/component";
import Field from "widgets/FormBuilderWidget/component/Field";

type InputFieldProps = InputComponentProps & {
  name: ControllerRenderProps["name"];
};

function InputField({ name, ...rest }: InputFieldProps) {
  // eslint-disable-next-line
  console.log("INPUTFIELD");
  return (
    <Field
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <InputComponent
          {...rest}
          inputRef={ref}
          onBlurHandler={onBlur}
          onCurrencyTypeChange={noop}
          onFocusChange={noop}
          onValueChange={onChange}
          value={value}
        />
      )}
    />
  );
}

export default InputField;
