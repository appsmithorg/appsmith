import {
  createMessage,
  FIELD_REQUIRED_ERROR,
} from "@appsmith/constants/messages";
import { CurrencyTypeOptions } from "constants/Currency";

export function getCountryCodeFromCurrencyCode(
  currencyCode?: (typeof CurrencyTypeOptions)[number]["currency"],
) {
  const option = CurrencyTypeOptions.find(
    (option) => option.currency === currencyCode,
  );

  if (option) return option.code;

  return "";
}

export function validateInput(props: any) {
  const value = props.text ?? "";
  const isInvalid = "isValid" in props && !props.isValid && !!props.isDirty;

  const conditionalProps: any = {};

  conditionalProps.errorMessage = props.errorMessage;

  if (props.isRequired && value.length === 0) {
    conditionalProps.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
  }

  return {
    validattionStatus: isInvalid ? "invalid" : undefined,
    errorMessage: isInvalid ? conditionalProps.errorMessage : undefined,
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
