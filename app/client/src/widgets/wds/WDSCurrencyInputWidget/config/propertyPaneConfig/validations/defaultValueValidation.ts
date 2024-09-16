import type { LoDashStatic } from "lodash";
import type { ValidationResponse } from "constants/WidgetValidation";

import type { CurrencyInputWidgetProps } from "../../../widget/types";

export function defaultValueValidation(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  props: CurrencyInputWidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  const NUMBER_ERROR_MESSAGE = {
    name: "TypeError",
    message: "This value must be number",
  };
  const DECIMAL_SEPARATOR_ERROR_MESSAGE = {
    name: "ValidationError",
    message: "Please use . as the decimal separator for default values.",
  };
  const EMPTY_ERROR_MESSAGE = {
    name: "",
    message: "",
  };
  const localeLang = navigator.languages?.[0] || "en-US";

  function getLocaleDecimalSeperator() {
    return Intl.NumberFormat(localeLang)
      .format(1.1)
      .replace(/\p{Number}/gu, "");
  }
  const decimalSeperator = getLocaleDecimalSeperator();
  const defaultDecimalSeperator = ".";
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [NUMBER_ERROR_MESSAGE],
    };
  }

  if (_.isBoolean(value) || _.isUndefined(value) || _.isNull(value)) {
    return {
      isValid: false,
      parsed: value,
      messages: [NUMBER_ERROR_MESSAGE],
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = Number(value);
  let isValid, messages;

  if (_.isString(value) && value.trim() === "") {
    /*
     *  When value is empty string
     */
    isValid = true;
    messages = [EMPTY_ERROR_MESSAGE];
    parsed = undefined;
  } else if (!Number.isFinite(parsed)) {
    /*
     *  When parsed value is not a finite numer
     */
    isValid = false;
    parsed = undefined;

    /**
     * Check whether value contains the locale decimal separator apart from "."
     * We only allow "." as a decimal separator inside default value
     */
    if (
      String(value).indexOf(defaultDecimalSeperator) === -1 &&
      String(value).indexOf(decimalSeperator) > 0
    ) {
      messages = [DECIMAL_SEPARATOR_ERROR_MESSAGE];
    } else {
      messages = [NUMBER_ERROR_MESSAGE];
    }
  } else {
    /*
     *  When parsed value is a Number
     */

    // Check whether value is honoring the decimals property
    if (parsed !== Number(parsed.toFixed(props.decimals))) {
      isValid = false;
      messages = [
        {
          name: "RangeError",
          message:
            "No. of decimals are higher than the decimals field set. Please update the default or the decimals field",
        },
      ];
    } else {
      isValid = true;
      messages = [EMPTY_ERROR_MESSAGE];
    }

    parsed = String(parsed);
  }

  return {
    isValid,
    parsed,
    messages,
  };
}
