import React from "react";
import "@testing-library/jest-dom";
import type { ComponentProps } from "react";
import { Checkbox } from "@design-system/widgets";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

const EmotionHappyLineIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      fill="currentColor"
      height={24}
      viewBox="0 0 24 24"
      width={24}
      {...props}
    >
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-5-7h2a3 3 0 1 0 6 0h2a5 5 0 0 1-10 0Zm1-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  );
};

describe("@design-system/widgets/Checkbox", () => {
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
    render(<Checkbox validationState="invalid">Checkbox</Checkbox>);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toHaveAttribute("aria-invalid", "true");
  });

  it("should render indeterminate checkbox", () => {
    const { container } = render(<Checkbox isIndeterminate>Checkbox</Checkbox>);
    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const label = container.querySelector("label") as HTMLElement;
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;

    expect(checkbox.indeterminate).toBe(true);
    expect(label).toHaveAttribute("data-state", "indeterminate");
  });

  it("should be able to render custom icon", () => {
    const { container } = render(<Checkbox icon={EmotionHappyLineIcon} />);

    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const icon = container.querySelector("label [data-icon]") as HTMLElement;
    expect(icon).toBeInTheDocument();
  });
});
