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
  {
    label: "0",
    value: 0,
  },
  {
    label: "1",
    value: 1,
  },
];
const flattenedOptions = flat(options);

describe("Derived property - TreeSelect Widget", () => {
  describe("#getIsValid", () => {
    it("return true when isRequired false and selectedOptionValue is empty string", () => {
      const isValid = derivedProperty.getIsValid(
        {
          isRequired: false,
          selectedOptionValues: [],
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("return true when isRequired true and selectedOptionValue is not empty", () => {
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
    it("return true when isRequired true and selectedOptionValue is a number", () => {
      const isValid = derivedProperty.getIsValid(
        {
          selectedOptionValues: [0],
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
    it("selectedOptionValue should have a value if defaultValue(String) is in option", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValues(
        {
          selectedOptionValueArr: ["GREEN"],
          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionValue).toStrictEqual(["GREEN"]);
    });

    it("selectedOptionValue should have a value if defaultValue(Number) is in option", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValues(
        {
          selectedOptionValueArr: [1],
          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionValue).toStrictEqual([1]);
    });

    it("selectedOptionValue should not have a value if defaultValue(string) is not in option ", () => {
      const selectedOptionValue = derivedProperty.getSelectedOptionValues(
        {
          selectedOptionValueArr: ["YELLOW"],
          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionValue).toStrictEqual([]);
    });
  });

  describe("#getSelectedOptionLabel", () => {
    it("selectedOptionLabel should have a value if defaultValue(String) is in option", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: ["GREEN"],

          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toStrictEqual(["Green"]);
    });
    it("selectedOptionLabel should have a value if defaultValue(Number) is in option", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: [0],

          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toStrictEqual(["0"]);
    });

    it("selectedOptionLabel should not have a value if defaultValue(string) is not in option", () => {
      const selectedOptionLabel = derivedProperty.getSelectedOptionLabels(
        {
          selectedOptionValues: ["YELLOW"],

          flattenedOptions,
        },
        null,
        _,
      );

      expect(selectedOptionLabel).toStrictEqual([]);
    });
  });
});
