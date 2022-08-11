import _ from "lodash";
import derivedProperty from "./derived";

describe("Derived property - MultiSelect Widget", () => {
  describe("#getIsValid", () => {
    it("return true when isRequired false and selectedOptionValues is empty string", () => {
      const isValid = derivedProperty.getIsValid(
        {
          isRequired: false,
          selectedOptionValues: [""],
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("return true when isRequired true and selectedOptionValues is not empty", () => {
      const isValid = derivedProperty.getIsValid(
        {
          selectedOptionValues: ["GREEN"],
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("return false when isRequired true and selectedOptionValues is empty", () => {
      const isValid = derivedProperty.getIsValid(
        {
          selectedOptionValues: [],
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();
    });
  });

  describe("#getSelectedOptionValues", () => {
    it("selectedOptionValues should have a value if defaultValue(String) is in option", () => {
      const selectedOptionValues = derivedProperty.getSelectedOptionValues(
        {
          selectedOptions: ["GREEN"],
          serverSideFiltering: false,
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValues).toStrictEqual(["GREEN"]);
    });

    it("selectedOptionValues should have a value if defaultValue(Object) is in option", () => {
      const selectedOptionValues = derivedProperty.getSelectedOptionValues(
        {
          serverSideFiltering: false,
          selectedOptions: [{ label: "Green", value: "GREEN" }],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValues).toStrictEqual(["GREEN"]);
    });

    it("selectedOptionValues should have only values present in the options; defaultValue(Object), serverSideFiltering(false)", () => {
      const selectedOptionValues = derivedProperty.getSelectedOptionValues(
        {
          serverSideFiltering: false,
          selectedOptions: [
            { label: "Yellow", value: "YELLOW" },
            { label: "Green", value: "GREEN" },
          ],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValues).toStrictEqual(["GREEN"]);
    });
    it("selectedOptionValues should have only values present in the options; defaultValue(Object), serverSideFiltering(false)", () => {
      const selectedOptionValues = derivedProperty.getSelectedOptionValues(
        {
          serverSideFiltering: false,
          selectedOptions: [{ label: "Yellow", value: "YELLOW" }],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValues).toStrictEqual([]);
    });
    it("selectedOptionValues should have only values present in the options; defaultValue(String), serverSideFiltering(false)", () => {
      const selectedOptionValues = derivedProperty.getSelectedOptionValues(
        {
          serverSideFiltering: false,
          selectedOptions: ["YELLOW"],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValues).toStrictEqual([]);
    });
    it("selectedOptionValues should have only values present in the options; defaultValue(Object), serverSideFiltering(true)", () => {
      const selectedOptionValues = derivedProperty.getSelectedOptionValues(
        {
          serverSideFiltering: true,
          selectedOptions: [{ label: "Yellow", value: "YELLOW" }],
          isDirty: false,
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValues).toStrictEqual([]);
    });
    it("selectedOptionValues should have only values present in the options; defaultValue(String), serverSideFiltering(true)", () => {
      const selectedOptionValues = derivedProperty.getSelectedOptionValues(
        {
          serverSideFiltering: true,
          selectedOptions: ["YELLOW"],
          isDirty: false,
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValues).toStrictEqual([]);
    });
  });

  describe("#getSelectedOptionLabels", () => {
    it("selectedOptionLabels should have a value if defaultValue(String) is in option", () => {
      const selectedOptionLabels = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: ["GREEN"],
          serverSideFiltering: false,
          selectedOptions: ["GREEN"],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabels).toStrictEqual(["Green"]);
    });

    it("selectedOptionLabels should have a value if defaultValue(Object) is in option", () => {
      const selectedOptionLabels = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: ["GREEN"],
          serverSideFiltering: false,
          selectedOptions: [{ label: "Green", value: "GREEN" }],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabels).toStrictEqual(["Green"]);
    });

    it("selectedOptionLabels should have it's value from the options and not from defaultValue(Object)", () => {
      const selectedOptionLabels = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: ["GREEN"],
          serverSideFiltering: false,
          selectedOptions: [{ label: "Greenish", value: "GREEN" }],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabels).toStrictEqual(["Green"]);
    });

    it("selectedOptionLabels should not have a value if defaultValue(Object) is not in option and serverSideFiltering is false", () => {
      const selectedOptionLabels = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: [],
          serverSideFiltering: false,
          selectedOptions: [{ label: "Yellow", value: "Yellow" }],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabels).toStrictEqual([]);
    });

    it("selectedOptionLabels should have a value if defaultValue(object) is not in option and serverSideFiltering is true", () => {
      const selectedOptionLabels = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: [],
          serverSideFiltering: false,
          selectedOptions: ["YELLOW"],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabels).toStrictEqual([]);
    });

    it("selectedOptionLabels should have it's value from the options and not from defaultValue(Object) and serverSideFiltering is true", () => {
      const selectedOptionLabels = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: ["GREEN"],
          serverSideFiltering: true,
          selectedOptions: [{ label: "Greenish", value: "GREEN" }],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabels).toStrictEqual(["Green"]);
    });

    it("selectedOptionLabels should have it's value if defaultValue(string) and serverSideFiltering is true", () => {
      const selectedOptionLabels = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: [],
          serverSideFiltering: true,
          selectedOptions: ["YELLOW"],
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabels).toStrictEqual([]);
    });
  });
});
