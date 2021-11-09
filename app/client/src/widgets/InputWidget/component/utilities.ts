export const countryToFlag = (isoCode: string) => {
  return typeof String.fromCodePoint !== "undefined"
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
};

export const formatCurrencyNumber = (decimalsInCurrency = 0, value: string) => {
  const fractionDigits = decimalsInCurrency || 0;
  const currentIndexOfDecimal = value.indexOf(".");
  const indexOfDecimal = value.length - fractionDigits - 1;
  const isDecimal =
    value.includes(".") && currentIndexOfDecimal <= indexOfDecimal;
  const locale = navigator.languages?.[0] || "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: isDecimal ? fractionDigits : 0,
  });
  return formatter.format(parseFloat(value));
};

export const limitDecimalValue = (
  decimalsInCurrency = 0,
  valueAsString: string,
) => {
  let value = valueAsString.split(",").join("");
  if (value) {
    const decimalValueArray = value.split(".");
    //remove extra digits after decimal point
    if (
      decimalsInCurrency &&
      decimalValueArray[1].length > decimalsInCurrency
    ) {
      value =
        decimalValueArray[0] +
        "." +
        decimalValueArray[1].substr(0, decimalsInCurrency);
    }
    return value;
  } else {
    return "";
  }
};
