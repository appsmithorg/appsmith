import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { noop } from "lodash";
import DropDownControl, { DropDownControlProps } from "./DropDownControl";

const requiredParams: DropDownControlProps = {
  evaluatedValue: undefined,
  widgetProperties: undefined,
  parentPropertyName: "",
  parentPropertyValue: undefined,
  placeholderText: "",
  searchPlaceholderText: "",
  additionalDynamicData: {},
  label: "",
  propertyName: "",
  propertyValue: "1",
  controlType: "",
  isBindProperty: false,
  isTriggerProperty: false,
  openNextPanel: noop,
  deleteProperties: noop,
  theme: EditorTheme.LIGHT,
};

describe("DropDownControl.canDisplayValue", () => {
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
    {
      label: "A",
      value: "A",
    },
  ];
  const config = { ...requiredParams, options };
  it("Should return true when a value in the option is passed", () => {
    expect(DropDownControl.canDisplayValueInUI(config, "0")).toEqual(true);
    expect(DropDownControl.canDisplayValueInUI(config, "1")).toEqual(true);
    expect(DropDownControl.canDisplayValueInUI(config, "A")).toEqual(true);
  });

  it("Should return false when a value that is not in the option is passed", () => {
    expect(DropDownControl.canDisplayValueInUI(config, "6")).toEqual(false);
  });
});

describe("DropDownControl[isMultiSelect].canDisplayValue", () => {
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
    {
      label: "A",
      value: "A",
    },
  ];
  const config = { ...requiredParams, options, isMultiSelect: true };
  it("Should return true when a value in the option is passed", () => {
    expect(DropDownControl.canDisplayValueInUI(config, "[0]")).toEqual(true);
    expect(DropDownControl.canDisplayValueInUI(config, "[1]")).toEqual(true);
    expect(DropDownControl.canDisplayValueInUI(config, '["A"]')).toEqual(true);
  });

  it("Should return false when a value that is not in the option is passed", () => {
    expect(DropDownControl.canDisplayValueInUI(config, "[6]")).toEqual(false);
  });

  it("Should return false when an invalid option is passed", () => {
    expect(DropDownControl.canDisplayValueInUI(config, "0")).toEqual(false);
  });
});
