import { getHeaderEmphasis } from "./headerFontStyle";

describe("getHeaderEmphasis", () => {
  it("leaves headers unchanged when the value is unset", () => {
    for (const value of [undefined, null, "", "   "]) {
      expect(getHeaderEmphasis(value)).toEqual({
        italic: false,
        underline: false,
      });
    }
  });

  it("accepts italic and underline together, in either order", () => {
    expect(getHeaderEmphasis("ITALIC")).toEqual({
      italic: true,
      underline: false,
    });
    expect(getHeaderEmphasis("underline")).toEqual({
      italic: false,
      underline: true,
    });
    expect(getHeaderEmphasis("UNDERLINE, ITALIC")).toEqual({
      italic: true,
      underline: true,
    });
  });

  it("ignores bold and any other token", () => {
    expect(getHeaderEmphasis("BOLD")).toEqual({
      italic: false,
      underline: false,
    });
    expect(getHeaderEmphasis("italic, BOLD")).toEqual({
      italic: true,
      underline: false,
    });
    expect(getHeaderEmphasis("NOTITALIC")).toEqual({
      italic: false,
      underline: false,
    });
  });
});
