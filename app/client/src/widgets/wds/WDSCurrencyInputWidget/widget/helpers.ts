import { createMessage, FIELD_REQUIRED_ERROR } from "ee/constants/messages";
import { CurrencyTypeOptions } from "constants/Currency";
import { isNil } from "lodash";
import type { CurrencyInputWidgetProps } from "./types";

export function getCountryCodeFromCurrencyCode(
  currencyCode?: (typeof CurrencyTypeOptions)[number]["currency"],
) {
  const option = CurrencyTypeOptions.find(
    (option) => option.currency === currencyCode,
  );

  if (option) return option.code;

  return "";
}

export function validateInput(props: CurrencyInputWidgetProps) {
  const { errorMessage, isDirty, isRequired, isValid, rawText } = props;

  if (isDirty && isRequired && !isNil(rawText) && rawText.length === 0) {
    return {
      validationStatus: "invalid",
      errorMessage: createMessage(FIELD_REQUIRED_ERROR),
    } as const;
  }

  if (isDirty && isRequired && rawText === "") {
    return {
      validationStatus: "invalid",
      errorMessage: createMessage(FIELD_REQUIRED_ERROR),
    } as const;
  }

  if (isDirty && !isValid) {
    return {
      validationStatus: "invalid",
      errorMessage: errorMessage || "",
    } as const;
  }

  return {
    validationStatus: "valid",
    errorMessage: "",
  } as const;
}

export const countryToFlag = (isoCode: string) => {
  return typeof String.fromCodePoint !== "undefined"
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
};
