import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import TabOrderControl from "./TabOrderControl";
import type { TabOrderControlProps } from "./TabOrderControl";

function renderControl(props: Partial<TabOrderControlProps> = {}) {
  const onPropertyChange = jest.fn();
  const deleteProperties = jest.fn();

  const controlProps = {
    evaluatedValue: undefined,
    widgetProperties: { type: "BUTTON_WIDGET" },
    parentPropertyName: "",
    parentPropertyValue: undefined,
    additionalDynamicData: {},
    label: "Tab order",
    propertyName: "tabOrder",
    controlType: "TAB_ORDER_INPUT",
    isBindProperty: false,
    isTriggerProperty: false,
    placeholderText: "Auto",
    onPropertyChange,
    deleteProperties,
    openNextPanel: jest.fn(),
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme: "LIGHT" as any,
    ...props,
  } as TabOrderControlProps;

  const utils = render(<TabOrderControl {...controlProps} />);

  return { ...utils, onPropertyChange, deleteProperties };
}

function getInput() {
  return screen.getByRole("textbox") as HTMLInputElement;
}

describe("TabOrderControl", () => {
  it("persists a valid non-negative integer as a number", () => {
    const { onPropertyChange } = renderControl();

    fireEvent.change(getInput(), { target: { value: "5" } });

    expect(onPropertyChange).toHaveBeenCalledWith(
      "tabOrder",
      5,
      expect.anything(),
    );
  });

  it("persists 0 as a valid value", () => {
    const { onPropertyChange } = renderControl();

    fireEvent.change(getInput(), { target: { value: "0" } });

    expect(onPropertyChange).toHaveBeenCalledWith(
      "tabOrder",
      0,
      expect.anything(),
    );
  });

  it("removes the property from the DSL when the field is cleared", () => {
    const { deleteProperties, onPropertyChange } = renderControl({
      propertyValue: 3,
    });

    fireEvent.change(getInput(), { target: { value: "" } });

    expect(deleteProperties).toHaveBeenCalledWith(["tabOrder"]);
    expect(onPropertyChange).not.toHaveBeenCalled();
  });

  it("does not dispatch a delete when clearing an already-Auto field", () => {
    const { deleteProperties, onPropertyChange } = renderControl();

    fireEvent.change(getInput(), { target: { value: "" } });

    expect(deleteProperties).not.toHaveBeenCalled();
    expect(onPropertyChange).not.toHaveBeenCalled();
  });

  it("never persists decimals", () => {
    const { deleteProperties, onPropertyChange } = renderControl({
      propertyValue: 2,
    });

    fireEvent.change(getInput(), { target: { value: "1.5" } });

    expect(onPropertyChange).not.toHaveBeenCalled();
    expect(deleteProperties).not.toHaveBeenCalled();
  });

  it("clamps negative input to the minimum instead of persisting a negative value", () => {
    const { onPropertyChange } = renderControl();

    fireEvent.change(getInput(), { target: { value: "-3" } });

    // the NumberInput clamps to min=0, so a negative value is never persisted
    expect(onPropertyChange).toHaveBeenCalledWith(
      "tabOrder",
      0,
      expect.anything(),
    );
  });

  it("shows the placeholder when the value is Auto", () => {
    renderControl();

    expect(getInput().placeholder).toBe("Auto");
    expect(getInput().value).toBe("");
  });

  describe("canDisplayValueInUI", () => {
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

    it("returns true only for valid non-negative integers", () => {
      expect(TabOrderControl.canDisplayValueInUI(config, "0")).toBe(true);
      expect(TabOrderControl.canDisplayValueInUI(config, 3)).toBe(true);
      expect(TabOrderControl.canDisplayValueInUI(config, "-1")).toBe(false);
      expect(TabOrderControl.canDisplayValueInUI(config, "1.5")).toBe(false);
      expect(TabOrderControl.canDisplayValueInUI(config, "abc")).toBe(false);
      expect(TabOrderControl.canDisplayValueInUI(config, "")).toBe(false);
    });
  });
});
