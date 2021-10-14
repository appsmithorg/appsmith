import React from "react";
import { omit } from "lodash";
import { ControllerRenderProps } from "react-hook-form";

import Field from "widgets/FormBuilderWidget/component/Field";
import { SwitchComponent } from "widgets/SwitchWidget/component";
import { CONFIG as SWITCH_WIDGET_CONFIG } from "widgets/SwitchWidget";
import { SchemaItem } from "../constants";

const BLACKLISTED_DEFAULT_CONFIG_KEYS = [
  "label",
  "columns",
  "rows",
  "version",
  "widgetName",
  "defaultSwitchState",
];

const DEFAULT_CONFIG = omit(
  SWITCH_WIDGET_CONFIG.defaults,
  BLACKLISTED_DEFAULT_CONFIG_KEYS,
);

type SwitchFieldProps = {
  name: ControllerRenderProps["name"];
  schemaItem: SchemaItem;
};

function SwitchField({ name, schemaItem }: SwitchFieldProps) {
  const { label } = schemaItem;

  return (
    <Field
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <SwitchComponent
          {...DEFAULT_CONFIG}
          alignWidget="LEFT"
          inputRef={ref}
          isLoading={false}
          isSwitchedOn={value}
          label={label}
          onBlurHandler={onBlur}
          onChange={onChange}
          widgetId=""
        />
      )}
    />
  );
}

export default SwitchField;
