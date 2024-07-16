import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ButtonGroup from "./index";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";

const options = [
  {
    icon: "BOLD_FONT",
    value: "BOLD",
  },
  {
    icon: "ITALICS_FONT",
    value: "ITALICS",
  },
  {
    icon: "UNDERLINE",
    value: "UNDERLINE",
  },
];

describe("<ButtonGroup />", () => {
  const getTestComponent = (
    handleOnSelect: any = undefined,
    values: Array<string> = [],
  ) => (
    <ButtonGroup
      options={options}
      selectButton={handleOnSelect}
      values={values}
    />
  );

  it("passed value should be selected", () => {
    const firstItem = options[0];
    render(getTestComponent(noop, [firstItem.value]));

    expect(screen.getByRole("tab", { selected: true })).toHaveClass(
      `t--button-group-${firstItem.value}`,
    );
  });
});

describe("<ButtonGroup /> - Keyboard Navigation", () => {
  const getTestComponent = (handleOnSelect: any = undefined) => (
    <ButtonGroup options={options} selectButton={handleOnSelect} values={[]} />
  );

  it("Pressing tab should focus the component", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.getByRole("tablist")).toHaveFocus();

    // Should focus first Item
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 0) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });
  });

  it("{ArrowRight} should focus the next item", async () => {
    render(getTestComponent());
    await userEvent.tab();

    await userEvent.keyboard("{ArrowRight}");
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 1) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });

    // ArrowRight after the last item should focus the first item again
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowRight}");
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 0) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });
  });

  it("{ArrowLeft} should focus the previous item", async () => {
    render(getTestComponent());
    await userEvent.tab();

    await userEvent.keyboard("{ArrowLeft}");
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 2) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });

    await userEvent.keyboard("{ArrowLeft}");
    screen.getAllByRole("tab").forEach((tab, i) => {
      if (i === 1) expect(tab).toHaveClass("focused");
      else expect(tab).not.toHaveClass("focused");
    });
  });

  it("{Enter} or ' ' should trigger click event for the focused item", async () => {
    const handleClick = jest.fn();
    render(getTestComponent(handleClick));
    await userEvent.tab();

    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenLastCalledWith(options[1].value, true);

    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(2);
    expect(handleClick).toHaveBeenLastCalledWith(options[2].value, true);
  });
});
