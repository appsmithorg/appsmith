import _ from "lodash";
import { flat } from "widgets/WidgetUtils";
import derivedProperty from "./derived";

const options = [
  {
    label: "Blue",
    value: "BLUE",
    children: [
      {
        label: "Dark Blue",
        value: "DARK BLUE",
      },
      {
        label: "Light Blue",
        value: "LIGHT BLUE",
      },
    ],
  },
  {
    label: "Green",
    value: "GREEN",
  },
  {
    label: "Red",
    value: "RED",
  },
];
const flattenedOptions = flat(options);

describe("Derived property - TreeSelect Widget", () => {
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
          selectedOption: "GREEN",
          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionValue).toBe("GREEN");
    });

    it("selectedOptionValue should not have a value if defaultValue(string) is not in option ", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValue(
        {
          value: "YELLOW",
          flattenedOptions,
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

          selectedLabel: "GREEN",
          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("Green");
    });

    it("selectedOptionLabel should not have a value if defaultValue(string) is not in option", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabel(
        {
          selectedOptionValue: "",

          selectedLabel: "YELLOW",
          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toBe("");
    });
  });
});
