import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import ClearableNumericInputControl from "./ClearableNumericInputControl";
import type { ClearableNumericInputControlProps } from "./ClearableNumericInputControl";

function renderControl(props: Partial<ClearableNumericInputControlProps> = {}) {
  const onPropertyChange = jest.fn();
  const deleteProperties = jest.fn();

  const controlProps = {
    evaluatedValue: undefined,
    widgetProperties: { type: "BUTTON_WIDGET" },
    parentPropertyName: "",
    parentPropertyValue: undefined,
    additionalDynamicData: {},
    label: "Numeric",
    propertyName: "numericProp",
    controlType: "CLEARABLE_NUMERIC_INPUT",
    isBindProperty: false,
    isTriggerProperty: false,
    placeholderText: "Auto",
    min: 0,
    onPropertyChange,
    deleteProperties,
    openNextPanel: jest.fn(),
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme: "LIGHT" as any,
    ...props,
  } as ClearableNumericInputControlProps;

  const utils = render(<ClearableNumericInputControl {...controlProps} />);

  return { ...utils, onPropertyChange, deleteProperties };
}

function getInput() {
  return screen.getByRole("textbox") as HTMLInputElement;
}

describe("ClearableNumericInputControl", () => {
  it("persists a numeric value as a number", () => {
    const { onPropertyChange } = renderControl();

    fireEvent.change(getInput(), { target: { value: "5" } });

    expect(onPropertyChange).toHaveBeenCalledWith(
      "numericProp",
      5,
      expect.anything(),
    );
  });

  it("persists 0", () => {
    const { onPropertyChange } = renderControl();

    fireEvent.change(getInput(), { target: { value: "0" } });

    expect(onPropertyChange).toHaveBeenCalledWith(
      "numericProp",
      0,
      expect.anything(),
    );
  });

  it("removes the property from the DSL when the field is cleared", () => {
    const { deleteProperties, onPropertyChange } = renderControl({
      propertyValue: 3,
    });

    fireEvent.change(getInput(), { target: { value: "" } });

    expect(deleteProperties).toHaveBeenCalledWith(["numericProp"]);
    expect(onPropertyChange).not.toHaveBeenCalled();
  });

  it("does not dispatch a delete when clearing an already-unset field", () => {
    const { deleteProperties, onPropertyChange } = renderControl();

    fireEvent.change(getInput(), { target: { value: "" } });

    expect(deleteProperties).not.toHaveBeenCalled();
    expect(onPropertyChange).not.toHaveBeenCalled();
  });

  it("removes a stale null value when the field is cleared", () => {
    // propertyValue is null (renders empty); type a value then clear it so the
    // clear branch runs while the prop is still null
    const { deleteProperties } = renderControl({ propertyValue: null });

    fireEvent.change(getInput(), { target: { value: "5" } });
    fireEvent.change(getInput(), { target: { value: "" } });

    expect(deleteProperties).toHaveBeenCalledWith(["numericProp"]);
  });

  it("persists the entered value as-is, leaving range/format checks to the property validation", () => {
    const { onPropertyChange } = renderControl();

    fireEvent.change(getInput(), { target: { value: "1.5" } });

    expect(onPropertyChange).toHaveBeenCalledWith(
      "numericProp",
      1.5,
      expect.anything(),
    );
  });

  it("clamps to the configured minimum instead of persisting a smaller value", () => {
    const { onPropertyChange } = renderControl({ min: 0 });

    fireEvent.change(getInput(), { target: { value: "-3" } });

    // the NumberInput clamps to min=0, so a negative value is never persisted
    expect(onPropertyChange).toHaveBeenCalledWith(
      "numericProp",
      0,
      expect.anything(),
    );
  });

  it("shows the placeholder when the value is unset", () => {
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

    it("returns true for numeric values and false for blank/non-numeric", () => {
      expect(
        ClearableNumericInputControl.canDisplayValueInUI(config, "0"),
      ).toBe(true);
      expect(ClearableNumericInputControl.canDisplayValueInUI(config, 3)).toBe(
        true,
      );
      expect(
        ClearableNumericInputControl.canDisplayValueInUI(config, "1.5"),
      ).toBe(true);
      expect(
        ClearableNumericInputControl.canDisplayValueInUI(config, "abc"),
      ).toBe(false);
      expect(ClearableNumericInputControl.canDisplayValueInUI(config, "")).toBe(
        false,
      );
      // whitespace-only is blank, consistent with clear semantics
      expect(
        ClearableNumericInputControl.canDisplayValueInUI(config, "   "),
      ).toBe(false);
    });
  });
});
