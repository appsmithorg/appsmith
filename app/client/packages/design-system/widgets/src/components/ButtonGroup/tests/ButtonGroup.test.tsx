import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ButtonGroup, ButtonGroupItem } from "../";

import type { ButtonGroupProps } from "../";

const renderComponent = (props: ButtonGroupProps = {}) => {
  return render(
    <ButtonGroup {...props}>
      <ButtonGroupItem data-testid="Button 1" key="1">
        Button 1
      </ButtonGroupItem>
      <ButtonGroupItem data-testid="Button 2" key="2">
        Button 2
      </ButtonGroupItem>
    </ButtonGroup>,
  );
};

describe("@design-system/widgets/Button Group", () => {
  it("should render the button group", () => {
    renderComponent();

    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
  });

  it("should support custom props", () => {
    const { container } = renderComponent({
      "data-testid": "button-group",
    } as ButtonGroupProps);

    const buttonGroup = container.querySelector("div") as HTMLElement;
    expect(buttonGroup).toHaveAttribute("data-testid", "button-group");
  });

  it("should add variant to button group item", () => {
    renderComponent({
      variant: "ghost",
    });

    expect(screen.getByTestId("Button 1")).toHaveAttribute(
      "data-variant",
      "ghost",
    );
    expect(screen.getByTestId("Button 2")).toHaveAttribute(
      "data-variant",
      "ghost",
    );
  });

  it("should add color to button group item", () => {
    renderComponent({
      color: "neutral",
    });

    expect(screen.getByTestId("Button 1")).toHaveAttribute(
      "data-color",
      "neutral",
    );
    expect(screen.getByTestId("Button 2")).toHaveAttribute(
      "data-color",
      "neutral",
    );
  });
});
