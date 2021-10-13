import React from "react";
import { noop, omit } from "lodash";
import { ControllerRenderProps } from "react-hook-form";

import Field from "widgets/FormBuilderWidget/component/Field";
import InputComponent, {
  InputComponentProps,
} from "widgets/InputWidget/component";
import { CONFIG as INPUT_WIDGET_CONFIG } from "widgets/InputWidget";
import { INPUT_FIELD_TYPE, SchemaItem } from "../constants";

const BLACKLISTED_DEFAULT_CONFIG_KEYS = [
  "columns",
  "rows",
  "version",
  "widgetName",
];

const DEFAULT_CONFIG = omit(
  INPUT_WIDGET_CONFIG.defaults,
  BLACKLISTED_DEFAULT_CONFIG_KEYS,
);

type InputFieldProps = InputComponentProps & {
  name: ControllerRenderProps["name"];
  schemaItem: SchemaItem;
};

function InputField({ name, schemaItem }: InputFieldProps) {
  // eslint-disable-next-line

  const { fieldType, label } = schemaItem;
  const inputType = INPUT_FIELD_TYPE[fieldType];

  return (
    <Field
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <InputComponent
          {...DEFAULT_CONFIG}
          compactMode={false}
          inputRef={ref}
          inputType={inputType}
          isInvalid={false}
          isLoading={false}
          label={label}
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

export default InputField;
