import { ISDCodeOptions } from "constants/ISDCodes_v2";

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
