import { getLocale } from "utils/helpers";
import {
  getLocaleDecimalSeperator,
  getLocaleThousandSeparator,
} from "widgets/WidgetUtils";

export const countryToFlag = (isoCode: string) => {
  return typeof String.fromCodePoint !== "undefined"
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
};
export const getLocaleString = (countryCode: string) => {
  return "en-" + countryCode;
};

/*
 Returns formatted value with maximum number of decimals based on decimalsInCurrency value
 and add commas based on user's locale
  for eg:
  a) (2, 1235.456) will return 1,235.45
  b) (1, 1234.456) will return 1,234.4
*/
export const formatCurrencyNumber = (
  decimalsInCurrency = 0,
  value: string,
  countryCode: string = "en-US",
) => {
  const fractionDigits = decimalsInCurrency || 0;
  const hasDecimal = value.includes(getLocaleDecimalSeperator());
  const locale = getLocaleString(countryCode);
  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: hasDecimal ? fractionDigits : 0,
    maximumFractionDigits: hasDecimal ? fractionDigits : 0,
  });

  const parsedValue = parseLocaleFormattedStringToNumber(value);
  return formatter.format(isNaN(parsedValue) ? 0 : parsedValue);
};

/*
 Returns value in string format with maximum number of decimals based on decimalsInCurrency value
  for eg:
  a) (2, 1235.456) will return 1235.45
  b) (1, 1234.456) will return 1234.4
*/
export const limitDecimalValue = (decimals = 0, value = "") => {
  const decimalSeperator = getLocaleDecimalSeperator();
  value = value.split(getLocaleThousandSeparator()).join("");
  switch (decimals) {
    case 0:
      return value.split(decimalSeperator).shift() || "";
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      const decimalValueArray = value.split(decimalSeperator);
      if (decimalValueArray.length > 1) {
        return (
          decimalValueArray[0] +
          decimalSeperator +
          decimalValueArray[1].slice(0, decimals)
        );
      } else {
        return decimalValueArray[0];
      }
    default:
      return value;
  }
};

/*
 *  Parses the locale formatted currency string to number
 */
export function parseLocaleFormattedStringToNumber(currencyString = "") {
  return parseFloat(
    currencyString
      .replace(new RegExp("\\" + getLocaleThousandSeparator(), "g"), "")
      .replace(new RegExp("\\" + getLocaleDecimalSeperator()), "."),
  );
}
