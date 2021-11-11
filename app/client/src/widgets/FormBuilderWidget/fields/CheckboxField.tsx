import React from "react";
import { pick } from "lodash";

import CheckboxComponent from "widgets/CheckboxWidget/component";
import Field from "widgets/FormBuilderWidget/component/Field";
import { AlignWidget } from "widgets/constants";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "./types";

type CheckboxComponentProps = FieldComponentBaseProps & {
  alignWidget: AlignWidget;
  onCheckChange?: string;
};

type CheckboxFieldProps = BaseFieldComponentProps<CheckboxComponentProps>;

function CheckboxField({ name, schemaItem, ...rest }: CheckboxFieldProps) {
  const { isRequired, label } = schemaItem;
  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  return (
    <Field
      {...rest}
      label={label}
      labelStyles={labelStyles}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <CheckboxComponent
          alignWidget="LEFT"
          inputRef={ref}
          isChecked={value}
          isLoading={false}
          isRequired={isRequired}
          label=""
          onBlurHandler={onBlur}
          onCheckChange={onChange}
          // TODO: Handle default value of rowSpace
          rowSpace={20}
          widgetId=""
        />
      )}
    />
  );
}

CheckboxField.componentDefaultValues = {};

export default CheckboxField;
