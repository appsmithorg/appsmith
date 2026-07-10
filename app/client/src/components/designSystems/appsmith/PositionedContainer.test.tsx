import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

// Default export is the forwardRef-wrapped component; the raw named function
// receives legacy context (frozen) as its 2nd arg and mishandles the ref.
import PositionedContainer from "./PositionedContainer";
import type { PositionedContainerProps } from "./PositionedContainer";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(() => undefined),
  // redux-form (pulled in transitively via the reflow selectors) calls
  // connect() at import time; provide a passthrough HOC so the suite loads.
  connect: () => (component: unknown) => component,
}));

jest.mock("utils/hooks/useClickToSelectWidget", () => ({
  useClickToSelectWidget: () => jest.fn(),
}));

jest.mock("utils/hooks/usePositionedContainerZIndex", () => ({
  usePositionedContainerZIndex: () => ({ onHoverZIndex: 1, zIndex: 1 }),
}));

jest.mock("utils/hooks/useHoverToFocusWidget", () => ({
  useHoverToFocusWidget: () => [jest.fn(), jest.fn()],
}));

jest.mock("WidgetProvider/factory/helpers", () => ({
  checkIsDropTarget: () => false,
}));

function renderContainer(tabOrder?: PositionedContainerProps["tabOrder"]) {
  const props: PositionedContainerProps = {
    componentWidth: 100,
    componentHeight: 40,
    children: null,
    widgetId: "widget1",
    widgetType: "INPUT_WIDGET_V2",
    topRow: 0,
    parentRowSpace: 10,
    leftColumn: 0,
    parentColumnSpace: 10,
    isVisible: true,
    widgetName: "Input1",
    tabOrder,
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { container } = render(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(PositionedContainer as any, props),
  );

  return container.firstChild as HTMLElement;
}

describe("PositionedContainer data-tab-order", () => {
  it("renders the attribute for a valid explicit value", () => {
    expect(renderContainer(2)).toHaveAttribute("data-tab-order", "2");
  });

  it("renders the attribute for 1, the earliest valid value", () => {
    expect(renderContainer(1)).toHaveAttribute("data-tab-order", "1");
  });

  it("accepts valid numeric strings", () => {
    expect(renderContainer("4")).toHaveAttribute("data-tab-order", "4");
  });

  it("does not render the attribute when tabOrder is missing", () => {
    expect(renderContainer(undefined)).not.toHaveAttribute("data-tab-order");
  });

  it("does not render the attribute when tabOrder is null", () => {
    expect(renderContainer(null)).not.toHaveAttribute("data-tab-order");
  });

  it("does not render the attribute for blank strings", () => {
    expect(renderContainer("")).not.toHaveAttribute("data-tab-order");
    expect(renderContainer("   ")).not.toHaveAttribute("data-tab-order");
  });

  it("does not render the attribute for invalid values", () => {
    expect(renderContainer(0)).not.toHaveAttribute("data-tab-order");
    expect(renderContainer(-1)).not.toHaveAttribute("data-tab-order");
    expect(renderContainer(1.5)).not.toHaveAttribute("data-tab-order");
    expect(renderContainer("abc")).not.toHaveAttribute("data-tab-order");
    expect(renderContainer(NaN)).not.toHaveAttribute("data-tab-order");
    expect(renderContainer(Infinity)).not.toHaveAttribute("data-tab-order");
  });

  it("never renders a native tabindex from tabOrder", () => {
    expect(renderContainer(2)).not.toHaveAttribute("tabindex");
  });
});
