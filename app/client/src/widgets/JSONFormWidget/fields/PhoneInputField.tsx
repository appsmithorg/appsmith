import React, { useCallback, useContext, useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import { AsYouType, parseIncompletePhoneNumber } from "libphonenumber-js";

import type { BaseInputComponentProps } from "./BaseInputField";
import BaseInputField, { parseRegex } from "./BaseInputField";
import FormContext from "../FormContext";
import type { BaseFieldComponentProps } from "../constants";
import { RenderModes } from "constants/WidgetConstants";
import ISDCodeDropdown, {
  getDefaultISDCode,
  getSelectedISDCode,
  ISDCodeDropdownOptions,
} from "widgets/PhoneInputWidget/component/ISDCodeDropdown";
import { findCountryByIso } from "widgets/PhoneInputWidget/component/utilities";
import { isEmpty } from "../helper";
import { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";

type PhoneInputComponentProps = BaseInputComponentProps & {
  allowDialCodeChange: boolean;
  countryCode?: string;
  dialCode: string;
};

export type PhoneInputFieldProps =
  BaseFieldComponentProps<PhoneInputComponentProps>;

interface ISDCodeDropdownComponentProps {
  allowDialCodeChange: boolean;
  countryCode?: string;
  dialCode: string;
  fieldName: string;
  isDisabled: boolean;
  onMetaISDCodeChange: (countryCode: string, dialCode: string) => void;
  propertyPath: string;
}

const COMPONENT_DEFAULT_VALUES: PhoneInputComponentProps = {
  allowDialCodeChange: false,
  countryCode: getDefaultISDCode().code,
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

const formatPhoneNumber = (value: string, countryCode?: string) =>
  countryCode
    ? new AsYouType(countryCode as CountryCode).input(value)
    : new AsYouType().input(value);

/**
 * Formats the number for the selected country as it is typed, the same way the
 * Phone Input widget does, and stores only the digits as the value.
 * Formatting is skipped while deleting, otherwise characters added by the
 * formatting (like ")") could not be removed.
 */
export const transformValue = (
  newValue: string,
  oldValue: string,
  countryCode?: string,
) => {
  const text =
    newValue && newValue.length > (oldValue || "").length
      ? formatPhoneNumber(newValue, countryCode)
      : newValue;

  return {
    text,
    value: parseIncompletePhoneNumber(text),
  };
};

function ISDCodeDropdownComponent({
  allowDialCodeChange,
  countryCode,
  dialCode,
  fieldName,
  isDisabled,
  onMetaISDCodeChange,
  propertyPath,
}: ISDCodeDropdownComponentProps) {
  const { renderMode, updateWidgetProperty } = useContext(FormContext);
  const selectedISDCode = getSelectedISDCode(dialCode, countryCode);

  const onISDCodeChange = (code?: string) => {
    const country = findCountryByIso(code);

    if (!country) return;

    if (renderMode === RenderModes.CANVAS) {
      updateWidgetProperty?.(`${propertyPath}.countryCode`, country.code);
      updateWidgetProperty?.(`${propertyPath}.dialCode`, country.dial_code);
    } else {
      onMetaISDCodeChange(country.code, country.dial_code);
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
  const [metaCountryCode, setMetaCountryCode] = useState<string>();
  const [metaDialCode, setMetaDialCode] = useState<string>();

  const selectedCountryCode = metaCountryCode || schemaItem.countryCode;
  const selectedDialCode = metaDialCode || schemaItem.dialCode;
  const formattingCountryCode = getSelectedISDCode(
    selectedDialCode,
    selectedCountryCode,
  ).value as string;

  const onMetaISDCodeChange = useCallback(
    (countryCode: string, dialCode: string) => {
      setMetaCountryCode(countryCode);
      setMetaDialCode(dialCode);
    },
    [],
  );

  const transformPhoneValue = useCallback(
    (newValue: string, oldValue: string) =>
      transformValue(newValue, oldValue, formattingCountryCode),
    [formattingCountryCode],
  );

  const leftIcon = (
    <ISDCodeDropdownComponent
      allowDialCodeChange={schemaItem.allowDialCodeChange}
      countryCode={selectedCountryCode}
      dialCode={selectedDialCode}
      fieldName={name}
      isDisabled={schemaItem.isDisabled}
      onMetaISDCodeChange={onMetaISDCodeChange}
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
      transformValue={transformPhoneValue}
    />
  );
}

PhoneInputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default PhoneInputField;
