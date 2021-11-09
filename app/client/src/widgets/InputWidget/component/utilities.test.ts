import { formatCurrencyNumber, limitDecimalValue } from "./utilities";

describe("currency Number formating", () => {
  it("Without Decimal", () => {
    const response = formatCurrencyNumber(undefined, "1234560");
    expect(response).toStrictEqual("1,234,560");
  });
  it("With Decimal", () => {
    const response = formatCurrencyNumber(2, "1234560.9");
    expect(response).toStrictEqual("1,234,560.9");
  });
});

describe("Limiting decimal Numbers ", () => {
  it("Without Decimal", () => {
    const response = limitDecimalValue(undefined, "1234560");
    expect(response).toStrictEqual("1234560");
  });
  it("With Decimal more than the limit", () => {
    const response = limitDecimalValue(2, "3456789.35444");
    expect(response).toStrictEqual("3456789.35");
  });
});
