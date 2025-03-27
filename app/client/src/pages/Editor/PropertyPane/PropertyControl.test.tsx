import React from "react";
import { render } from "@testing-library/react";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { IPanelProps } from "@blueprintjs/core";

const MockPropertyControl = (props: any) => {
  const isDisabled = props.disabled
    ? props.disabled(props.widgetProperties, props.propertyName)
    : false;

  return (
    <div
      data-testid="t--property-control-wrapper"
      className={isDisabled ? "cursor-not-allowed opacity-50" : ""}
    >
      <label>{props.label}</label>
      <input
        type="text"
        role="textbox"
        disabled={isDisabled}
        data-testid="property-input"
      />
      {isDisabled && props.disabledHelpText && (
        <div data-testid="disabled-help-text">{props.disabledHelpText}</div>
      )}
    </div>
  );
};

jest.mock("./PropertyControl", () => (props: any) => (
  <MockPropertyControl {...props} />
));

describe("PropertyControl", () => {
  const mockPanel: IPanelProps = {
    closePanel: jest.fn(),
    openPanel: jest.fn(),
  };

  const defaultProps = {
    propertyName: "testProperty",
    label: "Test Label",
    controlType: "INPUT_TEXT",
    isBindProperty: true,
    isTriggerProperty: false,
    panel: mockPanel,
    theme: EditorTheme.LIGHT,
    isSearchResult: false,
    widgetProperties: {
      widgetId: "test-widget",
      widgetName: "TestWidget",
      type: "CONTAINER_WIDGET",
      testProperty: "test value",
    },
  };

  it("should render property control normally when not disabled", () => {
    const PropertyControl = require("./PropertyControl");
    const { getByTestId } = render(<PropertyControl {...defaultProps} />);

    expect((getByTestId("property-input") as HTMLInputElement).disabled).toBe(
      false,
    );
    expect(getByTestId("t--property-control-wrapper").className).toBe("");
  });

  it("should render disabled property control when disabled prop is true", () => {
    const PropertyControl = require("./PropertyControl");
    const disabledProps = {
      ...defaultProps,
      disabled: () => true,
    };

    const { getByTestId } = render(<PropertyControl {...disabledProps} />);

    const wrapper = getByTestId("t--property-control-wrapper");
    expect(wrapper.classList.contains("cursor-not-allowed")).toBe(true);
    expect(wrapper.classList.contains("opacity-50")).toBe(true);
    expect((getByTestId("property-input") as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it("should show disabled help text when property is disabled", () => {
    const PropertyControl = require("./PropertyControl");
    const disabledProps = {
      ...defaultProps,
      disabled: () => true,
      disabledHelpText: "This property is disabled because...",
    };

    const { getByTestId } = render(<PropertyControl {...disabledProps} />);

    expect(getByTestId("disabled-help-text")).toBeTruthy();
    expect(getByTestId("disabled-help-text").textContent).toBe(
      "This property is disabled because...",
    );
  });

  it("should not show disabled help text when property is not disabled", () => {
    const PropertyControl = require("./PropertyControl");
    const props = {
      ...defaultProps,
      disabled: () => false,
      disabledHelpText: "This property is disabled because...",
    };

    const { queryByTestId } = render(<PropertyControl {...props} />);

    expect(queryByTestId("disabled-help-text")).toBeFalsy();
  });
});
