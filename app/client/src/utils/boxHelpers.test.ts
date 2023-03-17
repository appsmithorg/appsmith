import { areIntersecting, Rect } from "./boxHelpers";

describe("boxHelpers", () => {
  describe("areIntersecting", () => {
    it("should return true when rect 1 and rect 2 are intersecting", () => {
      const rect1: Rect = {
        top: 0,
        bottom: 2,
        left: 0,
        right: 2,
      };

      const rect2: Rect = {
        top: 0,
        bottom: 3,
        left: 1,
        right: 3,
      };

      const isIntersecting = areIntersecting(rect1, rect2);

      expect(isIntersecting).toBe(true);
    });

    it("should return false when rect 1 and rect 2 are not intersecting", () => {
      const rect1: Rect = {
        top: 0,
        bottom: 2,
        left: 0,
        right: 2,
      };

      const rect2: Rect = {
        top: 3,
        bottom: 6,
        left: 3,
        right: 6,
      };

      const isIntersecting = areIntersecting(rect1, rect2);

      expect(isIntersecting).toBe(false);
    });
  });
});
