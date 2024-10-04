import React from "react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { ToggleGroup, Checkbox } from "@appsmith/wds";

describe("@appsmith/wds/ToggleGroup", () => {
  const items = [
    { label: "Value 1", value: "value-1" },
    { label: "Value 2", value: "value-2" },
  ];

  it("should render the checkbox group", async () => {
    const { container } = render(
      <ToggleGroup label="Checkbox Group">
        {items.map(({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        ))}
      </ToggleGroup>,
    );

    expect(screen.getByText("Value 1")).toBeInTheDocument();
    expect(screen.getByText("Value 2")).toBeInTheDocument();

    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const label = container.querySelector(
      "[data-field-label-wrapper] label",
    ) as HTMLElement;

    expect(label).toHaveTextContent("Checkbox Group");

    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const toggleGroup = container.querySelector("[data-field]") as HTMLElement;

    expect(toggleGroup).toHaveAttribute("aria-labelledby");
    expect(toggleGroup.getAttribute("aria-labelledby")).toBe(label.id);

    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).toHaveAttribute("value", "value-1");
    expect(checkboxes[1]).toHaveAttribute("value", "value-2");

    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    await userEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    await userEvent.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
  });

  it("should support custom props", () => {
    render(
      <ToggleGroup data-testid="t--checkbox-group" label="Checkbox Group Label">
        {items.map(({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        ))}
      </ToggleGroup>,
    );

    const toggleGroup = screen.getByTestId("t--checkbox-group");

    expect(toggleGroup).toBeInTheDocument();
  });

  it("should render checked checkboxes when value is passed", () => {
    render(
      <ToggleGroup label="Checkbox Group Label" value={["value-1", "value-2"]}>
        {items.map(({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        ))}
      </ToggleGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it("should be able to fire onChange event", async () => {
    const onChangeSpy = jest.fn();

    render(
      <ToggleGroup label="Checkbox Group Label" onChange={onChangeSpy}>
        {items.map(({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        ))}
      </ToggleGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");

    await userEvent.click(checkboxes[0]);
    expect(onChangeSpy).toHaveBeenCalled();
  });

  it("should be able to render disabled checkboxes", () => {
    render(
      <ToggleGroup isDisabled label="Checkbox Group Label">
        {items.map(({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        ))}
      </ToggleGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).toBeDisabled();
  });
});
