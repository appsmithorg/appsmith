import React from "react";
import { pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import {
  SwitchComponent,
  SwitchComponentProps,
} from "widgets/SwitchWidget/component";
import { BaseFieldComponentProps } from "./types";
import { CONFIG } from "widgets/SwitchWidget";

const COMPONENT_DEFAULT_VALUES = pick(CONFIG.defaults, ["isDisabled"]);

type PICKED_DEFAULT_PROPS = keyof typeof COMPONENT_DEFAULT_VALUES;

type SwitchComponentOwnProps = Pick<SwitchComponentProps, PICKED_DEFAULT_PROPS>;

type SwitchFieldProps = BaseFieldComponentProps<SwitchComponentOwnProps>;

function SwitchField({ name, schemaItem }: SwitchFieldProps) {
  const { label, props } = schemaItem;

  return (
    <Field
      label={label}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <SwitchComponent
          {...props}
          alignWidget="LEFT"
          inputRef={ref}
          isLoading={false}
          isSwitchedOn={value}
          label=""
          onBlurHandler={onBlur}
          onChange={onChange}
          widgetId=""
        />
      )}
    />
  );
}

SwitchField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default SwitchField;
