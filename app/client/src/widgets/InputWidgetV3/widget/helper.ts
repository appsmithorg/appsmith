import { isNil, isNumber } from "lodash";

import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
  INPUT_DEFAULT_TEXT_MAX_NUM_ERROR,
  INPUT_DEFAULT_TEXT_MIN_NUM_ERROR,
  INPUT_TEXT_MAX_CHAR_ERROR,
} from "@appsmith/constants/messages";
import { InputTypes } from "components/constants";
import type { InputType } from "../component/types";
import { DynamicHeight } from "utils/WidgetFeatures";
import type { WidgetProps } from "widgets/BaseWidget";

import { INPUT_TYPES } from "../constants";
import type { InputWidgetProps, Validation } from "./types";

/**
 * parses text to number if inputType is number
 *
 * @param value
 * @param inputType
 * @returns
 */
export function parseText(value: string, inputType: InputType) {
  const parsedText = Number(value);

  // console.log({ empty: isEmpty(value) });
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
    defaultText,
    errorMessage,
    inputText,
    inputType,
    isDirty,
    isRequired,
    isValid,
    maxChars,
    maxNum,
    minNum,
  } = props;
  const value = inputText ?? "";

  if (isDirty && isRequired && value.length === 0) {
    return {
      validationStatus: "invalid",
      errorMessage: createMessage(FIELD_REQUIRED_ERROR),
    };
  }

  if (isInputTypeSingleLineOrMultiLine(inputType) && maxChars) {
    if (defaultText && defaultText.toString().length > maxChars) {
      return {
        validationStatus: "invalid",
        errorMessage: createMessage(
          INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
          maxChars,
        ),
      };
    }

    if (value && value.length > maxChars) {
      return {
        validationStatus: "invalid",
        errorMessage: createMessage(INPUT_TEXT_MAX_CHAR_ERROR, maxChars),
      };
    }
  }

  if (inputType === "NUMBER" && isNumber(defaultText)) {
    // check the default text is neither greater than max nor less than min value.
    if (!isNil(minNum) && minNum > Number(defaultText)) {
      return {
        validationStatus: "invalid",
        errorMessage: createMessage(INPUT_DEFAULT_TEXT_MIN_NUM_ERROR),
      };
    }

    if (!isNil(maxNum) && maxNum < Number(defaultText)) {
      return {
        validationStatus: "invalid",
        errorMessage: createMessage(INPUT_DEFAULT_TEXT_MAX_NUM_ERROR),
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
  propertyValue: any,
) {
  const updates = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  if (propertyValue === InputTypes.MULTI_LINE_TEXT) {
    if (props.dynamicHeight === DynamicHeight.FIXED) {
      updates.push({
        propertyPath: "dynamicHeight",
        propertyValue: DynamicHeight.AUTO_HEIGHT,
      });
    }
  }
  // if input type is email or password default the autofill state to be true
  // the user needs to explicity set autofill to fault disable autofill
  updates.push({
    propertyPath: "shouldAllowAutofill",
    propertyValue: isInputTypeEmailOrPassword(propertyValue),
  });

  return updates;
}
