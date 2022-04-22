import moment from "moment";
import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { useController } from "react-hook-form";

import DateComponent from "widgets/DatePickerWidget2/component";
import Field from "widgets/JSONFormWidget/component/Field";
import FormContext from "../FormContext";
import useEvents from "./useBlurAndFocusEvents";
import useRegisterFieldValidity from "./useRegisterFieldValidity";
import {
  FieldComponentBaseProps,
  BaseFieldComponentProps,
  FieldEventProps,
  ComponentDefaultValuesFnProps,
} from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { dateFormatOptions } from "../widget/propertyConfig/properties/date";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";

type DateComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    closeOnSelection: boolean;
    convertToISO: boolean;
    dateFormat: string;
    maxDate: string;
    minDate: string;
    onDateChange?: string;
    onDateSelected?: string;
    shortcuts: boolean;
    timePrecision: TimePrecision;
  };

const COMPONENT_DEFAULT_VALUES = {
  closeOnSelection: false,
  convertToISO: false,
  dateFormat: "YYYY-MM-DD HH:mm",
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "",
  maxDate: "2121-12-31T18:29:00.000Z",
  minDate: "1920-12-31T18:30:00.000Z",
  shortcuts: false,
  timePrecision: TimePrecision.MINUTE,
};

const componentDefaultValues = ({
  bindingTemplate,
  isCustomField,
  skipDefaultValueProcessing,
  sourceData,
  sourceDataPath,
}: ComponentDefaultValuesFnProps<string>): DateComponentProps => {
  let defaultValue;
  let dateFormat = COMPONENT_DEFAULT_VALUES.dateFormat;

  if (!isCustomField) {
    const format = dateFormatOptions.find(({ value: format }) => {
      return moment(sourceData, format, true).isValid();
    });

    if (format) {
      dateFormat = format.value;
    }

    if (sourceDataPath && !skipDefaultValueProcessing) {
      const { prefixTemplate, suffixTemplate } = bindingTemplate;
      const defaultValueString = `moment(${sourceDataPath}, "${dateFormat}").format("${ISO_DATE_FORMAT}")`;
      defaultValue = `${prefixTemplate}${defaultValueString}${suffixTemplate}`;
    }
  }

  return {
    ...COMPONENT_DEFAULT_VALUES,
    defaultValue,
    dateFormat,
  };
};

type DateFieldProps = BaseFieldComponentProps<DateComponentProps>;

export const isValidType = (value: string) =>
  dateFormatOptions.some(({ value: format }) =>
    moment(value, format, true).isValid(),
  );

const isValid = (schemaItem: DateFieldProps["schemaItem"], value?: string) =>
  !schemaItem.isRequired || Boolean(value?.trim());

function DateField({
  fieldClassName,
  name,
  passedDefaultValue,
  schemaItem,
}: DateFieldProps) {
  const {
    fieldType,
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction } = useContext(FormContext);

  const {
    field: { onBlur, onChange, value },
  } = useController({
    name,
  });

  const { inputRef } = useEvents<HTMLInputElement>({
    fieldBlurHandler: onBlur,
    onFocusDynamicString,
    onBlurDynamicString,
  });

  const isValueValid = isValid(schemaItem, value);
  const defaultDateValue = passedDefaultValue ?? schemaItem.defaultValue;

  useRegisterFieldValidity({
    isValid: isValueValid,
    fieldName: name,
    fieldType,
  });

  const onDateSelected = useCallback(
    (selectedValue: string) => {
      if (schemaItem.convertToISO || !selectedValue) {
        onChange(selectedValue);
      } else {
        onChange(moment(selectedValue).format(schemaItem.dateFormat));
      }

      if (schemaItem.onDateSelected && executeAction) {
        executeAction({
          triggerPropertyName: "onDateSelected",
          dynamicString: schemaItem.onDateSelected,
          event: {
            type: EventType.ON_DATE_SELECTED,
          },
        });
      }
    },
    [
      executeAction,
      onChange,
      schemaItem.convertToISO,
      schemaItem.dateFormat,
      schemaItem.onDateSelected,
    ],
  );

  const valueInISOFormat = useMemo(() => {
    if (!isValueValid || typeof value !== "string") return "";

    if (moment(value, ISO_DATE_FORMAT, true).isValid()) {
      return value;
    }

    const valueInSelectedFormat = moment(value, schemaItem.dateFormat, true);

    if (valueInSelectedFormat.isValid()) {
      return valueInSelectedFormat.format(ISO_DATE_FORMAT);
    }

    return value;
  }, [value, schemaItem.dateFormat]);

  useEffect(() => {
    if (schemaItem.convertToISO && value !== valueInISOFormat) {
      onChange(valueInISOFormat);
    }

    if (!schemaItem.convertToISO && value && value === valueInISOFormat) {
      if (moment(value, ISO_DATE_FORMAT, true).isValid()) {
        onChange(moment(value).format(schemaItem.dateFormat));
      }
    }
  }, [schemaItem.convertToISO, value, valueInISOFormat, schemaItem.dateFormat]);

  const fieldComponent = useMemo(() => {
    return (
      <DateComponent
        closeOnSelection={schemaItem.closeOnSelection}
        compactMode
        dateFormat={schemaItem.dateFormat}
        datePickerType="DATE_PICKER"
        inputRef={inputRef}
        isDisabled={schemaItem.isDisabled}
        isLoading={false}
        labelText=""
        maxDate={schemaItem.maxDate}
        minDate={schemaItem.minDate}
        onDateSelected={onDateSelected}
        selectedDate={valueInISOFormat}
        shortcuts={schemaItem.shortcuts}
        timePrecision={schemaItem.timePrecision}
        widgetId=""
      />
    );
  }, [
    schemaItem.closeOnSelection,
    schemaItem.dateFormat,
    schemaItem.isDisabled,
    schemaItem.maxDate,
    onDateSelected,
    valueInISOFormat,
    schemaItem.shortcuts,
    schemaItem.timePrecision,
    inputRef,
  ]);

  return (
    <Field
      accessor={schemaItem.accessor}
      defaultValue={defaultDateValue}
      fieldClassName={fieldClassName}
      isRequiredField={schemaItem.isRequired}
      label={schemaItem.label}
      labelStyle={schemaItem.labelStyle}
      labelTextColor={schemaItem.labelTextColor}
      labelTextSize={schemaItem.labelTextSize}
      name={name}
      tooltip={schemaItem.tooltip}
    >
      {fieldComponent}
    </Field>
  );
}

DateField.componentDefaultValues = componentDefaultValues;
DateField.isValidType = isValidType;

export default DateField;
