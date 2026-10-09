import { get } from "lodash";
import type { ISDCodeProps } from "constants/ISDCodes_v2";
import { ISDCodeOptions } from "constants/ISDCodes_v2";
import { isDynamicValue } from "utils/DynamicBindingUtils";

/**
 * Shared dial codes are stored once, so a dial code alone cannot say which
 * country was chosen. When an existing app has only the dial code, use the
 * country people mean by that code.
 */
export const PRIMARY_ISO_BY_DIAL_CODE: Record<string, string> = {
  "+44": "GB",
  "+262": "RE",
  "+358": "FI",
  "+47": "NO",
  "+500": "FK",
  "+590": "GP",
  "+61": "AU",
  "+672": "NF",
};

export const countryToFlag = (isoCode: string) => {
  return typeof String.fromCodePoint !== "undefined"
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
};

export const findCountryByIso = (countryCode?: string) => {
  const code = countryCode?.trim().toUpperCase();

  if (!code) return undefined;

  return ISDCodeOptions.find((item) => item.code === code);
};

export const findCountryByDialCode = (dialCode?: string) => {
  if (!dialCode) return undefined;

  const primaryIso = PRIMARY_ISO_BY_DIAL_CODE[dialCode];

  if (primaryIso) {
    const primary = findCountryByIso(primaryIso);

    if (primary) return primary;
  }

  return ISDCodeOptions.find((item) => item.dial_code === dialCode);
};

/**
 * An explicit country wins when its dial code matches. A dial code that no
 * longer matches that country (a binding changed it) falls back to the
 * primary country for the dial code.
 */
export const resolvePhoneCountry = (
  dialCode?: string,
  countryCode?: string,
): ISDCodeProps | undefined => {
  const byIso = findCountryByIso(countryCode);

  if (byIso && (!dialCode || byIso.dial_code === dialCode)) {
    return byIso;
  }

  return findCountryByDialCode(dialCode);
};

/**
 * A bound country code, such as {{Input1.text}} evaluating to AU, arrives
 * after the dial code was saved. Follow that country unless the dial code is
 * itself a binding, in which case the dial code still decides.
 */
export const resolveDisplayedPhoneCountry = (
  dialCode?: string,
  countryCode?: string,
  options?: { preferCountry?: boolean },
) => {
  const country = findCountryByIso(countryCode);

  if (options?.preferCountry && country) {
    return country;
  }

  return resolvePhoneCountry(dialCode, country?.code ?? countryCode);
};

/**
 * Country shown for a phone field that was saved with only a dial code.
 * A binding is left blank here; the evaluated dial code still picks the flag.
 */
export const countryCodeDisplayedForDialCode = (
  widgetProperties: object | undefined,
  propertyName: string,
): string | undefined => {
  if (!widgetProperties) return undefined;

  const parentPath = propertyName.replace(/(?:^|\.)[^.[\]]+$/, "");
  const source = (
    parentPath ? get(widgetProperties, parentPath) : widgetProperties
  ) as { defaultDialCode?: unknown; dialCode?: unknown } | undefined;

  if (!source || typeof source !== "object") return undefined;

  const dialCode =
    typeof source.defaultDialCode === "string"
      ? source.defaultDialCode
      : typeof source.dialCode === "string"
        ? source.dialCode
        : undefined;

  if (!dialCode || isDynamicValue(dialCode)) return undefined;

  return findCountryByDialCode(dialCode)?.code;
};
