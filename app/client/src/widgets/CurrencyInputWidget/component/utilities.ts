import { getLocale } from "utils/helpers";

export const countryToFlag = (isoCode: string) => {
  return typeof String.fromCodePoint !== "undefined"
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
};

/*
 Returns formatted value with maximum number of decimals based on decimalsInCurrency value 
 and add commas based on user's locale
  for eg:
  a) (2, 1235.456) will return 1,235.45 
  b) (1, 1234.456) will return 1,234.4
*/
export const formatCurrencyNumber = (decimalsInCurrency = 0, value: string) => {
  const fractionDigits = decimalsInCurrency || 0;
  const currentIndexOfDecimal = value.indexOf(getLocaleDecimalSeperator());
  const indexOfDecimal = value.length - fractionDigits - 1;
  const isDecimal =
    value.includes(getLocaleDecimalSeperator()) &&
    currentIndexOfDecimal <= indexOfDecimal;
  const locale = getLocale();
  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    maximumFractionDigits: isDecimal ? fractionDigits : 0,
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
      const decimalValueArray = value.split(decimalSeperator);
      return (
        decimalValueArray[0] +
        decimalSeperator +
        decimalValueArray[1].substr(0, decimals)
      );
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

export function getLocaleDecimalSeperator() {
  return Intl.NumberFormat(getLocale())
    .format(1.1)
    .replace(/\p{Number}/gu, "");
}

export function getLocaleThousandSeparator() {
  return Intl.NumberFormat(getLocale())
    .format(11111)
    .replace(/\p{Number}/gu, "");
}
