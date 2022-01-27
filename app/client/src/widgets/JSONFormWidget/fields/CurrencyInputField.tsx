import * as Sentry from "@sentry/react";
import _ from "lodash";
import moment from "moment";
import React, { useContext, useState } from "react";

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

type CurrencyInputComponentProps = BaseInputComponentProps & {
  currencyCountryCode: string;
  allowCurrencyChange?: boolean;
  decimalsInCurrency: number;
};

export type CurrencyInputFieldProps = BaseFieldComponentProps<
  CurrencyInputComponentProps
>;

const COMPONENT_DEFAULT_VALUES: CurrencyInputComponentProps = {
  currencyCountryCode: getDefaultCurrency().currency,
  decimalsInCurrency: 0,
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  label: "",
};

const isValid = (
  schemaItem: CurrencyInputFieldProps["schemaItem"],
  inputValue: string,
) => {
  let hasValidValue, value;
  try {
    value = Number(inputValue);
    hasValidValue = Number.isFinite(value);
  } catch (e) {
    return false;
  }

  if (
    !schemaItem.isRequired &&
    (inputValue === "" || inputValue === undefined)
  ) {
    return true;
  }
  if (schemaItem.isRequired && !hasValidValue) {
    return false;
  }

  if (typeof schemaItem.validation === "boolean" && !schemaItem.validation) {
    return false;
  }

  const parsedRegex = parseRegex(schemaItem.regex);

  return parsedRegex ? parsedRegex.test(inputValue) : hasValidValue;
};

function CurrencyInputField(props: CurrencyInputFieldProps) {
  const { propertyPath, schemaItem } = props;

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
    metaCurrencyCountryCode || schemaItem.currencyCountryCode;

  const transformValue = (inputValue: string) => {
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
  };

  return (
    <BaseInputField
      {...props}
      inputHTMLType="NUMBER"
      isValid={isValid}
      leftIcon={
        <CurrencyTypeDropdown
          allowCurrencyChange={
            schemaItem.allowCurrencyChange && !schemaItem.isDisabled
          }
          onCurrencyTypeChange={onCurrencyTypeChange}
          options={CurrencyDropdownOptions}
          selected={selectedCurrencyCountryCode}
        />
      }
      transformValue={transformValue}
    />
  );
}

CurrencyInputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default CurrencyInputField;
