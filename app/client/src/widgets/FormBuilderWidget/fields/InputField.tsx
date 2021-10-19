import React from "react";
import { noop, pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import InputComponent, {
  InputComponentProps,
} from "widgets/InputWidget/component";
import { BaseFieldComponentProps } from "./types";
import { CONFIG } from "widgets/InputWidget";
import { INPUT_FIELD_TYPE } from "../constants";

const COMPONENT_DEFAULT_VALUES = pick(CONFIG.defaults, ["isDisabled"]);

type PICKED_DEFAULT_PROPS = keyof typeof COMPONENT_DEFAULT_VALUES;

type InputComponentOwnProps = Pick<InputComponentProps, PICKED_DEFAULT_PROPS>;

type InputFieldProps = BaseFieldComponentProps<InputComponentOwnProps>;

function InputField({ name, schemaItem, ...rest }: InputFieldProps) {
  const { fieldType, label, props } = schemaItem;
  const { isDisabled } = props;
  const inputType = INPUT_FIELD_TYPE[fieldType];

  return (
    <Field
      {...rest}
      label={label}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <InputComponent
          compactMode={false}
          disabled={isDisabled}
          inputRef={ref}
          inputType={inputType}
          isInvalid={false}
          isLoading={false}
          label=""
          multiline={false}
          onBlurHandler={onBlur}
          onCurrencyTypeChange={noop}
          onFocusChange={noop}
          onISDCodeChange={noop}
          onValueChange={onChange}
          showError={false}
          value={value}
          widgetId=""
        />
      )}
    />
  );
}

InputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default InputField;
