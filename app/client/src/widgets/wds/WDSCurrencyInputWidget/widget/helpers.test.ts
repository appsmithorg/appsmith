import { countryToFlag } from "./helpers";

describe("countryToFlag", () => {
  it("should test countryToFlag", () => {
    [
      ["IN", "🇮🇳"],
      ["in", "🇮🇳"],
      ["US", "🇺🇸"],
    ].forEach((d) => {
      expect(countryToFlag(d[0])).toBe(d[1]);
    });
    String.fromCodePoint = undefined as any;
    [
      ["IN", "IN"],
      ["in", "in"],
      ["US", "US"],
    ].forEach((d) => {
      expect(countryToFlag(d[0])).toBe(d[1]);
    });
  });
});
