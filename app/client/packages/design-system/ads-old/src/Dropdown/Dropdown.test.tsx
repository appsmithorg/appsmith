import React from "react";
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import Dropdown from "./index";
import userEvent from "@testing-library/user-event";

const optionsProps: any = {
  options: [
    { label: "Primary", value: "PRIMARY" },
    { label: "Secondary", value: "SECONDARY" },
    { label: "Tertiary", value: "TERTIARY" },
  ],
  selected: {
    label: "Primary",
    value: "PRIMARY",
  },
  showLabelOnly: true,
};

const noOptionsProps = {
  options: [],
};

const getTestComponent = (
  handleOnSelect: any = undefined,
  props = optionsProps,
  allowDeselection?: boolean,
  isMultiSelect?: boolean,
) => (
  <div style={{ height: "800px" }}>
    <Dropdown
      allowDeselection={allowDeselection}
      containerClassName="dropdown-container"
      isMultiSelect={isMultiSelect}
      onSelect={handleOnSelect}
      options={props.options}
      selected={isMultiSelect ? [props.selected] : props.selected}
      showLabelOnly={props.showLabelOnly}
    />
  </div>
);

describe("<Dropdown /> - Keyboard Navigation", () => {
  it("Pressing tab should focus the component", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.getByRole("listbox")).toHaveFocus();
  });

  // Tests various ways to open dropdown
  it.each(["{Enter}", " ", "{ArrowDown}", "{ArrowUp}"])(
    "Once focused, pressing '%s' should open dropdown",
    async (key) => {
      render(getTestComponent());
      expect(screen.queryByRole("option")).toBeNull();
      await userEvent.tab();

      await userEvent.keyboard(key);
      expect(screen.queryAllByRole("option")).toHaveLength(3);

      // Escape to close opened dropdown
      await userEvent.keyboard("{Escape}");
      await waitForElementToBeRemoved(screen.getAllByRole("option"));
    },
  );

  it("Pressing tab once dropdown is opened should close dropdown", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    await userEvent.tab();
    await waitForElementToBeRemoved(screen.getAllByRole("option"));
  });

  it("{ArrowDown} should select next item", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");
    await userEvent.keyboard("{Enter}");

    // Make sure first item is selected by default
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      "Primary",
    );
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");

    // Press ArrowDown and check results
    [
      "Secondary",
      "Tertiary",
      // ArrowDown on last item should select first item
      "Primary",
    ].forEach(async (text) => {
      await userEvent.keyboard("{ArrowDown}");
      expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
        text,
      );
      expect(screen.getByRole("listbox")).toHaveTextContent(text);
    });
  });

  it("{ArrowUp} should select previous item", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");
    await userEvent.keyboard("{Enter}");

    // Make sure first item is selected by default
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      "Primary",
    );

    // Press ArrowUp and check results
    [
      // ArrowUp on first item should select last item
      "Tertiary",
      "Secondary",
      "Primary",
    ].forEach(async (text) => {
      await userEvent.keyboard("{ArrowUp}");
      expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
        text,
      );
      expect(screen.getByRole("listbox")).toHaveTextContent(text);
    });
  });

  it("After selecting an option using arrow, {enter} or ' ' should trigger optionClick", async () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect));
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      optionsProps.options[1].value,
      optionsProps.options[1],
      true,
    );
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      optionsProps.options[2].value,
      optionsProps.options[2],
      true,
    );
  });

  it("After selecting an option using arrow, {Escape} should not trigger optionClick", async () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toHaveTextContent("Secondary");
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");
    expect(handleOnSelect).not.toHaveBeenCalled();
  });
});

describe("<Dropdown isMultiSelect /> - Keyboard Navigation", () => {
  it("After selecting an option using arrow, {Enter} or ' ' should trigger optionClick", async () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect, optionsProps, undefined, true));
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      optionsProps.options[0].value,
      optionsProps.options[0],
      true,
    );
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      optionsProps.options[1].value,
      optionsProps.options[1],
      true,
    );
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      optionsProps.options[0].value,
      optionsProps.options[0],
      true,
    );
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      optionsProps.options[2].value,
      optionsProps.options[2],
      true,
    );
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      optionsProps.options[1].value,
      optionsProps.options[1],
      true,
    );
  });
});

describe("<Dropdown /> - allowDeselection behaviour", () => {
  it("Test default allowDeselection behaviour", async () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect));
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");

    const dropdown = screen
      .getByRole("listbox")
      .querySelector(".bp3-popover-target");
    expect(dropdown).not.toBeNull();

    // open dropdown
    fireEvent.click(dropdown as Element);
    expect(screen.queryAllByRole("option")).toHaveLength(3);

    // click on Second Item
    fireEvent.click(screen.queryAllByRole("option")[1]);
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      optionsProps.options[1].label,
    );
    expect(screen.getByRole("listbox")).toHaveTextContent(
      optionsProps.options[1].label,
    );

    // click on Second Item Again
    fireEvent.click(screen.queryAllByRole("option")[1]);
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      optionsProps.options[1].label,
    );
    expect(screen.getByRole("listbox")).toHaveTextContent(
      optionsProps.options[1].label,
    );
    expect(screen.getByRole("option", { selected: true })).not.toBeNull();
  });

  it("Test allowDeselection = true behaviour", async () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect, optionsProps, true));
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");

    const dropdown = screen
      .getByRole("listbox")
      .querySelector(".bp3-popover-target");
    expect(dropdown).not.toBeNull();

    // open dropdown
    fireEvent.click(dropdown as Element);
    expect(screen.queryAllByRole("option")).toHaveLength(3);

    // click on Third Item
    fireEvent.click(screen.queryAllByRole("option")[2]);
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      optionsProps.options[2].label,
    );
    expect(screen.getByRole("listbox")).toHaveTextContent(
      optionsProps.options[2].label,
    );

    // click on Third Item Again, that should unselect everything
    fireEvent.click(screen.queryAllByRole("option")[2]);
    expect(screen.queryByRole("option", { selected: true })).toBeNull();
  });
});

describe("<Dropdown /> - when the options is an empty array", () => {
  it("Hide options renderer when option list is empty", () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect, noOptionsProps));

    const dropdown = screen
      .getByRole("listbox")
      .querySelector(".bp3-popover-target");
    expect(dropdown).not.toBeNull();

    // open dropdown
    fireEvent.click(dropdown as Element);
    expect(screen.queryByTestId("dropdown-options-wrapper")).toBeNull();
  });
});
