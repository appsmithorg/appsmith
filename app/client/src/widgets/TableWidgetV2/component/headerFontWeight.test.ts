import {
  HEADER_FONT_WEIGHT_DEFAULT,
  headerFontWeightValidation,
  resolveHeaderFontWeight,
} from "./headerFontWeight";

// Jest coverage rewrites the function with counters such as cov_xxx().s[0]++.
// The eval worker receives the original source, so the copy under test drops those counters.
function sourceForWorker(fn: { toString(): string }): string {
  return fn
    .toString()
    .replace(
      /\bcov_[A-Za-z0-9_$]+(?:\(\))?(?:\.[A-Za-z0-9_$]+|\[\d+\])+\+\+/g,
      "0",
    );
}

describe("headerFontWeightValidation", () => {
  it("resolves an unset value to 700 without an error", () => {
    for (const value of [undefined, null, "", "   "]) {
      expect(headerFontWeightValidation(value)).toEqual({
        isValid: true,
        parsed: 700,
        messages: [],
      });
    }
  });

  it("accepts numbers from 1 to 1000, including decimals", () => {
    for (const value of [1, 400, 450.5, 500, 550, 600, 700, 1000]) {
      expect(headerFontWeightValidation(value)).toEqual({
        isValid: true,
        parsed: value,
        messages: [],
      });
    }
  });

  it("accepts numeric strings in range", () => {
    expect(headerFontWeightValidation(" 550 ").parsed).toBe(550);
    expect(headerFontWeightValidation("1000.0")).toEqual({
      isValid: true,
      parsed: 1000,
      messages: [],
    });
    expect(headerFontWeightValidation("1.")).toEqual({
      isValid: true,
      parsed: 1,
      messages: [],
    });
  });

  it("maps the supported keywords", () => {
    expect(headerFontWeightValidation("light").parsed).toBe(300);
    expect(headerFontWeightValidation("normal").parsed).toBe(400);
    expect(headerFontWeightValidation(" regular ").parsed).toBe(400);
    expect(headerFontWeightValidation("MEDIUM").parsed).toBe(500);
    expect(headerFontWeightValidation("semibold").parsed).toBe(600);
    expect(headerFontWeightValidation("Semi-Bold").parsed).toBe(600);
    expect(headerFontWeightValidation("bold").parsed).toBe(700);

    expect(headerFontWeightValidation("normal").isValid).toBe(true);
  });

  it("falls back to 700 for unsupported entries and reports them invalid", () => {
    for (const value of [
      0,
      -1,
      1000.1,
      Infinity,
      NaN,
      "lighter",
      "bolder",
      "thin",
      "black",
      "700px",
      "1e3",
      "foo",
      "constructor",
      true,
      [],
      {},
    ]) {
      const result = headerFontWeightValidation(value);

      expect(result.isValid).toBe(false);
      expect(result.parsed).toBe(HEADER_FONT_WEIGHT_DEFAULT);
      expect(result.messages?.[0].message).toContain("1 to 1000");
    }
  });

  it("keeps the worker copy of the validator self-contained", () => {
    const source = sourceForWorker(headerFontWeightValidation);
    const validate = new Function(
      "value",
      `const fn = ${source}; return fn(value);`,
    ) as (value: unknown) => ReturnType<typeof headerFontWeightValidation>;

    expect(validate("bold")).toEqual({
      isValid: true,
      parsed: 700,
      messages: [],
    });
    expect(validate("nope").isValid).toBe(false);
    expect(validate("nope").parsed).toBe(700);
  });
});

describe("resolveHeaderFontWeight", () => {
  it("returns the parsed weight for valid values and 700 otherwise", () => {
    expect(resolveHeaderFontWeight(undefined)).toBe(700);
    expect(resolveHeaderFontWeight("normal")).toBe(400);
    expect(resolveHeaderFontWeight("550")).toBe(550);
    expect(resolveHeaderFontWeight("700px")).toBe(700);
  });
});
