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
        value: "0000000000",
        text: "0000000000",
        isRequired: true,
      });

      expect(isValid).toBeTruthy();
    });

    it("should test validation", () => {
      let isValid = derivedProperty.isValid({
        value: "0000000000",
        text: "0000000000",
        validation: false,
      });

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid({
        value: "0000000000",
        text: "0000000000",
        validation: true,
      });

      expect(isValid).toBeTruthy();
    });

    it("should test regex validation", () => {
      let isValid = derivedProperty.isValid({
        value: "0000000000",
        text: "0000000000",
        regex: "^0000000000$",
      });

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid({
        value: "0000000001",
        text: "0000000001",
        regex: "^0000000000$",
      });

      expect(isValid).toBeFalsy();
    });
  });
});
