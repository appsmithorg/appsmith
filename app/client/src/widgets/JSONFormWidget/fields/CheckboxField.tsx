import React, { useCallback, useContext, useMemo } from "react";
import styled from "styled-components";
import { useController } from "react-hook-form";

import CheckboxComponent from "widgets/CheckboxWidget/component";
import FormContext from "../FormContext";
import Field from "../component/Field";
import useEvents from "./useBlurAndFocusEvents";
import useRegisterFieldValidity from "./useRegisterFieldValidity";
import { AlignWidget } from "widgets/constants";
import {
  ActionUpdateDependency,
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
} from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Colors } from "constants/Colors";
import { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";
import { LabelPosition } from "components/constants";

type CheckboxComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    alignWidget: AlignWidget;
    onCheckChange?: string;
    accentColor?: string;
    borderRadius?: string;
    boxShadow?: string;
  };

type CheckboxFieldProps = BaseFieldComponentProps<CheckboxComponentProps>;

const DEFAULT_BORDER_RADIUS = "0px";

const StyledCheckboxWrapper = styled.div`
  & label {
    margin-bottom: 0;
  }
`;

const COMPONENT_DEFAULT_VALUES: CheckboxComponentProps = {
  alignWidget: "LEFT",
  isDisabled: false,
  isRequired: false,
  labelTextSize: BASE_LABEL_TEXT_SIZE,
  isVisible: true,
  label: "",
};

const isValid = (
  value: boolean,
  schemaItem: CheckboxFieldProps["schemaItem"],
) => !schemaItem.isRequired || Boolean(value);

function CheckboxField({
  fieldClassName,
  name,
  passedDefaultValue,
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
          updateDependencyType: ActionUpdateDependency.FORM_DATA,
        });
      }
    },
    [schemaItem.onCheckChange, onChange, executeAction],
  );

  const fieldComponent = useMemo(
    () => (
      <StyledCheckboxWrapper>
        <CheckboxComponent
          accentColor={schemaItem.accentColor || Colors.GREEN}
          borderRadius={schemaItem.borderRadius || DEFAULT_BORDER_RADIUS}
          inputRef={(e) => (inputRef.current = e)}
          isChecked={value}
          isDisabled={schemaItem.isDisabled}
          isLoading={false}
          isRequired={schemaItem.isRequired}
          isValid={isDirty ? isValueValid : true}
          label=""
          labelPosition={LabelPosition.Left}
          noContainerPadding
          onCheckChange={onCheckChange}
          rowSpace={20}
          widgetId=""
        />
      </StyledCheckboxWrapper>
    ),
    [schemaItem, inputRef, value, isDirty, isValueValid, onCheckChange],
  );

  return (
    <Field
      accessor={schemaItem.accessor}
      alignField={schemaItem.alignWidget}
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

CheckboxField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default CheckboxField;
