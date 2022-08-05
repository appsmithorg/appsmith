import ButtonTabControl from "./ButtonTabControl";

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

const options = [
  {
    icon: "BOLD_FONT",
    value: "BOLD",
  },
  {
    icon: "ITALICS_FONT",
    value: "ITALIC",
  },
];
const config = { ...requiredParams, options };

describe("ButtonTabControl.canDisplayValue", () => {
  it("Should return true when a value in the option is passed", () => {
    expect(ButtonTabControl.canDisplayValueInUI(config, "BOLD")).toEqual(true);
    expect(ButtonTabControl.canDisplayValueInUI(config, "ITALIC")).toEqual(
      true,
    );
    expect(ButtonTabControl.canDisplayValueInUI(config, "ITALIC,BOLD")).toEqual(
      true,
    );
    expect(ButtonTabControl.canDisplayValueInUI(config, "BOLD,ITALIC")).toEqual(
      true,
    );
  });

  it("Should return false when a value that is not in the option is passed", () => {
    expect(ButtonTabControl.canDisplayValueInUI(config, "BLABLA")).toEqual(
      false,
    );
    expect(ButtonTabControl.canDisplayValueInUI(config, "BOLD,BLABLA")).toEqual(
      false,
    );
  });
});
