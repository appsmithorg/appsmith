export const countryToFlag = (isoCode: string) => {
  return typeof String.fromCodePoint !== "undefined"
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
};

export const PHONE_NUMBER_REGEX = /^(?:[0-9 ]+$)/;
