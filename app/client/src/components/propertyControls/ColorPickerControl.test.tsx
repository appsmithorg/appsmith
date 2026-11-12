import React from "react";
import { render, screen } from "@testing-library/react";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import ColorPickerControl from "./ColorPickerControl";

// The real color field needs a Redux store and a theme. These tests check
// only which props the control passes to it.
jest.mock("components/propertyControls/ColorPickerComponentV2", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactLib = require("react");

  return {
    __esModule: true,
    default: ReactLib.forwardRef(
      (props: { placeholderText?: string }, ref: unknown) =>
        ReactLib.createElement("input", {
          "data-testid": "mock-color-input",
          placeholder: props.placeholderText,
          ref,
        }),
    ),
  };
});

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

describe("ColorPickerControl placeholder", () => {
  const renderControl = (extra: {
    colorPlaceholderText?: string;
    placeholderText?: string;
  }) =>
    render(
      <ColorPickerControl
        {...requiredParams}
        controlType="COLOR_PICKER"
        deleteProperties={jest.fn()}
        onPropertyChange={jest.fn()}
        openNextPanel={jest.fn()}
        propertyName="backgroundColor"
        propertyValue=""
        theme={EditorTheme.LIGHT}
        {...extra}
      />,
    );

  it("passes colorPlaceholderText to the color field", () => {
    renderControl({ colorPlaceholderText: "From theme" });

    expect(
      screen.getByTestId("mock-color-input").getAttribute("placeholder"),
    ).toBe("From theme");
  });

  it("ignores placeholderText, so existing color configs keep the field's own text", () => {
    renderControl({ placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)" });

    expect(
      screen.getByTestId("mock-color-input").hasAttribute("placeholder"),
    ).toBe(false);
  });
});
