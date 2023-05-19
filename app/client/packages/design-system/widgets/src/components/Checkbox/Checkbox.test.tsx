import React from "react";
import "@testing-library/jest-dom";
import { Icon } from "@design-system/headless";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmotionHappyLineIcon from "remixicon-react/EmotionHappyLineIcon";

import { Checkbox } from "./Checkbox";

describe("@design-system/widgets/Checkbox", () => {
  const onChangeSpy = jest.fn();

  it("should render the checkbox", () => {
    render(<Checkbox>Click me</Checkbox>);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("should render the checkbox with label", () => {
    render(<Checkbox>Click me</Checkbox>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should render uncontrolled checkbox", () => {
    render(
      <Checkbox defaultSelected onChange={onChangeSpy}>
        Checkbox
      </Checkbox>,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
    userEvent.click(checkbox);
    expect(onChangeSpy).toHaveBeenCalled();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("should render controlled checkbox", () => {
    const { rerender } = render(<Checkbox isSelected>Checkbox</Checkbox>);
    expect(screen.getByRole("checkbox")).toBeChecked();

    rerender(<Checkbox isSelected={false}>Checkbox</Checkbox>);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("should render disabled checkbox", () => {
    render(<Checkbox isDisabled>Checkbox</Checkbox>);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("should render invalid checkbox", () => {
    render(<Checkbox validationState="invalid">Checkbox</Checkbox>);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toHaveAttribute("aria-invalid", "true");
  });

  it("should render indeterminate checkbox", () => {
    const { container } = render(<Checkbox isIndeterminate>Checkbox</Checkbox>);
    const label = container.querySelector("label") as HTMLElement;
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;

    expect(checkbox.indeterminate).toBe(true);
    expect(label).toHaveAttribute("data-state", "indeterminate");
  });

  it("can render custom icon", () => {
    const { container } = render(
      <Checkbox
        icon={
          <Icon>
            <EmotionHappyLineIcon />
          </Icon>
        }
      />,
    );

    const icon = container.querySelector("label [data-icon]") as HTMLElement;
    expect(icon).toBeInTheDocument();
  });
});
