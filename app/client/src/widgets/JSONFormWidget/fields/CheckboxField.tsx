import React, { useCallback, useContext, useMemo } from "react";
import { useController } from "react-hook-form";

import CheckboxComponent from "widgets/CheckboxWidget/component";
import FormContext from "../FormContext";
import NewField from "../component/NewField";
import useEvents from "./useEvents";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import { AlignWidget } from "widgets/constants";
import {
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
} from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

type CheckboxComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    alignWidget: AlignWidget;
    onCheckChange?: string;
  };

type CheckboxFieldProps = BaseFieldComponentProps<CheckboxComponentProps>;

const COMPONENT_DEFAULT_VALUES: CheckboxComponentProps = {
  alignWidget: "LEFT",
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "",
};

const isValid = (
  value: boolean,
  schemaItem: CheckboxFieldProps["schemaItem"],
) => (schemaItem.isRequired ? Boolean(value) : true);

function CheckboxField({
  fieldClassName,
  hideLabel,
  name,
  schemaItem,
}: CheckboxFieldProps) {
  const {
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction } = useContext(FormContext);

  const {
    field: { onBlur, onChange, value },
    fieldState: { isDirty },
  } = useController({
    name,
    shouldUnregister: true,
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
    useNewLogic: true,
  });

  const onCheckChange = useCallback(
    (isChecked: boolean) => {
      onChange(isChecked);

      if (schemaItem.onCheckChange && executeAction) {
        executeAction({
          triggerPropertyName: "onCheckChange",
          dynamicString: schemaItem.onCheckChange,
          event: {
            type: EventType.ON_CHECK_CHANGE,
          },
        });
      }
    },
    [schemaItem.onCheckChange, onChange, executeAction],
  );

  const fieldComponent = useMemo(
    () => (
      <CheckboxComponent
        alignWidget={schemaItem.alignWidget}
        inputRef={(e) => (inputRef.current = e)}
        isChecked={value}
        isDisabled={schemaItem.isDisabled}
        isLoading={false}
        isRequired={schemaItem.isRequired}
        isValid={isDirty ? isValueValid : true}
        label=""
        noContainerPadding
        onCheckChange={onCheckChange}
        rowSpace={20}
        widgetId=""
      />
    ),
    [schemaItem, inputRef, value, isDirty, isValueValid, onCheckChange],
  );

  return (
    <NewField
      defaultValue={schemaItem.defaultValue}
      fieldClassName={fieldClassName}
      hideLabel={hideLabel}
      isRequiredField={schemaItem.isRequired}
      label={schemaItem.label}
      labelStyle={schemaItem.labelStyle}
      labelTextColor={schemaItem.labelTextColor}
      labelTextSize={schemaItem.labelTextSize}
      name={name}
      tooltip={schemaItem.tooltip}
    >
      {fieldComponent}
    </NewField>
  );
}

CheckboxField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default CheckboxField;
