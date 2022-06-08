import ColorPickerControl from "./ColorPickerControl";

const requiredParams = {
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

const config = { ...requiredParams };

describe("ColorPickerControl.canDisplayValue", () => {
  it("Should return true when a value without binding is passed", () => {
    expect(ColorPickerControl.canDisplayValueInUI(config, "red")).toEqual(true);
    expect(ColorPickerControl.canDisplayValueInUI(config, "#ff0000")).toEqual(
      true,
    );
    expect(ColorPickerControl.canDisplayValueInUI(config, "#f00")).toEqual(
      true,
    );
    expect(
      ColorPickerControl.canDisplayValueInUI(config, "rgba(255, 0, 0)"),
    ).toEqual(true);
  });

  it("Should return false when a value with binding is passed", () => {
    expect(
      ColorPickerControl.canDisplayValueInUI(config, "{{ Input1.text }}"),
    ).toEqual(false);
    expect(
      ColorPickerControl.canDisplayValueInUI(config, "{{ Input1.text }}ed"),
    ).toEqual(false);
  });
});
