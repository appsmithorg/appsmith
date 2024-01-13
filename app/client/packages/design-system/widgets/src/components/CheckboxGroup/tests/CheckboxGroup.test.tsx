import React from "react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import { CheckboxGroup } from "../";
import { Checkbox } from "../../Checkbox";

describe("@design-system/widgets/CheckboxGroup", () => {
  it("should render the checkbox group", () => {
    const { container } = render(
      <CheckboxGroup label="Checkbox Group">
        <Checkbox value="value-1">Value 1</Checkbox>
        <Checkbox value="value-2">Value 2</Checkbox>
      </CheckboxGroup>,
    );

    expect(screen.getByText("Value 1")).toBeInTheDocument();
    expect(screen.getByText("Value 2")).toBeInTheDocument();

    const label = container.querySelector("label") as HTMLElement;
    expect(label).toHaveTextContent("Checkbox Group");

    const checkboxGroup = screen.getByRole("group");
    expect(checkboxGroup).toHaveAttribute("aria-labelledby");
    expect(checkboxGroup.getAttribute("aria-labelledby")).toBe(label.id);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toHaveAttribute("value", "value-1");
    expect(checkboxes[1]).toHaveAttribute("value", "value-2");

    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    userEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    userEvent.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
  });

  it("should support custom props", () => {
    render(
      <CheckboxGroup data-testid="checkbox-group" label="Checkbox Group Label">
        <Checkbox value="value-1">Value 1</Checkbox>
        <Checkbox value="value-2">Value 2</Checkbox>
      </CheckboxGroup>,
    );

    const checkboxGroup = screen.getByTestId("checkbox-group");
    expect(checkboxGroup).toBeInTheDocument();
  });

  it("should render checked checkboxes when value is passed", () => {
    render(
      <CheckboxGroup
        label="Checkbox Group Label"
        value={["value-1", "value-2"]}
      >
        <Checkbox value="value-1">Value 1</Checkbox>
        <Checkbox value="value-2">Value 2</Checkbox>
      </CheckboxGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it("should be able to fire onChange event", () => {
    const onChangeSpy = jest.fn();

    render(
      <CheckboxGroup label="Checkbox Group Label" onChange={onChangeSpy}>
        <Checkbox value="value-1">Value 1</Checkbox>
        <Checkbox value="value-2">Value 2</Checkbox>
      </CheckboxGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    userEvent.click(checkboxes[0]);
    expect(onChangeSpy).toHaveBeenCalled();
  });

  it("should be able to render disabled checkboxes", () => {
    render(
      <CheckboxGroup isDisabled label="Checkbox Group Label">
        <Checkbox value="value-1">Value 1</Checkbox>
        <Checkbox value="value-2">Value 2</Checkbox>
      </CheckboxGroup>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).toBeDisabled();
  });
});
