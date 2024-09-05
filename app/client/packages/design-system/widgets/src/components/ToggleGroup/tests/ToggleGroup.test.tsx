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
      <ToggleGroup items={items} label="Checkbox Group">
        {({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>,
    );

    expect(screen.getByText("Value 1")).toBeInTheDocument();
    expect(screen.getByText("Value 2")).toBeInTheDocument();

    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const label = container.querySelector("label") as HTMLElement;
    expect(label).toHaveTextContent("Checkbox Group");

    const toggleGroup = screen.getByRole("group");
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
      <ToggleGroup
        data-testid="t--checkbox-group"
        items={items}
        label="Checkbox Group Label"
      >
        {({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>,
    );

    const toggleGroup = screen.getByTestId("t--checkbox-group");
    expect(toggleGroup).toBeInTheDocument();
  });

  it("should render checked checkboxes when value is passed", () => {
    render(
      <ToggleGroup
        items={items}
        label="Checkbox Group Label"
        value={["value-1", "value-2"]}
      >
        {({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it("should be able to fire onChange event", async () => {
    const onChangeSpy = jest.fn();

    render(
      <ToggleGroup
        items={items}
        label="Checkbox Group Label"
        onChange={onChangeSpy}
      >
        {({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);
    expect(onChangeSpy).toHaveBeenCalled();
  });

  it("should be able to render disabled checkboxes", () => {
    render(
      <ToggleGroup isDisabled items={items} label="Checkbox Group Label">
        {({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).toBeDisabled();
  });
});
