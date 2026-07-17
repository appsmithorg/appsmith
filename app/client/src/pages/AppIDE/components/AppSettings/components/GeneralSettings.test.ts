import { isHtmlLangInputValid } from "./GeneralSettings";

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
