import React from "react";
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { ThemeProvider } from "constants/DefaultTheme";
import Dropdown from "./Dropdown";
import { lightTheme } from "selectors/themeSelectors";
import userEvent from "@testing-library/user-event";

const props = {
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

const getTestComponent = (
  handleOnSelect: any = undefined,
  allowDeselection?: boolean,
) => (
  <ThemeProvider theme={lightTheme}>
    <Dropdown
      allowDeselection={allowDeselection}
      containerClassName="dropdown-container"
      onSelect={handleOnSelect}
      options={props.options}
      selected={props.selected}
      showLabelOnly={props.showLabelOnly}
    />
    ,
  </ThemeProvider>
);

describe("<Dropdown /> - Keyboard Navigation", () => {
  it("Pressing tab should focus the component", () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByRole("listbox")).toHaveFocus();
  });

  // Tests various ways to open dropdown
  it.each(["{Enter}", " ", "{ArrowDown}", "{ArrowUp}"])(
    "Once focused, pressing '%s' should open dropdown",
    async (key) => {
      render(getTestComponent());
      expect(screen.queryByRole("option")).toBeNull();
      userEvent.tab();

      userEvent.keyboard(key);
      expect(screen.queryAllByRole("option")).toHaveLength(3);

      // Escape to close opened dropdown
      userEvent.keyboard("{Escape}");
      await waitForElementToBeRemoved(screen.getAllByRole("option"));
    },
  );

  it("Pressing tab once dropdown is opened should close dropdown", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    userEvent.tab();
    await waitForElementToBeRemoved(screen.getAllByRole("option"));
  });

  it("{ArrowDown} should select next item", () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");
    userEvent.keyboard("{Enter}");

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
    ].forEach((text) => {
      userEvent.keyboard("{ArrowDown}");
      expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
        text,
      );
      expect(screen.getByRole("listbox")).toHaveTextContent(text);
    });
  });

  it("{ArrowUp} should select previous item", () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");
    userEvent.keyboard("{Enter}");

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
    ].forEach((text) => {
      userEvent.keyboard("{ArrowUp}");
      expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
        text,
      );
      expect(screen.getByRole("listbox")).toHaveTextContent(text);
    });
  });

  it("After selecting an option using arrow, {enter} or ' ' should trigger optionClick", () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect));
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      props.options[1].value,
      props.options[1],
    );
    userEvent.keyboard("{Enter}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      props.options[2].value,
      props.options[2],
    );
  });

  it("After selecting an option using arrow, {Escape} should not trigger optionClick", () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");
    userEvent.keyboard("{Enter}");
    userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toHaveTextContent("Secondary");
    userEvent.keyboard("{Escape}");
    expect(screen.getByRole("listbox")).toHaveTextContent("Primary");
    expect(handleOnSelect).not.toHaveBeenCalled();
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
      props.options[1].label,
    );
    expect(screen.getByRole("listbox")).toHaveTextContent(
      props.options[1].label,
    );

    // click on Second Item Again
    fireEvent.click(screen.queryAllByRole("option")[1]);
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      props.options[1].label,
    );
    expect(screen.getByRole("listbox")).toHaveTextContent(
      props.options[1].label,
    );
    expect(screen.getByRole("option", { selected: true })).not.toBeNull();
  });

  it("Test allowDeselection = true behaviour", async () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect, true));
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
      props.options[2].label,
    );
    expect(screen.getByRole("listbox")).toHaveTextContent(
      props.options[2].label,
    );

    // click on Third Item Again, that should unselect everything
    fireEvent.click(screen.queryAllByRole("option")[2]);
    expect(screen.queryByRole("option", { selected: true })).toBeNull();
  });
});
