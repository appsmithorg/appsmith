import { sanitizeTabOrder } from "./widgetTabOrder";

describe("sanitizeTabOrder", () => {
  it("accepts positive integers, 1 being the earliest", () => {
    expect(sanitizeTabOrder(1)).toBe(1);
    expect(sanitizeTabOrder(2)).toBe(2);
    expect(sanitizeTabOrder(42)).toBe(42);
  });

  it("accepts positive numeric strings", () => {
    expect(sanitizeTabOrder("1")).toBe(1);
    expect(sanitizeTabOrder("3")).toBe(3);
    expect(sanitizeTabOrder("10")).toBe(10);
  });

  it("rejects zero (the stepper starts at 1)", () => {
    expect(sanitizeTabOrder(0)).toBeUndefined();
    expect(sanitizeTabOrder("0")).toBeUndefined();
  });

  it("treats null, undefined and blank values as Auto", () => {
    expect(sanitizeTabOrder(null)).toBeUndefined();
    expect(sanitizeTabOrder(undefined)).toBeUndefined();
    expect(sanitizeTabOrder("")).toBeUndefined();
    expect(sanitizeTabOrder("   ")).toBeUndefined();
  });

  it("rejects negative numbers", () => {
    expect(sanitizeTabOrder(-1)).toBeUndefined();
    expect(sanitizeTabOrder("-1")).toBeUndefined();
  });

  it("rejects decimals", () => {
    expect(sanitizeTabOrder(1.5)).toBeUndefined();
    expect(sanitizeTabOrder("1.5")).toBeUndefined();
  });

  it("rejects NaN and Infinity", () => {
    expect(sanitizeTabOrder(NaN)).toBeUndefined();
    expect(sanitizeTabOrder("NaN")).toBeUndefined();
    expect(sanitizeTabOrder(Infinity)).toBeUndefined();
    expect(sanitizeTabOrder("Infinity")).toBeUndefined();
    expect(sanitizeTabOrder(-Infinity)).toBeUndefined();
  });

  it("rejects non-numeric strings and non string/number types", () => {
    expect(sanitizeTabOrder("abc")).toBeUndefined();
    expect(sanitizeTabOrder("12abc")).toBeUndefined();
    expect(sanitizeTabOrder(true)).toBeUndefined();
    expect(sanitizeTabOrder({})).toBeUndefined();
    expect(sanitizeTabOrder([])).toBeUndefined();
  });
});
