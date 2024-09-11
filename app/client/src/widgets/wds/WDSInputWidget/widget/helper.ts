import { isNil, isNumber } from "lodash";

import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_NUM_ERROR,
  INPUT_DEFAULT_TEXT_MIN_NUM_ERROR,
  INPUT_INVALID_TYPE_ERROR,
  INPUT_TEXT_MAX_CHAR_ERROR,
} from "ee/constants/messages";
import type { InputType } from "widgets/wds/WDSBaseInputWidget";
import type { WidgetProps } from "widgets/BaseWidget";

import type { InputWidgetProps, Validation } from "./types";
import {
  INPUT_TYPE_TO_WIDGET_TYPE_MAP,
  INPUT_TYPES,
} from "widgets/wds/WDSBaseInputWidget";
import type { PropertyUpdates } from "WidgetProvider/constants";
import { getDefaultISDCode } from "widgets/wds/WDSPhoneInputWidget/constants";
import { getDefaultCurrency } from "widgets/wds/WDSCurrencyInputWidget/constants";

/**
 * parses text to number if inputType is number
 *
 * @param value
 * @param inputType
 * @returns
 */
export function parseText(value: string, inputType: InputType) {
  const parsedText = Number(value);

  if (inputType === INPUT_TYPES.NUMBER) {
    if (isNil(value) || value === "") return null;
    if (isNaN(parsedText)) return null;

    return parsedText;
  }

  return value;
}

/**
 * checks if inputType is single line or multi line ( textarea )
 *
 * Note: single line type means inputType is just text
 *
 * @param inputType
 * @returns
 */
export function isInputTypeSingleLineOrMultiLine(inputType: InputType) {
  return (
    inputType === INPUT_TYPES.MULTI_LINE_TEXT || inputType === INPUT_TYPES.TEXT
  );
}

export function isInputTypeEmailOrPassword(inputType?: InputType) {
  return inputType === INPUT_TYPES.EMAIL || inputType === INPUT_TYPES.PASSWORD;
}

export const validateInput = (props: InputWidgetProps): Validation => {
  const {
    errorMessage,
    inputType,
    isDirty,
    isRequired,
    isValid,
    maxChars,
    maxNum,
    minNum,
    parsedText,
    rawText,
  } = props;

  if (isDirty && isRequired && !isNil(parsedText) && parsedText.length === 0) {
    return {
      validationStatus: "invalid",
      errorMessage: createMessage(FIELD_REQUIRED_ERROR),
    };
  }

  if (isInputTypeSingleLineOrMultiLine(inputType) && maxChars) {
    if (parsedText && parsedText.toString().length > maxChars) {
      return {
        validationStatus: "invalid",
        errorMessage: createMessage(INPUT_TEXT_MAX_CHAR_ERROR, maxChars),
      };
    }
  }

  if (inputType === "NUMBER") {
    if (isDirty && isRequired && rawText === "") {
      return {
        validationStatus: "invalid",
        errorMessage: createMessage(FIELD_REQUIRED_ERROR),
      };
    }

    if (rawText !== "" && isNumber(parsedText)) {
      // check the default text is neither greater than max nor less than min value.
      if (!isNil(minNum) && minNum > parsedText) {
        return {
          validationStatus: "invalid",
          errorMessage: createMessage(INPUT_DEFAULT_TEXT_MIN_NUM_ERROR),
        };
      }

      if (!isNil(maxNum) && maxNum < parsedText) {
        return {
          validationStatus: "invalid",
          errorMessage: createMessage(INPUT_DEFAULT_TEXT_MAX_NUM_ERROR),
        };
      }
    }

    if (rawText !== "" && isNaN(Number(rawText))) {
      return {
        validationStatus: "invalid",
        errorMessage: createMessage(INPUT_INVALID_TYPE_ERROR),
      };
    }
  }

  if (isDirty && "isValid" in props) {
    return {
      validationStatus: isValid ? "valid" : "invalid",
      errorMessage: errorMessage,
    };
  }

  return {
    validationStatus: "valid",
    errorMessage: "",
  };
};

export function inputTypeUpdateHook(
  props: WidgetProps,
  propertyName: string,
  propertyValue: InputType,
) {
  const updates: PropertyUpdates[] = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  // if input type is email or password default the autofill state to be true
  // the user needs to explicity set autofill to fault disable autofill
  updates.push({
    propertyPath: "shouldAllowAutofill",
    propertyValue: isInputTypeEmailOrPassword(propertyValue),
  });

  // we will also change the widgetType based on the inputType
  updates.push({
    propertyPath: "type",
    propertyValue: INPUT_TYPE_TO_WIDGET_TYPE_MAP[propertyValue],
  });

  // in case we are chaging to phone input type & there is no
  // defaultDiaCode property in the widget, we will default the country code to US
  if (
    props.defaultDialCode === undefined &&
    propertyValue === INPUT_TYPES.PHONE_NUMBER
  ) {
    updates.push({
      propertyPath: "defaultDialCode",
      propertyValue: getDefaultISDCode().dial_code,
    });
  }

  // in case we are changing to currency input type & there is no
  // defaultCurrency property in the widget, we will default the currency to USD
  if (
    props.defaultCurrencyCode === undefined &&
    propertyValue === INPUT_TYPES.CURRENCY
  ) {
    updates.push({
      propertyPath: "defaultCurrencyCode",
      propertyValue: getDefaultCurrency().currency,
    });
  }

  return updates;
}
