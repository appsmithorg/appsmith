import React from "react";
import { render, screen } from "@testing-library/react";
import {
  DisabledControlValue,
  getDisabledControlValueText,
} from "./DisabledControlValue";

describe("getDisabledControlValueText", () => {
  it.each([
    ["a string", ".x { color: red; }", ".x { color: red; }"],
    ["a number", 12, "12"],
    ["a boolean", false, "false"],
    ["an empty string", "", null],
    ["a blank string", "   \n", null],
    ["undefined", undefined, null],
    ["null", null, null],
    ["an object", { a: 1 }, null],
  ])("returns the expected text for %s", (_name, value, expected) => {
    expect(getDisabledControlValueText(value)).toBe(expected);
  });
});

describe("DisabledControlValue", () => {
  it("shows the value as read-only text", () => {
    render(
      <DisabledControlValue
        label="Custom CSS"
        value={".card {\n  color: red;\n}"}
      />,
    );

    const block = screen.getByTestId("t--property-control-disabled-value");

    expect(block.textContent).toBe(".card {\n  color: red;\n}");
    expect(block.getAttribute("role")).toBe("textbox");
    expect(block.getAttribute("aria-label")).toBe("Custom CSS");
    expect(block.getAttribute("aria-readonly")).toBe("true");
  });

  it("renders markup in the value as text, not as elements", () => {
    render(
      <DisabledControlValue
        label="Custom CSS"
        value={"<img src=x onerror=alert(1)>"}
      />,
    );

    const block = screen.getByTestId("t--property-control-disabled-value");

    expect(block.querySelector("img")).toBeNull();
    expect(block.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("renders nothing for an empty value", () => {
    render(<DisabledControlValue label="Custom CSS" value="" />);

    expect(
      screen.queryByTestId("t--property-control-disabled-value"),
    ).toBeNull();
  });
});
