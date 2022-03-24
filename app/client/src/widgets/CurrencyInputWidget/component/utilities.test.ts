import {
  countryToFlag,
  formatCurrencyNumber,
  getLocaleThousandSeparator,
  getLocaleDecimalSeperator,
  limitDecimalValue,
  parseLocaleFormattedStringToNumber,
} from "./utilities";

let locale = "en-US";

jest.mock("utils/helpers", () => {
  const originalModule = jest.requireActual("utils/helpers");
  return {
    __esModule: true,
    ...originalModule,
    getLocale: () => {
      return locale;
    },
  };
});

describe("Utilities - ", () => {
  it("should test test countryToFlag", () => {
    [
      ["IN", "🇮🇳"],
      ["in", "🇮🇳"],
      ["US", "🇺🇸"],
    ].forEach((d) => {
      expect(countryToFlag(d[0])).toBe(d[1]);
    });
    String.fromCodePoint = undefined as any;
    [
      ["IN", "IN"],
      ["in", "in"],
      ["US", "US"],
    ].forEach((d) => {
      expect(countryToFlag(d[0])).toBe(d[1]);
    });
  });

  it("should test formatCurrencyNumber", () => {
    [
      [0, "123", "123"],
      [1, "123", "123"],
      [2, "123", "123"],
      [0, "123.12", "123"],
      [1, "123.12", "123.1"],
      [2, "123.12", "123.12"],
      [2, "123456.12", "123,456.12"],
      [1, "123456.12", "123,456.1"],
      [0, "123456.12", "123,456"],
      [0, "12345678", "12,345,678"],
      [2, "12345678", "12,345,678"],
      [2, "0.22", "0.22"],
      [1, "0.22", "0.2"],
      [0, "0.22", "0"],
      [2, "0.22123123", "0.22"],
      [1, "0.22123123", "0.2"],
      [0, "0.22123123", "0"],
    ].forEach((d) => {
      expect(formatCurrencyNumber(d[0] as number, d[1] as string)).toBe(d[2]);
    });
  });

  it("should test limitDecimalValue", () => {
    [
      [0, "123.12", "123"],
      [1, "123.12", "123.1"],
      [2, "123.12", "123.12"],
      [2, "123456.12", "123456.12"],
      [1, "123456.12", "123456.1"],
      [0, "123456.12", "123456"],
      [2, "0.22", "0.22"],
      [1, "0.22", "0.2"],
      [0, "0.22", "0"],
      [2, "0.22123123", "0.22"],
      [1, "0.22123123", "0.2"],
      [0, "0.22123123", "0"],
    ].forEach((d) => {
      expect(limitDecimalValue(d[0] as number, d[1] as string)).toBe(d[2]);
    });
  });

  it("should test getLocaleDecimalSeperator", () => {
    expect(getLocaleDecimalSeperator()).toBe(".");
    locale = "en-IN";
    expect(getLocaleDecimalSeperator()).toBe(".");
    locale = "hr-HR";
    expect(getLocaleDecimalSeperator()).toBe(",");
  });

  it("should test getLocaleThousandSeparator", () => {
    locale = "en-US";
    expect(getLocaleThousandSeparator()).toBe(",");
    locale = "en-IN";
    expect(getLocaleThousandSeparator()).toBe(",");
    locale = "hr-HR";
    expect(getLocaleThousandSeparator()).toBe(".");
  });

  it("shoud test parseLocaleFormattedStringToNumber", () => {
    locale = "en-US";
    [
      ["123", 123],
      ["123.12", 123.12],
      ["123,456.12", 123456.12],
      ["123,456,789.12", 123456789.12],
      ["0.22", 0.22],
      ["0.22123123", 0.22123123],
    ].forEach((d) => {
      expect(parseLocaleFormattedStringToNumber(d[0] as string)).toBe(d[1]);
    });

    locale = "hr-HR";
    [
      ["123", 123],
      ["123,12", 123.12],
      ["123.456,12", 123456.12],
      ["123.456.789,12", 123456789.12],
      ["0,22", 0.22],
      ["0,22123123", 0.22123123],
    ].forEach((d) => {
      expect(parseLocaleFormattedStringToNumber(d[0] as string)).toBe(d[1]);
    });
  });
});
