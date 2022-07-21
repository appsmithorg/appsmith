import { countryToFlag } from "./utilities";

describe("Utilities - ", () => {
  it("should test countryToFlag", () => {
    [
      ["+91", "🇮🇳"],
      ["+1", "🇺🇸"],
      ["", ""],
    ].forEach((d) => {
      expect(countryToFlag(d[0])).toBe(d[1]);
    });
  });
});
