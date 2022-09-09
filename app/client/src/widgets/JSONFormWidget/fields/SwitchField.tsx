import React, { useCallback, useContext, useMemo } from "react";
import { useController } from "react-hook-form";

import FormContext from "../FormContext";
import Field from "widgets/JSONFormWidget/component/Field";
import useEvents from "./useBlurAndFocusEvents";
import useRegisterFieldValidity from "./useRegisterFieldValidity";
import { AlignWidget, AlignWidgetTypes } from "widgets/constants";
import {
  ActionUpdateDependency,
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
} from "../constants";
import SwitchComponent from "widgets/SwitchWidget/component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Colors } from "constants/Colors";
import { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";
import { LabelPosition } from "components/constants";

type SwitchComponentOwnProps = FieldComponentBaseProps &
  FieldEventProps & {
    alignWidget: AlignWidget;
    accentColor?: string;
    onChange?: string;
  };

type SwitchFieldProps = BaseFieldComponentProps<SwitchComponentOwnProps>;

const DEFAULT_BG_COLOR = Colors.GREEN;

const COMPONENT_DEFAULT_VALUES: SwitchComponentOwnProps = {
  alignWidget: "LEFT",
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  labelTextSize: BASE_LABEL_TEXT_SIZE,
  label: "",
};

const isValid = (value: boolean, schemaItem: SwitchFieldProps["schemaItem"]) =>
  !schemaItem.isRequired || value;

function SwitchField({
  fieldClassName,
  name,
  passedDefaultValue,
  schemaItem,
}: SwitchFieldProps) {
  const {
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

  const isValueValid = isValid(value, schemaItem);

  useRegisterFieldValidity({
    fieldName: name,
    fieldType: schemaItem.fieldType,
    isValid: isValueValid,
  });

  const onSwitchChange = useCallback(
    (value: boolean) => {
      onChange(value);

      if (schemaItem.onChange && executeAction) {
        executeAction({
          triggerPropertyName: "onChange",
          dynamicString: schemaItem.onChange,
          event: {
            type: EventType.ON_SWITCH_CHANGE,
          },
          updateDependencyType: ActionUpdateDependency.FORM_DATA,
        });
      }
    },
    [onChange, executeAction, schemaItem.onChange],
  );

  const fieldComponent = useMemo(
    () => (
      <SwitchComponent
        accentColor={schemaItem.accentColor || DEFAULT_BG_COLOR}
        alignWidget={schemaItem.alignWidget as AlignWidgetTypes}
        inputRef={(e) => (inputRef.current = e)}
        isDisabled={schemaItem.isDisabled}
        isLoading={false}
        isSwitchedOn={value ?? false}
        label=""
        labelPosition={LabelPosition.Left}
        onChange={onSwitchChange}
        widgetId=""
      />
    ),
    [
      schemaItem.alignWidget,
      schemaItem.accentColor,
      schemaItem.isDisabled,
      onSwitchChange,
      value,
    ],
  );

  return (
    <Field
      accessor={schemaItem.accessor}
      defaultValue={passedDefaultValue ?? schemaItem.defaultValue}
      fieldClassName={fieldClassName}
      inlineLabel
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

SwitchField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default SwitchField;
