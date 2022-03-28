import {
  formatCurrencyNumber,
  limitDecimalValue,
  getDecimalSeparator,
  getGroupSeparator,
} from "./utilities";

describe("currency Number formating", () => {
  it("Without Decimal", () => {
    const response = formatCurrencyNumber(undefined, "1234560", ".");
    expect(response).toStrictEqual("1,234,560");
  });
  it("With Decimal", () => {
    const response = formatCurrencyNumber(2, "1234560.90", ".");
    expect(response).toStrictEqual("1,234,560.9");
  });
  it("With Decimal", () => {
    const response = formatCurrencyNumber(2, "1234560.9", ".");
    expect(response).toStrictEqual("1,234,560.9");
  });
  it("With Decimal", () => {
    const response = formatCurrencyNumber(2, "1234560.981", ".");
    expect(response).toStrictEqual("1,234,560.98");
  });
});

describe("Limiting decimal Numbers ", () => {
  it("Without Decimal", () => {
    const response = limitDecimalValue(undefined, "1234560", ".", ",");
    expect(response).toStrictEqual("1234560");
  });
  it("With Decimal more than the limit", () => {
    const response = limitDecimalValue(2, "3456789.35444", ".", ",");
    expect(response).toStrictEqual("3456789.35");
  });
});

describe("Decimal separator test", () => {
  it("For en-US locale", () => {
    const response = getDecimalSeparator("en-US");
    expect(response).toEqual(".");
  });
  it("For it (Italian) locale", () => {
    const response = getDecimalSeparator("it");
    expect(response).toEqual(",");
  });
});

describe("Group separator test", () => {
  it("For en-US locale", () => {
    const response = getGroupSeparator("en-US");
    expect(response).toEqual(",");
  });
  it("For it (Italian) locale", () => {
    const response = getGroupSeparator("it");
    expect(response).toEqual(".");
  });
});
