import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { WidgetProps } from "widgets/BaseWidget";
import { validate } from "workers/validations";
import { defaultSelectedValuesValidation } from ".";

const DUMMY_WIDGET: WidgetProps = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  version: 2,
  widgetId: "",
  widgetName: "",
};

describe("Validators", () => {
  it("ValidationTypes.FUNCTION : defaultSelectedValuesValidation", () => {
    const inputs = [
      "BLUE",
      "BLUE, GREEN",
      ["BLUE"],
      ["BLUE", "GREEN"],
      "YELLOW",
      "BLUE, YELLOW",
      ["YELLOW"],
      ["BLUE", "YELLOW"],
    ];

    const config = {
      type: ValidationTypes.FUNCTION,
      params: {
        fnString: defaultSelectedValuesValidation.toString(),
        expected: {
          type: "Value or Array of values",
          example: `value1 | ['value1', 'value2']`,
          autocompleteDataType: AutocompleteDataType.STRING,
        },
      },
    };

    const expected = [
      {
        isValid: true,
        parsed: ["BLUE"],
      },
      {
        isValid: true,
        parsed: ["BLUE", "GREEN"],
      },
      {
        isValid: true,
        parsed: ["BLUE"],
      },
      {
        isValid: true,
        parsed: ["BLUE", "GREEN"],
      },
      {
        isValid: false,
        parsed: ["YELLOW"],
        message: "Mismatching value: YELLOW at: 0",
      },
      {
        isValid: false,
        parsed: ["BLUE", "YELLOW"],
        message: "Mismatching value: YELLOW at: 1",
      },
      {
        isValid: false,
        parsed: ["YELLOW"],
        message: "Mismatching value: YELLOW at: 0",
      },
      {
        isValid: false,
        parsed: ["BLUE", "YELLOW"],
        message: "Mismatching value: YELLOW at: 1",
      },
    ];

    inputs.forEach((input, index) => {
      const result = validate(config, input, DUMMY_WIDGET);
      expect(result).toStrictEqual(expected[index]);
    });
  });
});
