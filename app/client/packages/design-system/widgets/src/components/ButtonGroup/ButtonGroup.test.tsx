import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { Button } from "../Button/Button";
import type { ButtonGroupProps } from "./ButtonGroup";
import { ButtonGroup } from "./ButtonGroup";

const renderComponent = (props: ButtonGroupProps = {}) => {
  return render(
    <ButtonGroup {...props}>
      <Button>Button 1</Button>
      <Button>Button 2</Button>
      <Button>Button 3</Button>
    </ButtonGroup>,
  );
};

describe("@design-system/widgets/Button Group", () => {
  it("should render the button group", () => {
    renderComponent();

    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
    expect(screen.getByText("Button 3")).toBeInTheDocument();
  });

  it("should support custom props", () => {
    const { container } = renderComponent({
      "data-testid": "button-group",
    } as any);

    const buttonGroup = container.querySelector("div") as HTMLElement;
    expect(buttonGroup).toHaveAttribute("data-testid", "button-group");
  });
});
