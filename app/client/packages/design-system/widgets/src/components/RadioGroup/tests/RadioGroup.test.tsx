import React from "react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { Radio, RadioGroup } from "@appsmith/wds";

describe("@appsmith/wds/RadioGroup", () => {
  const items = [
    { label: "Value 1", value: "value-1" },
    { label: "Value 2", value: "value-2" },
  ];

  it("should render the Radio group", async () => {
    const { container } = render(
      <RadioGroup label="Radio Group">
        {items.map(({ label, value }) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>,
    );

    expect(screen.getByText("Value 1")).toBeInTheDocument();
    expect(screen.getByText("Value 2")).toBeInTheDocument();

    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
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

    await userEvent.click(options[0]);
    expect(options[0]).toBeChecked();

    await userEvent.click(options[1]);
    expect(options[0]).not.toBeChecked();
    expect(options[1]).toBeChecked();
  });

  it("should support custom props", () => {
    render(
      <RadioGroup data-testid="t--radio-group" label="Radio Group Label">
        {items.map(({ label, value }) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>,
    );

    const radioGroup = screen.getByTestId("t--radio-group");

    expect(radioGroup).toBeInTheDocument();
  });

  it("should render checked checkboxes when value is passed", () => {
    render(
      <RadioGroup label="Radio  Group Label" value="value-1">
        {items.map(({ label, value }) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>,
    );

    const options = screen.getAllByRole("radio");

    expect(options[0]).toBeChecked();
    expect(options[1]).not.toBeChecked();
  });

  it("should be able to fire onChange event", async () => {
    const onChangeSpy = jest.fn();

    render(
      <RadioGroup label="Radio  Group Label" onChange={onChangeSpy}>
        {items.map(({ label, value }) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>,
    );

    const options = screen.getAllByRole("radio");

    await userEvent.click(options[0]);
    expect(onChangeSpy).toHaveBeenCalled();
  });

  it("should be able to render disabled checkboxes", () => {
    render(
      <RadioGroup isDisabled label="Radio  Group Label">
        {items.map(({ label, value }) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>,
    );

    const options = screen.getAllByRole("radio");

    expect(options[0]).toBeDisabled();
    expect(options[1]).toBeDisabled();
  });
});
