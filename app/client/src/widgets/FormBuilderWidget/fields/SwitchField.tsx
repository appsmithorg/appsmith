import React from "react";
import { pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import { AlignWidget } from "widgets/constants";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "../constants";
import { SwitchComponent } from "widgets/SwitchWidget/component";

type SwitchComponentOwnProps = FieldComponentBaseProps & {
  alignWidget: AlignWidget;
};

type SwitchFieldProps = BaseFieldComponentProps<SwitchComponentOwnProps>;

const COMPONENT_DEFAULT_VALUES: SwitchComponentOwnProps = {
  alignWidget: "LEFT",
  isDisabled: false,
  isVisible: true,
  label: "",
};

function SwitchField({ name, schemaItem, ...rest }: SwitchFieldProps) {
  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  return (
    <Field
      {...rest}
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <SwitchComponent
          alignWidget={schemaItem.alignWidget}
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
