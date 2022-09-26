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
 and add commas based on user's local browser
  for eg:
  a) (2, 1235.456) will return 1,234.56
  b) (1, 1234.456) will return 1,234.5
*/
export const formatCurrencyNumber = (
  decimalsInCurrency = 0,
  value: string,
  decimalSeparator: string,
) => {
  if (value === "") return "";
  let valueToFormat = value;
  const fractionDigits = decimalsInCurrency || 0;
  const currentIndexOfDecimal = value.indexOf(decimalSeparator);
  const requiredDigitsAfterDecimal = value.length - fractionDigits;
  const hasDecimal =
    value.includes(decimalSeparator) &&
    currentIndexOfDecimal <= requiredDigitsAfterDecimal;
  const missingFractDigitsCount =
    fractionDigits - (value.length - currentIndexOfDecimal - 1);
  if (missingFractDigitsCount > 0) {
    valueToFormat =
      value +
      Array(missingFractDigitsCount)
        .fill("0")
        .join("");
  }
  const locale = getLocale();
  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    maximumFractionDigits: hasDecimal ? fractionDigits : 0,
  });
  return formatter.format(parseFloat(valueToFormat));
};

/*
 Returns number in string format with maximum number of decimals based on decimalsInCurrency value
  for eg:
  a) (2, 1235.456) will return 1234.56
  b) (1, 1234.456) will return 1234.5
*/
export const limitDecimalValue = (
  decimalsInCurrency = 0,
  valueAsString: string,
  decimalSeparator: string,
  groupSeparator: string,
) => {
  let value = valueAsString.split(groupSeparator).join("");
  if (value) {
    const decimalValueArray = value.split(decimalSeparator);
    //remove extra digits after decimal point
    if (
      decimalsInCurrency &&
      decimalValueArray[1].length > decimalsInCurrency
    ) {
      value =
        decimalValueArray[0] +
        decimalSeparator +
        decimalValueArray[1].slice(0, decimalsInCurrency);
    }
    return value;
  } else {
    return "";
  }
};

/*
Return the type of decimal separator for decimal digit numbers
  eg:
  getDecimalSeparator("en-US") will return "."
  getDecimalSeparator("fr-FR") will return ","
*/
export const getDecimalSeparator = (locale: string) => {
  const numberWithDecimalSeparator = 1.1;
  const formatter = new Intl.NumberFormat(locale);
  return (
    formatter
      ?.formatToParts(numberWithDecimalSeparator)
      ?.find((part) => part.type === "decimal")?.value || "."
  );
};

/*
Return the type of decimal separator for decimal digit numbers
  eg:
  getGroupSeparator("en-US") will return ","
  getGroupSeparator("fr-FR") will return " "
*/
export const getGroupSeparator = (locale: string) => {
  const numberWithDecimalSeparator = 1000.1;
  const formatter = new Intl.NumberFormat(locale);
  return (
    formatter
      ?.formatToParts(numberWithDecimalSeparator)
      ?.find((part) => part.type === "group")?.value || ","
  );
};

export const getLocale = () => navigator.languages?.[0] || "en-US";

export const getSeparators = () => {
  const locale = getLocale();
  return {
    decimalSeparator: getDecimalSeparator(locale),
    groupSeparator: getGroupSeparator(locale),
  };
};
