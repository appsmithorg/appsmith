import React, { useContext, useState } from "react";
import { parseIncompletePhoneNumber } from "libphonenumber-js";

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
import { isEmpty } from "../helper";
import { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";

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
  fieldName: string;
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
  labelTextSize: BASE_LABEL_TEXT_SIZE,
  label: "",
};

export const isValid = (
  schemaItem: PhoneInputFieldProps["schemaItem"],
  inputValue?: string | null,
) => {
  const isEmptyValue = isEmpty(inputValue);

  if (schemaItem.isRequired && isEmptyValue) {
    return false;
  }

  if (isEmpty(inputValue)) {
    return true;
  }

  if (typeof schemaItem.validation === "boolean" && !schemaItem.validation) {
    return false;
  }

  const parsedRegex = parseRegex(schemaItem.regex);

  return !parsedRegex || parsedRegex.test(inputValue);
};

const transformValue = (value: string) => {
  const parsedValue = parseIncompletePhoneNumber(value);
  return {
    text: parsedValue,
    value: parsedValue,
  };
};

function ISDCodeDropdownComponent({
  allowDialCodeChange,
  dialCode,
  fieldName,
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
      widgetId={fieldName}
    />
  );
}

function PhoneInputField({
  fieldClassName,
  name,
  passedDefaultValue,
  propertyPath,
  schemaItem,
}: PhoneInputFieldProps) {
  const leftIcon = (
    <ISDCodeDropdownComponent
      allowDialCodeChange={schemaItem.allowDialCodeChange}
      dialCode={schemaItem.dialCode}
      fieldName={name}
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
      passedDefaultValue={passedDefaultValue}
      propertyPath={propertyPath}
      schemaItem={schemaItem}
      transformValue={transformValue}
    />
  );
}

PhoneInputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default PhoneInputField;
