import React, { useCallback, useContext } from "react";
import { Alignment } from "@blueprintjs/core";
import { isNumber } from "lodash";
import { useController } from "react-hook-form";

import FormContext from "../FormContext";
import Field from "widgets/JSONFormWidget/component/Field";
import RadioGroupComponent from "widgets/RadioGroupWidget/component";
import useRegisterFieldValidity from "./useRegisterFieldValidity";
import { RadioOption } from "widgets/RadioGroupWidget/constants";
import {
  ActionUpdateDependency,
  BaseFieldComponentProps,
  FieldComponentBaseProps,
} from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Colors } from "constants/Colors";
import { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";

type RadioGroupComponentProps = FieldComponentBaseProps & {
  options: RadioOption[];
  onSelectionChange?: string;
  accentColor?: string;
};

export type RadioGroupFieldProps = BaseFieldComponentProps<
  RadioGroupComponentProps
>;

const DEFAULT_BG_COLOR = Colors.GREEN;

const COMPONENT_DEFAULT_VALUES: RadioGroupComponentProps = {
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "",
  labelTextSize: BASE_LABEL_TEXT_SIZE,
  options: [
    { label: "Yes", value: "Y" },
    { label: "No", value: "N" },
  ],
};

const isValid = (
  schemaItem: RadioGroupFieldProps["schemaItem"],
  value?: string,
) => !schemaItem.isRequired || Boolean(value);

function RadioGroupField({
  fieldClassName,
  name,
  passedDefaultValue,
  schemaItem,
}: RadioGroupFieldProps) {
  const { executeAction } = useContext(FormContext);
  const {
    field: { onChange, value },
  } = useController({
    name,
  });

  const isValueValid = isValid(schemaItem, value);
  const isOptionsValueNumeric = isNumber(schemaItem.options[0]?.value);

  useRegisterFieldValidity({
    isValid: isValueValid,
    fieldName: name,
    fieldType: schemaItem.fieldType,
  });

  const onSelectionChange = useCallback(
    (selectedValue: string) => {
      const value = isOptionsValueNumeric
        ? parseFloat(selectedValue)
        : selectedValue;

      onChange(value);

      if (schemaItem.onSelectionChange && executeAction) {
        executeAction({
          triggerPropertyName: "onSelectionChange",
          dynamicString: schemaItem.onSelectionChange,
          event: {
            type: EventType.ON_OPTION_CHANGE,
          },
          updateDependencyType: ActionUpdateDependency.FORM_DATA,
        });
      }
    },
    [
      onChange,
      executeAction,
      schemaItem.onSelectionChange,
      isOptionsValueNumeric,
    ],
  );

  return (
    <Field
      accessor={schemaItem.accessor}
      defaultValue={passedDefaultValue ?? schemaItem.defaultValue}
      fieldClassName={fieldClassName}
      isRequiredField={schemaItem.isRequired}
      label={schemaItem.label}
      labelStyle={schemaItem.labelStyle}
      labelTextColor={schemaItem.labelTextColor}
      labelTextSize={schemaItem.labelTextSize}
      name={name}
      tooltip={schemaItem.tooltip}
    >
      <RadioGroupComponent
        accentColor={schemaItem.accentColor || DEFAULT_BG_COLOR}
        alignment={Alignment.LEFT}
        compactMode={false}
        disabled={schemaItem.isDisabled}
        inline={false}
        isDisabled={schemaItem.isDisabled}
        labelText=""
        loading={false}
        onRadioSelectionChange={onSelectionChange}
        options={schemaItem.options || []}
        selectedOptionValue={value}
        widgetId=""
      />
    </Field>
  );
}

RadioGroupField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default RadioGroupField;
