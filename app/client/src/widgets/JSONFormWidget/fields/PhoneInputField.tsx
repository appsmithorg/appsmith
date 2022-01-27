import React, { useContext, useState } from "react";

import BaseInputField, {
  BaseInputComponentProps,
  parseRegex,
} from "./BaseInputField";
import FormContext from "../FormContext";
import { BaseFieldComponentProps } from "../constants";
import { RenderModes } from "constants/WidgetConstants";
import ISDCodeDropdown, {
  getDefaultISDCode,
  getSelectedISDCode,
  ISDCodeDropdownOptions,
} from "widgets/PhoneInputWidget/component/ISDCodeDropdown";

type PhoneInputComponentProps = BaseInputComponentProps & {
  allowDialCodeChange: boolean;
  dialCode: string;
};

export type PhoneInputFieldProps = BaseFieldComponentProps<
  PhoneInputComponentProps
>;

const COMPONENT_DEFAULT_VALUES: PhoneInputComponentProps = {
  allowDialCodeChange: false,
  dialCode: getDefaultISDCode().dial_code,
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  label: "",
};

const isValid = (
  schemaItem: PhoneInputFieldProps["schemaItem"],
  value: string,
) => {
  const hasValidValue = Boolean(value);

  if (!schemaItem.isRequired && (value === "" || value === undefined)) {
    return true;
  }
  if (schemaItem.isRequired && !hasValidValue) {
    return false;
  }

  if (typeof schemaItem.validation === "boolean" && !schemaItem.validation) {
    return false;
  }

  const parsedRegex = parseRegex(schemaItem.regex);

  return parsedRegex ? parsedRegex.test(value) : hasValidValue;
};

function PhoneInputField(props: PhoneInputFieldProps) {
  const { propertyPath, schemaItem } = props;

  const { renderMode, updateWidgetProperty } = useContext(FormContext);
  const [metaDialCode, setMetaDialCode] = useState<string>();

  const onISDCodeChange = (code?: string) => {
    if (renderMode === RenderModes.CANVAS) {
      updateWidgetProperty?.(`${propertyPath}.dialCode`, code);
    } else {
      setMetaDialCode(code);
    }
  };

  const selectedDialCode = metaDialCode || schemaItem.dialCode;

  const transformValue = (value: string) => {
    return {
      text: value,
      value: value,
    };
  };

  const renderLeftIcon = () => {
    const selectedISDCode = getSelectedISDCode(selectedDialCode);
    return (
      <ISDCodeDropdown
        allowDialCodeChange={schemaItem.allowDialCodeChange}
        disabled={schemaItem.isDisabled}
        onISDCodeChange={onISDCodeChange}
        options={ISDCodeDropdownOptions}
        selected={selectedISDCode}
      />
    );
  };

  return (
    <BaseInputField
      {...props}
      inputHTMLType="TEL"
      isValid={isValid}
      leftIcon={renderLeftIcon()}
      transformValue={transformValue}
    />
  );
}

PhoneInputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default PhoneInputField;
