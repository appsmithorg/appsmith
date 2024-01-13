import React from "react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import { RadioGroup } from "../";
import { Radio } from "../../Radio";

describe("@design-system/widgets/RadioGroup", () => {
  it("should render the Radio group", () => {
    const { container } = render(
      <RadioGroup label="Radio Group">
        <Radio value="value-1">Value 1</Radio>
        <Radio value="value-2">Value 2</Radio>
      </RadioGroup>,
    );

    expect(screen.getByText("Value 1")).toBeInTheDocument();
    expect(screen.getByText("Value 2")).toBeInTheDocument();

    const label = container.querySelector("label") as HTMLElement;
    expect(label).toHaveTextContent("Radio Group");

    const radioGroup = screen.getByRole("radiogroup");
    expect(radioGroup).toHaveAttribute("aria-labelledby");
    expect(radioGroup.getAttribute("aria-labelledby")).toBe(label.id);

    const options = screen.getAllByRole("radio");
    expect(options[0]).toHaveAttribute("value", "value-1");
    expect(options[1]).toHaveAttribute("value", "value-2");

    expect(options[0]).not.toBeChecked();
    expect(options[1]).not.toBeChecked();

    userEvent.click(options[0]);
    expect(options[0]).toBeChecked();

    userEvent.click(options[1]);
    expect(options[0]).not.toBeChecked();
    expect(options[1]).toBeChecked();
  });

  it("should support custom props", () => {
    render(
      <RadioGroup data-testid="radio-group" label="Radio Group Label">
        <Radio value="value-1">Value 1</Radio>
        <Radio value="value-2">Value 2</Radio>
        <Radio value="value-3">Value 3</Radio>
      </RadioGroup>,
    );

    const radioGroup = screen.getByTestId("radio-group");
    expect(radioGroup).toBeInTheDocument();
  });

  it("should render checked checkboxes when value is passed", () => {
    render(
      <RadioGroup label="Radio  Group Label" value="value-1">
        <Radio value="value-1">Value 1</Radio>
        <Radio value="value-2">Value 2</Radio>
      </RadioGroup>,
    );

    const options = screen.getAllByRole("radio");
    expect(options[0]).toBeChecked();
    expect(options[1]).not.toBeChecked();
  });

  it("should be able to fire onChange event", () => {
    const onChangeSpy = jest.fn();

    render(
      <RadioGroup label="Radio  Group Label" onChange={onChangeSpy}>
        <Radio value="value-1">Value 1</Radio>
        <Radio value="value-2">Value 2</Radio>
      </RadioGroup>,
    );

    const options = screen.getAllByRole("radio");
    userEvent.click(options[0]);
    expect(onChangeSpy).toHaveBeenCalled();
  });

  it("should be able to render disabled checkboxes", () => {
    render(
      <RadioGroup isDisabled label="Radio  Group Label">
        <Radio value="value-1">Value 1</Radio>
        <Radio value="value-2">Value 2</Radio>
      </RadioGroup>,
    );

    const options = screen.getAllByRole("radio");
    expect(options[0]).toBeDisabled();
    expect(options[1]).toBeDisabled();
  });
});
