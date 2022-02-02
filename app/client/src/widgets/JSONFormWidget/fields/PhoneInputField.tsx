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

type ISDCodeDropdownComponentProps = {
  allowDialCodeChange: boolean;
  dialCode: string;
  isDisabled: boolean;
  propertyPath: string;
};

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

const transformValue = (value: string) => {
  return {
    text: value,
    value: value,
  };
};

function ISDCodeDropdownComponent({
  allowDialCodeChange,
  dialCode,
  isDisabled,
  propertyPath,
}: ISDCodeDropdownComponentProps) {
  const { renderMode, updateWidgetProperty } = useContext(FormContext);
  const [metaDialCode, setMetaDialCode] = useState<string>();

  const selectedDialCode = metaDialCode || dialCode;
  const selectedISDCode = getSelectedISDCode(selectedDialCode);

  const onISDCodeChange = (code?: string) => {
    if (renderMode === RenderModes.CANVAS) {
      updateWidgetProperty?.(`${propertyPath}.dialCode`, code);
    } else {
      setMetaDialCode(code);
    }
  };

  return (
    <ISDCodeDropdown
      allowDialCodeChange={allowDialCodeChange}
      disabled={isDisabled}
      onISDCodeChange={onISDCodeChange}
      options={ISDCodeDropdownOptions}
      selected={selectedISDCode}
    />
  );
}

function PhoneInputField({
  fieldClassName,
  name,
  propertyPath,
  schemaItem,
}: PhoneInputFieldProps) {
  const leftIcon = (
    <ISDCodeDropdownComponent
      allowDialCodeChange={schemaItem.allowDialCodeChange}
      dialCode={schemaItem.dialCode}
      isDisabled={schemaItem.isDisabled}
      propertyPath={propertyPath}
    />
  );

  return (
    <BaseInputField
      fieldClassName={fieldClassName}
      inputHTMLType="TEL"
      isValid={isValid}
      leftIcon={leftIcon}
      name={name}
      propertyPath={propertyPath}
      schemaItem={schemaItem}
      transformValue={transformValue}
    />
  );
}

PhoneInputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default PhoneInputField;
