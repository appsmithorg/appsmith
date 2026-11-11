import {
  isHtmlLangInputValid,
  shouldAdoptSavedDescription,
} from "./GeneralSettings";

describe("shouldAdoptSavedDescription", () => {
  it("adopts the store value when no save is in flight", () => {
    expect(shouldAdoptSavedDescription("anything", null)).toBe(true);
  });

  it("adopts the store value when the draft still matches what was saved", () => {
    expect(shouldAdoptSavedDescription("Locker", "Locker")).toBe(true);
  });

  it("keeps the draft when the user edited it after the save started", () => {
    expect(shouldAdoptSavedDescription("Locker system", "Locker")).toBe(false);
  });
});

describe("isHtmlLangInputValid", () => {
  it("accepts empty/blank values (falls back to default)", () => {
    expect(isHtmlLangInputValid("")).toBe(true);
    expect(isHtmlLangInputValid("   ")).toBe(true);
  });

  it("accepts well-formed BCP 47 tags regardless of case", () => {
    expect(isHtmlLangInputValid("en")).toBe(true);
    expect(isHtmlLangInputValid("DE")).toBe(true);
    expect(isHtmlLangInputValid("fr-CA")).toBe(true);
    expect(isHtmlLangInputValid("zh-Hans-CN")).toBe(true);
    expect(isHtmlLangInputValid("  en-GB  ")).toBe(true);
  });

  it("rejects malformed values", () => {
    expect(isHtmlLangInputValid("not a language")).toBe(false);
    expect(isHtmlLangInputValid("en_US")).toBe(false);
    expect(isHtmlLangInputValid("english!")).toBe(false);
    expect(isHtmlLangInputValid("en-")).toBe(false);
  });
});
