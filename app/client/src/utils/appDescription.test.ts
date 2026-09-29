import {
  APP_DESCRIPTION_MAX_LENGTH,
  isAppDescriptionInputValid,
} from "./appDescription";

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
