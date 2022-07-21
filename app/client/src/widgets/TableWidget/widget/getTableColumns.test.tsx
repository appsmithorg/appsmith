import { getPropertyValue } from "./getTableColumns";

describe("getTableColumns", () => {
  describe("getPropertyValue", () => {
    it("should test that object value is processed properly", () => {
      const obj = {
        test: "someRandomTestValue",
      };

      expect(getPropertyValue(obj, 0, true)).toBe(obj);
    });

    it("should test that array value is processed properly", () => {
      const arr = ["test", undefined, null, ""];

      expect(getPropertyValue(arr, 0, true)).toBe("test");

      expect(getPropertyValue(arr, 0, false)).toBe("TEST");

      expect(getPropertyValue(arr, 1, false)).toBe(undefined);

      expect(getPropertyValue(arr, 2, false)).toBe(null);

      expect(getPropertyValue(arr, 3, false)).toBe("");
    });

    it("should test that primitive values are processed properly", () => {
      expect(getPropertyValue("test", 0, true)).toBe("test");

      expect(getPropertyValue("test", 0, false)).toBe("TEST");

      expect(getPropertyValue(1, 0, true)).toBe("1");

      expect(getPropertyValue(1, 0, false)).toBe("1");

      expect(getPropertyValue(true, 0, true)).toBe("true");

      expect(getPropertyValue(true, 0, false)).toBe("TRUE");
    });

    it("should test that falsy are processes properly", () => {
      expect(getPropertyValue("", 0, true)).toBe("");

      expect(getPropertyValue(null, 0, true)).toBe(null);

      expect(getPropertyValue(undefined, 0, true)).toBe(undefined);
    });
  });
});
