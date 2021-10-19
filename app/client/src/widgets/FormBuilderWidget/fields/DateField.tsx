import React from "react";
import { pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import DateComponent, {
  DatePickerComponentProps,
} from "widgets/DatePickerWidget2/component";
import { BaseFieldComponentProps } from "./types";
import { CONFIG } from "widgets/DatePickerWidget2";

const COMPONENT_DEFAULT_VALUES = pick(CONFIG.defaults, [
  "closeOnSelection",
  "dateFormat",
  "isDisabled",
  "maxDate",
  "minDate",
  "shortcuts",
]);

type PICKED_DEFAULT_PROPS = keyof typeof COMPONENT_DEFAULT_VALUES;

type DateComponentOwnProps = Pick<
  DatePickerComponentProps,
  PICKED_DEFAULT_PROPS
>;

type DateFieldProps = BaseFieldComponentProps<DateComponentOwnProps>;

function DateField({ name, schemaItem, ...rest }: DateFieldProps) {
  const { label, props } = schemaItem;

  return (
    <Field
      {...rest}
      label={label}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <DateComponent
          {...props}
          datePickerType="DATE_PICKER"
          isLoading={false}
          label=""
          onDateSelected={onChange}
          selectedDate={value}
          widgetId=""
        />
      )}
    />
  );
}

DateField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default DateField;
