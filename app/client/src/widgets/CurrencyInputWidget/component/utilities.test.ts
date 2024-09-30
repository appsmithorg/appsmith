import {
  getLocaleDecimalSeperator,
  getLocaleThousandSeparator,
} from "widgets/WidgetUtils";
import {
  countryToFlag,
  formatCurrencyNumber,
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    String.fromCodePoint = undefined as any;
    [
      ["IN", "IN"],
      ["in", "in"],
      ["US", "US"],
    ].forEach((d) => {
      expect(countryToFlag(d[0])).toBe(d[1]);
    });
  });

  describe("should test formatCurrencyNumber", () => {
    //below values are in format of [no. of decimals, input, output, countryCode]
    test.each([
      [0, "123", "123", "US"],
      [1, "123", "123", "US"],
      [2, "123", "123", "US"],
      [0, "123.12", "123", "US"],
      [1, "123.12", "123.1", "US"],
      [2, "123.12", "123.12", "US"],
      [2, "123456.12", "123,456.12", "US"],
      [1, "123456.12", "123,456.1", "US"],
      [0, "123456.12", "123,456", "US"],
      [0, "12345678", "12,345,678", "US"],
      [2, "12345678", "12,345,678", "US"],
      [2, "0.22", "0.22", "US"],
      [1, "0.22", "0.2", "US"],
      [0, "0.22", "0", "US"],
      [2, "0.22123123", "0.22", "US"],
      [1, "0.22123123", "0.2", "US"],
      [0, "0.22123123", "0", "US"],
      [0, "4", "4", "US"],
      [0, "4.9", "5", "US"],
      [0, "4.2", "4", "US"],
      [1, "4", "4", "US"],
      [1, "4.9", "4.9", "US"],
      [1, "4.99", "5.0", "US"],
      [1, "4.10", "4.1", "US"],
      [1, "4.12", "4.1", "US"],
      [2, "4", "4", "US"],
      [2, "4.90", "4.90", "US"],
      [2, "4.9", "4.90", "US"],
      [2, "4.99", "4.99", "US"],
      [2, "4.10", "4.10", "US"],
      [2, "4.1", "4.10", "US"],
      [2, "4.11", "4.11", "US"],
      [2, "4.119", "4.12", "US"],
      [2, "4.111", "4.11", "US"],
      [2, "4.999", "5.00", "US"],
      [0, "123", "123", "IN"],
      [1, "123", "123", "IN"],
      [2, "123", "123", "IN"],
      [0, "123.12", "123", "IN"],
      [1, "123.12", "123.1", "IN"],
      [2, "123.12", "123.12", "IN"],
      [2, "123456.12", "1,23,456.12", "IN"],
      [1, "123456.12", "1,23,456.1", "IN"],
      [0, "123456.12", "1,23,456", "IN"],
      [0, "12345678", "1,23,45,678", "IN"],
      [2, "12345678", "1,23,45,678", "IN"],
      [2, "0.22", "0.22", "IN"],
      [1, "0.22", "0.2", "IN"],
      [0, "0.22", "0", "IN"],
      [2, "0.22123123", "0.22", "IN"],
      [1, "0.22123123", "0.2", "IN"],
      [0, "0.22123123", "0", "IN"],
      [0, "4", "4", "IN"],
      [0, "4.9", "5", "IN"],
      [0, "4.2", "4", "IN"],
      [1, "4", "4", "IN"],
      [1, "4.9", "4.9", "IN"],
      [1, "4.99", "5.0", "IN"],
      [1, "4.10", "4.1", "IN"],
      [1, "4.12", "4.1", "IN"],
      [2, "4", "4", "IN"],
      [2, "4000.90", "4,000.90", "IN"],
      [2, "4.9", "4.90", "IN"],
      [2, "4.99", "4.99", "IN"],
      [2, "4.10", "4.10", "IN"],
      [2, "4.1", "4.10", "IN"],
      [2, "4.11", "4.11", "IN"],
      [2, "4.119", "4.12", "IN"],
      [2, "4.111", "4.11", "IN"],
      [2, "4.999", "5.00", "IN"],
    ])(
      "with %i decimals and input %s in %s should return %s",
      (decimals, input, expectedOutput, countryCode) => {
        expect(formatCurrencyNumber(decimals, input, countryCode)).toBe(
          expectedOutput,
        );
      },
    );
  });

  it("should test limitDecimalValue", () => {
    [
      [0, "123.12", "123"],
      [1, "123.12", "123.1"],
      [2, "123456.12", "123456.12"],
      [1, "123456.12", "123456.1"],
      [0, "123456.12", "123456"],
      [2, "0.22", "0.22"],
      [1, "0.22", "0.2"],
      [0, "0.22", "0"],
      [2, "0.22123123", "0.22"],
      [1, "0.22123123", "0.2"],
      [0, "0.22123123", "0"],
      [3, "123.12345", "123.123"],
      [4, "123.12345", "123.1234"],
      [5, "123.12345", "123.12345"],
      [6, "123.12345", "123.12345"],
      [3, "0.123456", "0.123"],
      [4, "0.123456", "0.1234"],
      [5, "0.123456", "0.12345"],
      [6, "0.123456", "0.123456"],
      [3, "123456.123456", "123456.123"],
      [4, "123456.123456", "123456.1234"],
      [5, "123456.123456", "123456.12345"],
      [6, "123456.12345678", "123456.123456"],
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
