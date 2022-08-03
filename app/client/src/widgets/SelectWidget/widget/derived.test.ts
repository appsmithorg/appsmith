import _ from "lodash";
import derivedProperty from "./derived";

describe("Derived property - Select Widget", () => {
  describe("#getIsValid", () => {
    it("return true when isRequired false and selectedOptionValue is empty string", () => {
      const isValid = derivedProperty.getIsValid(
        {
          isRequired: false,
          selectedOptionValue: "",
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("return true when isRequired true and selectedOptionValue is not empty", () => {
      const isValid = derivedProperty.getIsValid(
        {
          selectedOptionValue: "GREEN",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("return false when isRequired true and selectedOptionValue is empty", () => {
      const isValid = derivedProperty.getIsValid(
        {
          selectedOptionValue: "",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();
    });
  });

  describe("#getSelectedOptionValue", () => {
    it("selectedOptionValue should have a value if defaultValue(String) is in option", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValue(
        {
          serverSideFiltering: false,
          value: "GREEN",
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValue).toBe("GREEN");
    });

    it("selectedOptionValue should have a value if defaultValue(Object) is in option", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValue(
        {
          serverSideFiltering: false,
          value: { label: "Green", value: "GREEN" },
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValue).toBe("GREEN");
    });

    it("selectedOptionValue should not have a value if defaultValue(Object) is not in option and serverSideFiltering is false", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValue(
        {
          serverSideFiltering: false,
          value: { label: "Yellow", value: "YELLOW" },
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValue).toBe("");
    });

    it("selectedOptionValue should not have a value if defaultValue(string) is not in option and serverSideFiltering is false", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValue(
        {
          serverSideFiltering: false,
          value: "YELLOW",
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValue).toBe("");
    });

    it("selectedOptionValue should have a value if defaultValue(object) is not in option and serverSideFiltering is true", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValue(
        {
          serverSideFiltering: true,
          value: { label: "Yellow", value: "YELLOW" },
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionValue).toBe("YELLOW");
    });

    it("selectedOptionValue should have a value if defaultValue(string) is not in option and serverSideFiltering is true", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValue(
        {
          serverSideFiltering: true,
          value: "YELLOW",
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

      expect(selectedOptionValue).toBe("");
    });
  });

  describe("#getSelectedOptionLabel", () => {
    it("selectedOptionLabel should have a value if defaultValue(String) is in option", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          selectedOptionValue: "GREEN",
          serverSideFiltering: false,
          label: "GREEN",
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("Green");
    });

    it("selectedOptionLabel should have a value if defaultValue(Object) is in option", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          selectedOptionValue: "GREEN",
          serverSideFiltering: false,
          label: { label: "Green", value: "GREEN" },
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("Green");
    });

    it("selectedOptionLabel should have it's value from the options and not from defaultValue(Object)", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          selectedOptionValue: "GREEN",
          serverSideFiltering: false,
          label: { label: "Greenish", value: "GREEN" },
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("Green");
    });

    it("selectedOptionLabel should not have a value if defaultValue(Object) is not in option and serverSideFiltering is false", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          selectedOptionValue: "",
          serverSideFiltering: false,
          label: { label: "Yellow", value: "YELLOW" },
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("");
    });

    it("selectedOptionLabel should not have a value if defaultValue(string) is not in option and serverSideFiltering is false", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          selectedOptionValue: "",
          serverSideFiltering: false,
          label: "YELLOW",
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("");
    });

    it("selectedOptionLabel should have a value if defaultValue(object) is not in option and serverSideFiltering is true", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          serverSideFiltering: true,
          label: { label: "Yellow", value: "YELLOW" },
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );
      expect(selectedOptionLabel).toBe("Yellow");
    });

    it("selectedOptionLabel should have it's value from the options and not from defaultValue(Object) and serverSideFiltering is true", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          selectedOptionValue: "GREEN",
          serverSideFiltering: true,
          label: { label: "Greenish", value: "GREEN" },
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("Green");
    });

    it("selectedOptionLabel should have it's value if defaultValue(string) and serverSideFiltering is true", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          serverSideFiltering: true,
          selectedOptionValue: "",
          label: "YELLOW",
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
            { label: "Red", value: "RED" },
          ],
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("");
    });
  });
});
