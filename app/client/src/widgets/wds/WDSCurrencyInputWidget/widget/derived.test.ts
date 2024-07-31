import _ from "lodash";
import derivedProperty from "./derived";
describe("Derived property - ", () => {
  describe("isValid property", () => {
    it("should test isRequired", () => {
      let isValid = derivedProperty.isValid(
        {
          rawText: undefined,
          isRequired: false,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          rawText: undefined,
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          rawText: 100,
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("should test validation", () => {
      let isValid = derivedProperty.isValid(
        {
          rawText: 100,
          validation: false,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          rawText: 100,
          validation: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("should test regex validation", () => {
      let isValid = derivedProperty.isValid(
        {
          rawText: 100,
          regex: "^100$",
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          rawText: 101,
          regex: "^100$",
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();
    });
  });
});
