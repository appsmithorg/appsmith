import React from "react";
import { render, screen } from "@testing-library/react";
import BorderRadiusOptionsControl from "./BorderRadiusOptionsControl";
import BoxShadowOptionsControl from "./BoxShadowOptionsControl";

jest.mock("@appsmith/ads", () => {
  const ReactLib = require("react");

  return {
    Icon: () => null,
    Tooltip: ({ children }: { children: React.ReactNode }) => children,
    SegmentedControl: ReactLib.forwardRef(
      (
        props: { value?: string },
        ref: React.ForwardedRef<HTMLDivElement>,
      ) => <div ref={ref} data-testid="segmented-control" data-value={props.value} />,
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
  propertyName: "submitButtonStyles.borderRadius",
  controlType: "",
  isBindProperty: false,
  isTriggerProperty: false,
  deleteProperties: jest.fn(),
  onPropertyChange: jest.fn(),
  openNextPanel: jest.fn(),
};

describe("border radius and box shadow option controls", () => {
  it("uses the static property value instead of stale evaluated value", () => {
    const { rerender } = render(
      <BorderRadiusOptionsControl
        {...requiredParams}
        controlType="BORDER_RADIUS_OPTIONS"
        evaluatedValue="0px"
        propertyValue="1.5rem"
      />,
    );

    expect(screen.getByTestId("segmented-control")).toHaveAttribute(
      "data-value",
      "1.5rem",
    );

    rerender(
      <BoxShadowOptionsControl
        {...requiredParams}
        controlType="BOX_SHADOW_OPTIONS"
        propertyName="submitButtonStyles.boxShadow"
        evaluatedValue="none"
        propertyValue="0 1px 3px rgba(0, 0, 0, 0.2)"
      />,
    );

    expect(screen.getByTestId("segmented-control")).toHaveAttribute(
      "data-value",
      "0 1px 3px rgba(0, 0, 0, 0.2)",
    );
  });

  it("uses the evaluated value for dynamic property bindings", () => {
    render(
      <BorderRadiusOptionsControl
        {...requiredParams}
        controlType="BORDER_RADIUS_OPTIONS"
        evaluatedValue="0.375rem"
        propertyValue="{{ appsmith.theme.borderRadius.appBorderRadius }}"
      />,
    );

    expect(screen.getByTestId("segmented-control")).toHaveAttribute(
      "data-value",
      "0.375rem",
    );
  });
});
