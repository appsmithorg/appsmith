import SwitchControl from "./SwitchControl";

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

describe("SwitchControl.canDisplayValue", () => {
  it("Should return true when 'true' or 'false' is passed", () => {
    expect(SwitchControl.canDisplayValueInUI(config, "true")).toEqual(true);
    expect(SwitchControl.canDisplayValueInUI(config, "false")).toEqual(true);
  });

  it("Should return false when a value other than 'true' or 'false' is passed", () => {
    expect(SwitchControl.canDisplayValueInUI(config, "{{true}}")).toEqual(
      false,
    );
  });
});
