import React, { useContext } from "react";
import { pick } from "lodash";

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

function SwitchField({ name, schemaItem, ...rest }: SwitchFieldProps) {
  const {
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction } = useContext(FormContext);
  const { inputRef, registerFieldOnBlurHandler } = useEvents<HTMLInputElement>({
    onFocusDynamicString,
    onBlurDynamicString,
  });

  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  return (
    <Field
      {...rest}
      defaultValue={schemaItem.defaultValue}
      inlineLabel
      isRequiredField={schemaItem.isRequired}
      label={schemaItem.label}
      labelStyles={labelStyles}
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
    />
  );
}

SwitchField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default SwitchField;
