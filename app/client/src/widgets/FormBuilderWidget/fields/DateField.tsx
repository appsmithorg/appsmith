import React from "react";
import { pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import DateComponent from "widgets/DatePickerWidget2/component";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "./types";

type DateComponentProps = FieldComponentBaseProps & {
  dateFormat: string;
  onDateSelected?: string;
  maxDate: string;
  minDate: string;
  closeOnSelection: boolean;
  shortcuts: boolean;
};

const COMPONENT_DEFAULT_VALUES: DateComponentProps = {
  closeOnSelection: false,
  dateFormat: "YYYY-MM-DD HH:mm",
  isDisabled: false,
  label: "",
  maxDate: "2121-12-31T18:29:00.000Z",
  minDate: "1920-12-31T18:30:00.000Z",
  shortcuts: false,
};

type DateFieldProps = BaseFieldComponentProps<DateComponentProps>;

function DateField({ name, schemaItem, ...rest }: DateFieldProps) {
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
      render={({ field: { onChange, value } }) => (
        <DateComponent
          closeOnSelection={schemaItem.closeOnSelection}
          dateFormat={schemaItem.dateFormat}
          datePickerType="DATE_PICKER"
          isDisabled={schemaItem.isDisabled}
          isLoading={false}
          label=""
          onDateSelected={onChange}
          selectedDate={value}
          shortcuts={schemaItem.shortcuts}
          widgetId=""
        />
      )}
    />
  );
}

DateField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default DateField;
