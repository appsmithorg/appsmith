import { getResponsiveMinWidth } from "./widgetUtils";

describe("WidgetUtils tests", () => {
  describe("getResponsiveMinWidth", () => {
    it("should return the min width as is for Hug widgets", () => {
      const config = { base: "100px" };
      const result = getResponsiveMinWidth(config, false);
      expect(result).toEqual(config);
    });
    it("should return undefined if the min width is undefined for a Hug widget", () => {
      const result = getResponsiveMinWidth(undefined, false);
      expect(result).toEqual(undefined);
    });
    it("should set base as 100% for Fill widgets if minWidth config is undefined", () => {
      const result = getResponsiveMinWidth(undefined, true);
      expect(result).toEqual({ base: "100%", "480px": "" });
    });
    it("should set base as 100% for Fill widgets if minWidth config is defined as assign given minWidth at 480px", () => {
      const config = { base: "100px" };
      const result = getResponsiveMinWidth(config, true);
      expect(result).toEqual({ base: "100%", "480px": "100px" });
    });
  });
});
