import React from "react";
import "@testing-library/jest-dom";
import { Checkbox } from "@appsmith/wds";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

describe("@appsmith/wds/Checkbox", () => {
  const onChangeSpy = jest.fn();

  it("should render the checkbox", () => {
    render(<Checkbox>Click me</Checkbox>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should render uncontrolled checkbox", async () => {
    render(
      <Checkbox defaultSelected onChange={onChangeSpy}>
        Checkbox
      </Checkbox>,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
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

  it("should render invalid attributes when input is invalid", () => {
    render(<Checkbox isInvalid>Checkbox</Checkbox>);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toHaveAttribute("aria-invalid", "true");
  });

  it("should render indeterminate checkbox", () => {
    const { container } = render(<Checkbox isIndeterminate>Checkbox</Checkbox>);
    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const label = container.querySelector("label") as HTMLElement;
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;

    expect(checkbox.indeterminate).toBe(true);
    expect(label).toHaveAttribute("data-indeterminate", "true");
  });
});
