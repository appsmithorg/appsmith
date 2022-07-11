import _ from "lodash";
import derivedProperty from "./derived";

describe("Derived property - Select Widget", () => {
  describe("isValid property", () => {
    it("should test isRequired", () => {
      //Select with required false and empty value
      let isValid = derivedProperty.getIsValid(
        {
          isRequired: false,
          selectedOptionValue: "",
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Select with required true and valid value
      isValid = derivedProperty.getIsValid(
        {
          selectedOptionValue: "GREEN",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Select with required true and invalid value
      isValid = derivedProperty.getIsValid(
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

  describe("selectedOptionValue property", () => {
    it("should test selectedOptionValue", () => {
      let selectedOptionValue = derivedProperty.getSelectedOptionValue(
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

      selectedOptionValue = derivedProperty.getSelectedOptionValue(
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

      selectedOptionValue = derivedProperty.getSelectedOptionValue(
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

      selectedOptionValue = derivedProperty.getSelectedOptionValue(
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

      selectedOptionValue = derivedProperty.getSelectedOptionValue(
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

      selectedOptionValue = derivedProperty.getSelectedOptionValue(
        {
          serverSideFiltering: true,
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

      expect(selectedOptionValue).toBe("YELLOW");
    });
  });

  describe("selectedOptionLabel property", () => {
    it("should test selectedOptionLabel", () => {
      let selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
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

      selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
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

      selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
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

      selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
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

      selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          selectedOptionValue: "GREEN",
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

      expect(selectedOptionLabel).toBe("Green");

      selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
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

      selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
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

      selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
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

      selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          serverSideFiltering: true,
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

      expect(selectedOptionLabel).toBe("YELLOW");
    });
  });
});
