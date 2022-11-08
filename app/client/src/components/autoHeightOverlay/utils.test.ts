import { heightToRows } from "./utils";

describe("Utils", () => {
  describe("heightToRows", () => {
    it("should return correct value of rows when height is in multiple of 10", () => {
      const rows = heightToRows(100);
      expect(rows).toBe(10);
    });

    it("should round correct value of rows when height is not in multiple of 10", () => {
      const rows = heightToRows(105);
      expect(rows).toBe(10);
    });
  });
});
