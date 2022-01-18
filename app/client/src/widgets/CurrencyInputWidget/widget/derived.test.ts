import derivedProperty from "./derived";

describe("Derived property - ", () => {
  describe("isValid property", () => {
    it("should test isRequired", () => {
      let isValid = derivedProperty.isValid({
        text: undefined,
        isRequired: false,
      });

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid({
        text: undefined,
        isRequired: true,
      });

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid({
        value: 100,
        text: "100",
        isRequired: true,
      });

      expect(isValid).toBeTruthy();
    });

    it("should test validation", () => {
      let isValid = derivedProperty.isValid({
        value: 100,
        text: "100",
        validation: false,
      });

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid({
        value: 100,
        text: "100",
        validation: true,
      });

      expect(isValid).toBeTruthy();
    });

    it("should test regex validation", () => {
      let isValid = derivedProperty.isValid({
        value: 100,
        text: "100",
        regex: "^100$",
      });

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid({
        value: 101,
        text: "101",
        regex: "^100$",
      });

      expect(isValid).toBeFalsy();
    });
  });
});
