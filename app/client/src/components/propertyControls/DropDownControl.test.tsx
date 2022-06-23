import DropDownControl from "./DropDownControl";

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
    label: "0",
    value: 0,
  },
  {
    label: "1",
    value: 1,
  },
  {
    label: "2",
    value: 2,
  },
];
const config = { ...requiredParams, options };

describe("DropDownControl.canDisplayValue", () => {
  it("Should return true when a value in the option is passed", () => {
    expect(DropDownControl.canDisplayValueInUI(config, "0")).toEqual(true);
    expect(DropDownControl.canDisplayValueInUI(config, "1")).toEqual(true);
  });

  it("Should return false when a value that is not in the option is passed", () => {
    expect(DropDownControl.canDisplayValueInUI(config, "6")).toEqual(false);
  });
});
