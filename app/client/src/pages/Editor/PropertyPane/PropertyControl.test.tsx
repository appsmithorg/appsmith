import React from "react";
import { render } from "@testing-library/react";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { IPanelProps } from "@blueprintjs/core";
import type { WidgetProps } from "widgets/BaseWidget";
import PropertyControl from "./PropertyControl";
import type { EnhancementFns } from "selectors/widgetEnhancementSelectors";

interface MockPropertyControlProps {
  disabled?: (widgetProperties: WidgetProps, propertyName: string) => boolean;
  disabledHelpText?: string;
  label: string;
  propertyName: string;
  widgetProperties: WidgetProps;
}

const MockPropertyControl = (props: MockPropertyControlProps) => {
  const isDisabled = props.disabled
    ? props.disabled(props.widgetProperties, props.propertyName)
    : false;

  return (
    <div
      className={isDisabled ? "cursor-not-allowed opacity-50" : ""}
      data-testid="t--property-control-wrapper"
    >
      <label>{props.label}</label>
      <input
        data-testid="t--property-input"
        disabled={isDisabled}
        role="textbox"
        type="text"
      />
      {isDisabled && props.disabledHelpText && (
        <div data-testid="t--disabled-help-text">{props.disabledHelpText}</div>
      )}
    </div>
  );
};

jest.mock("./PropertyControl", () => (props: MockPropertyControlProps) => (
  <MockPropertyControl {...props} />
));

describe("PropertyControl", () => {
  const mockPanel: IPanelProps = {
    closePanel: jest.fn(),
    openPanel: jest.fn(),
  };

  const defaultProps = {
    controlType: "INPUT_TEXT",
    enhancements: undefined as EnhancementFns | undefined,
    isBindProperty: true,
    isSearchResult: false,
    isTriggerProperty: false,
    label: "Test Label",
    panel: mockPanel,
    propertyName: "testProperty",
    theme: EditorTheme.LIGHT,
    widgetProperties: {
      testProperty: "test value",
      type: "CONTAINER_WIDGET",
      widgetId: "test-widget",
      widgetName: "TestWidget",
    },
  };

  it("should render property control normally when not disabled", () => {
    const { getByTestId } = render(<PropertyControl {...defaultProps} />);

    expect(
      (getByTestId("t--property-input") as HTMLInputElement).disabled,
    ).toBe(false);
    expect(getByTestId("t--property-control-wrapper").className).toBe("");
  });

  it("should render disabled property control when disabled prop is true", () => {
    const disabledProps = {
      ...defaultProps,
      disabled: () => true,
    };

    const { getByTestId } = render(<PropertyControl {...disabledProps} />);

    const wrapper = getByTestId("t--property-control-wrapper");

    expect(wrapper.classList.contains("cursor-not-allowed")).toBe(true);
    expect(wrapper.classList.contains("opacity-50")).toBe(true);
    expect(
      (getByTestId("t--property-input") as HTMLInputElement).disabled,
    ).toBe(true);
  });

  it("should show disabled help text when property is disabled", () => {
    const disabledProps = {
      ...defaultProps,
      disabled: () => true,
      disabledHelpText: "This property is disabled because...",
    };

    const { getByTestId } = render(<PropertyControl {...disabledProps} />);

    expect(getByTestId("t--disabled-help-text")).toBeTruthy();
    expect(getByTestId("t--disabled-help-text").textContent).toBe(
      "This property is disabled because...",
    );
  });

  it("should not show disabled help text when property is not disabled", () => {
    const props = {
      ...defaultProps,
      disabled: () => false,
      disabledHelpText: "This property is disabled because...",
    };

    const { queryByTestId } = render(<PropertyControl {...props} />);

    expect(queryByTestId("t--disabled-help-text")).toBeFalsy();
  });
});
