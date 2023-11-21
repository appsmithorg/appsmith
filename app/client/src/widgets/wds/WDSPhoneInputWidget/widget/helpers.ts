import {
  createMessage,
  FIELD_REQUIRED_ERROR,
} from "@appsmith/constants/messages";
import type { ISDCodeProps } from "constants/ISDCodes_v2";
import { ISDCodeOptions } from "constants/ISDCodes_v2";

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

export const countryToFlag = (dialCode: string) => {
  const country = ISDCodeOptions.find((item) => item.dial_code === dialCode);
  const isoCode = country ? country.code : "";
  return typeof String.fromCodePoint !== "undefined"
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
};

export const getCountryCode = (dialCode?: string) => {
  const option = ISDCodeOptions.find((item: ISDCodeProps) => {
    return item.dial_code === dialCode;
  });

  if (option) {
    return option.code;
  } else {
    return "";
  }
};
