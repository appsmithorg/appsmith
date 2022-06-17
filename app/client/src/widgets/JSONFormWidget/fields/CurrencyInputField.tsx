import * as Sentry from "@sentry/react";
import _ from "lodash";
import moment from "moment";
import React, { useCallback, useContext, useMemo, useState } from "react";

import BaseInputField, {
  BaseInputComponentProps,
  parseRegex,
} from "./BaseInputField";
import CurrencyTypeDropdown, {
  CurrencyDropdownOptions,
  getDefaultCurrency,
} from "widgets/CurrencyInputWidget/component/CurrencyCodeDropdown";
import FormContext from "../FormContext";
import { BaseFieldComponentProps } from "../constants";
import { RenderModes } from "constants/WidgetConstants";
import {
  getLocaleDecimalSeperator,
  limitDecimalValue,
} from "widgets/CurrencyInputWidget/component/utilities";
import derived from "widgets/CurrencyInputWidget/widget/derived";
import { isEmpty } from "../helper";
import { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";

type CurrencyInputComponentProps = BaseInputComponentProps & {
  currencyCountryCode: string;
  allowCurrencyChange?: boolean;
  decimalsInCurrency: number;
};

export type CurrencyInputFieldProps = BaseFieldComponentProps<
  CurrencyInputComponentProps
>;

type CurrencyTypeDropdownComponentProps = {
  allowCurrencyChange?: boolean;
  borderRadius?: string;
  currencyCountryCode: string;
  isDisabled: boolean;
  accentColor?: string;
  propertyPath: string;
  fieldName: string;
};

const COMPONENT_DEFAULT_VALUES: CurrencyInputComponentProps = {
  currencyCountryCode: getDefaultCurrency().currency,
  decimalsInCurrency: 0,
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  labelTextSize: BASE_LABEL_TEXT_SIZE,
  label: "",
};

export const isValid = (
  schemaItem: CurrencyInputFieldProps["schemaItem"],
  inputValue?: string | null,
) => {
  let hasValidValue, value;
  try {
    value = Number(inputValue);
    hasValidValue = !isEmpty(inputValue) && Number.isFinite(value);
  } catch (e) {
    return false;
  }

  if (schemaItem.isRequired && !hasValidValue) {
    return false;
  }

  if (isEmpty(inputValue)) {
    return true;
  }

  if (typeof schemaItem.validation === "boolean" && !schemaItem.validation) {
    return false;
  }

  const parsedRegex = parseRegex(schemaItem.regex);

  return parsedRegex ? parsedRegex.test(inputValue) : hasValidValue;
};

function CurrencyTypeDropdownComponent({
  accentColor,
  allowCurrencyChange,
  borderRadius,
  currencyCountryCode,
  fieldName,
  isDisabled,
  propertyPath,
}: CurrencyTypeDropdownComponentProps) {
  const { renderMode, updateWidgetProperty } = useContext(FormContext);
  const [metaCurrencyCountryCode, setMetaCurrencyCountryCode] = useState<
    string
  >();
  const onCurrencyTypeChange = (code?: string) => {
    if (renderMode === RenderModes.CANVAS) {
      updateWidgetProperty?.(`${propertyPath}.currencyCountryCode`, code);
    } else {
      setMetaCurrencyCountryCode(code);
    }
  };

  const selectedCurrencyCountryCode =
    metaCurrencyCountryCode || currencyCountryCode;

  return (
    <CurrencyTypeDropdown
      accentColor={accentColor}
      allowCurrencyChange={allowCurrencyChange && !isDisabled}
      borderRadius={borderRadius}
      onCurrencyTypeChange={onCurrencyTypeChange}
      options={CurrencyDropdownOptions}
      selected={selectedCurrencyCountryCode}
      widgetId={fieldName}
    />
  );
}

function CurrencyInputField({
  fieldClassName,
  name,
  passedDefaultValue,
  propertyPath,
  schemaItem,
}: CurrencyInputFieldProps) {
  const transformValue = useCallback(
    (inputValue: string) => {
      let text = "";
      const decimalSeperator = getLocaleDecimalSeperator();
      try {
        if (inputValue && inputValue.includes(decimalSeperator)) {
          text = limitDecimalValue(schemaItem.decimalsInCurrency, inputValue);
        } else {
          text = inputValue;
        }
      } catch (e) {
        text = inputValue;
        Sentry.captureException(e);
      }

      const value = derived.value({ text }, moment, _);

      return {
        text,
        value,
      };
    },
    [schemaItem.decimalsInCurrency],
  );

  const leftIcon = useMemo(
    () => (
      <CurrencyTypeDropdownComponent
        accentColor={schemaItem.accentColor}
        allowCurrencyChange={schemaItem.allowCurrencyChange}
        borderRadius={schemaItem.borderRadius}
        currencyCountryCode={schemaItem.currencyCountryCode}
        fieldName={name}
        isDisabled={schemaItem.isDisabled}
        propertyPath={propertyPath}
      />
    ),
    [
      schemaItem.allowCurrencyChange,
      schemaItem.currencyCountryCode,
      schemaItem.isDisabled,
      propertyPath,
      schemaItem.accentColor,
      schemaItem.borderRadius,
    ],
  );

  return (
    <BaseInputField
      fieldClassName={fieldClassName}
      inputHTMLType="NUMBER"
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

CurrencyInputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default CurrencyInputField;
