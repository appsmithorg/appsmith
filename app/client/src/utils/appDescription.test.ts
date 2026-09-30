import {
  APP_DESCRIPTION_MAX_LENGTH,
  isAppDescriptionInputValid,
  normalizeAppDescription,
} from "./appDescription";

describe("normalizeAppDescription", () => {
  it("trims and collapses runs of whitespace, including line breaks, to one space", () => {
    expect(normalizeAppDescription("  First line\nsecond   line\t\n")).toBe(
      "First line second line",
    );
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeAppDescription("   \n ")).toBe("");
  });
});

describe("isAppDescriptionInputValid", () => {
  it("accepts empty/blank values (description is optional)", () => {
    expect(isAppDescriptionInputValid("")).toBe(true);
    expect(isAppDescriptionInputValid("   ")).toBe(true);
  });

  it("accepts values up to the max length after trimming", () => {
    expect(isAppDescriptionInputValid("Locker system replacement")).toBe(true);
    expect(
      isAppDescriptionInputValid("x".repeat(APP_DESCRIPTION_MAX_LENGTH)),
    ).toBe(true);
    expect(
      isAppDescriptionInputValid(
        "  " + "x".repeat(APP_DESCRIPTION_MAX_LENGTH) + "  ",
      ),
    ).toBe(true);
  });

  it("rejects values longer than the max length", () => {
    expect(
      isAppDescriptionInputValid("x".repeat(APP_DESCRIPTION_MAX_LENGTH + 1)),
    ).toBe(false);
  });
});
