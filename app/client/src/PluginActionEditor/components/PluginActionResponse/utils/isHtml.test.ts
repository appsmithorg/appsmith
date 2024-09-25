import { isHtml } from "./index";

describe("isHtml", () => {
  it("returns false for empty string", () => {
    const input = "";

    expect(isHtml(input)).toBe(false);
  });

  it("returns false for JSON", () => {
    const input = `{"name": "test"}`;

    expect(isHtml(input)).toBe(false);
  });

  it("returns false for string", () => {
    const input = "An error string returned";

    expect(isHtml(input)).toBe(false);
  });

  it("returns false for invalid html", () => {
    const input = "<pThis is incomplete";

    expect(isHtml(input)).toBe(false);
  });

  it("returns true for incomplete html", () => {
    const input = "<p>This is incomplete";

    expect(isHtml(input)).toBe(true);
  });

  it("returns true for HTML", () => {
    const input = "<body><p>This is a html response</p></body>";

    expect(isHtml(input)).toBe(true);
  });
});
