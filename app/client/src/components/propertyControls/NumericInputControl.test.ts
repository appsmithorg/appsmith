import NumericInputControl from "./NumericInputControl";

const config = {
  evaluatedValue: undefined,
  widgetProperties: undefined,
  parentPropertyName: "",
  parentPropertyValue: undefined,
  additionalDynamicData: {},
  label: "",
  propertyName: "",
  controlType: "",
  isBindProperty: false,
  isTriggerProperty: false,
};

describe("NumericInputControl.canDisplayValue", () => {
  it("Should return true when a number is passed", () => {
    expect(NumericInputControl.canDisplayValueInUI(config, "23")).toEqual(true);
    expect(NumericInputControl.canDisplayValueInUI(config, "12")).toEqual(true);
    expect(NumericInputControl.canDisplayValueInUI(config, "93.5")).toEqual(
      true,
    );
    expect(NumericInputControl.canDisplayValueInUI(config, "-123")).toEqual(
      true,
    );
  });

  it("Should return false when a non number is passed", () => {
    expect(NumericInputControl.canDisplayValueInUI(config, "abcd")).toEqual(
      false,
    );
    expect(NumericInputControl.canDisplayValueInUI(config, "{{ 1 }}")).toEqual(
      false,
    );
  });
});
