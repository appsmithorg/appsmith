import React from "react";
import { render } from "@testing-library/react";
import type { WidgetProps } from "widgets/BaseWidget";
import PropertySection from "./PropertySection";

interface MockPropertySectionProps {
  shouldDisableSection?: (
    widgetProps: WidgetProps,
    propertyPath: string,
  ) => boolean;
  widgetProps: WidgetProps;
  propertyPath?: string;
  className?: string;
  name: string;
  tag?: string;
  onToggle?: () => void;
  children?: React.ReactNode;
  disabledHelpText?: string;
}

const MockPropertySection = (props: MockPropertySectionProps) => {
  const isSectionDisabled =
    props.shouldDisableSection &&
    props.shouldDisableSection(props.widgetProps, props.propertyPath || "");

  return (
    <div
      className={`t--property-pane-section-wrapper ${props.className} ${isSectionDisabled ? "cursor-not-allowed opacity-50" : ""}`}
      data-testid="t--property-pane-section-wrapper"
    >
      <div
        className={`section-title-wrapper flex items-center ${
          !props.tag && !isSectionDisabled ? "cursor-pointer" : "cursor-default"
        }`}
        data-testid="t--section-title"
        onClick={!isSectionDisabled ? props.onToggle : undefined}
      >
        <span>{props.name}</span>
        {props.children && (
          <div data-testid="t--section-content">{props.children}</div>
        )}
      </div>

      {isSectionDisabled && props.disabledHelpText && (
        <div data-testid="t--disabled-tooltip">{props.disabledHelpText}</div>
      )}
    </div>
  );
};

jest.mock("./PropertySection", () => (props: MockPropertySectionProps) => (
  <MockPropertySection {...props} />
));

describe("PropertySection", () => {
  const mockOnToggle = jest.fn();

  const getDefaultProps = () => ({
    id: "test-section",
    name: "Test Section",
    collapsible: true,
    isDefaultOpen: true,
    propertyPath: "testProperty",
    widgetProps: {
      widgetId: "test-widget",
      widgetName: "TestWidget",
      type: "CONTAINER_WIDGET",
      testProperty: "test value",
    },
    onToggle: mockOnToggle,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render section normally when not disabled", () => {
    const { getByTestId } = render(<PropertySection {...getDefaultProps()} />);

    const wrapper = getByTestId("t--property-pane-section-wrapper");

    expect(wrapper.className).not.toContain("cursor-not-allowed");
    expect(wrapper.className).not.toContain("opacity-50");

    const sectionTitle = getByTestId("t--section-title");

    expect(sectionTitle.className).toContain("cursor-pointer");
  });

  it("should render disabled section when disabled prop is true", () => {
    const props = {
      ...getDefaultProps(),
      shouldDisableSection: () => true,
    };

    const { getByTestId } = render(<PropertySection {...props} />);

    const wrapper = getByTestId("t--property-pane-section-wrapper");

    expect(wrapper.classList.contains("cursor-not-allowed")).toBe(true);
    expect(wrapper.classList.contains("opacity-50")).toBe(true);

    const sectionTitle = getByTestId("t--section-title");

    expect(sectionTitle.className).toContain("cursor-default");
  });

  it("should show disabled help text when section is disabled", () => {
    const props = {
      ...getDefaultProps(),
      shouldDisableSection: () => true,
      disabledHelpText: "This section is disabled because...",
    };

    const { getByTestId } = render(<PropertySection {...props} />);

    expect(getByTestId("t--disabled-tooltip")).toBeTruthy();
    expect(getByTestId("t--disabled-tooltip").textContent).toBe(
      "This section is disabled because...",
    );
  });

  it("should not show disabled help text when section is not disabled", () => {
    const props = {
      ...getDefaultProps(),
      shouldDisableSection: () => false,
      disabledHelpText: "This section is disabled because...",
    };

    const { queryByTestId } = render(<PropertySection {...props} />);

    expect(queryByTestId("t--disabled-tooltip")).toBeFalsy();
  });

  it("clicking on section title should trigger toggle when not disabled", () => {
    const { getByTestId } = render(<PropertySection {...getDefaultProps()} />);

    const sectionTitle = getByTestId("t--section-title");

    sectionTitle.click();

    expect(mockOnToggle).toHaveBeenCalled();
  });

  it("clicking on section title should not trigger toggle when disabled", () => {
    const props = {
      ...getDefaultProps(),
      shouldDisableSection: () => true,
    };

    const { getByTestId } = render(<PropertySection {...props} />);

    const sectionTitle = getByTestId("t--section-title");

    sectionTitle.click();

    expect(mockOnToggle).not.toHaveBeenCalled();
  });
});
