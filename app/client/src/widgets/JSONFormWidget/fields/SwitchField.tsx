import React, { useContext } from "react";

import Field from "widgets/JSONFormWidget/component/Field";
import { AlignWidget } from "widgets/constants";
import {
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
} from "../constants";
import { SwitchComponent } from "widgets/SwitchWidget/component";
import FormContext from "../FormContext";
import useEvents from "./useEvents";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

type SwitchComponentOwnProps = FieldComponentBaseProps &
  FieldEventProps & {
    alignWidget: AlignWidget;
    onChange?: string;
  };

type SwitchFieldProps = BaseFieldComponentProps<SwitchComponentOwnProps>;

const COMPONENT_DEFAULT_VALUES: SwitchComponentOwnProps = {
  alignWidget: "LEFT",
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "",
};

function SwitchField({ fieldClassName, name, schemaItem }: SwitchFieldProps) {
  const {
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction } = useContext(FormContext);
  const { inputRef, registerFieldOnBlurHandler } = useEvents<HTMLInputElement>({
    onFocusDynamicString,
    onBlurDynamicString,
  });

  return (
    <Field
      defaultValue={schemaItem.defaultValue}
      fieldClassName={fieldClassName}
      inlineLabel
      isRequiredField={schemaItem.isRequired}
      label={schemaItem.label}
      labelStyle={schemaItem.labelStyle}
      labelTextColor={schemaItem.labelTextColor}
      labelTextSize={schemaItem.labelTextSize}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => {
        const onSwitchChange = (value: boolean) => {
          onChange(value);

          if (schemaItem.onChange && executeAction) {
            executeAction({
              triggerPropertyName: "onChange",
              dynamicString: schemaItem.onChange,
              event: {
                type: EventType.ON_SWITCH_CHANGE,
              },
            });
          }
        };

        registerFieldOnBlurHandler(onBlur);

        return (
          <SwitchComponent
            alignWidget={schemaItem.alignWidget}
            inputRef={(e) => (inputRef.current = e)}
            isDisabled={schemaItem.isDisabled}
            isLoading={false}
            isSwitchedOn={value ?? false}
            label=""
            onChange={onSwitchChange}
            widgetId=""
          />
        );
      }}
      tooltip={schemaItem.tooltip}
    />
  );
}

SwitchField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default SwitchField;
