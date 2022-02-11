import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { ThemeProvider } from "constants/DefaultTheme";
import { lightTheme } from "selectors/themeSelectors";
import userEvent from "@testing-library/user-event";
import MultiSelectDropdown from "./MultiselectDropdown";

const props = {
  options: [
    { label: "Primary", value: "PRIMARY" },
    { label: "Secondary", value: "SECONDARY" },
    { label: "Tertiary", value: "TERTIARY" },
  ],
  selected: ["PRIMARY"],
  showLabelOnly: true,
};

describe("<MultiselectDropdown /> - Keyboard navigation", () => {
  const getTestComponent = (handleOnSelect: any = undefined) => (
    <ThemeProvider theme={lightTheme}>
      <MultiSelectDropdown
        onSelect={handleOnSelect}
        options={props.options}
        selected={props.selected}
        showLabelOnly={props.showLabelOnly}
      />
      ,
    </ThemeProvider>
  );

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
    userEvent.keyboard("{Enter}");

    // Make sure first item is selected by default
    expect(screen.getByRole("option", { name: "Primary" })).toHaveClass(
      "focus",
    );

    // Press ArrowDown and check results
    [
      "Secondary",
      "Tertiary",
      // ArrowDown on last item should select first item
      "Primary",
    ].forEach((text) => {
      userEvent.keyboard("{ArrowDown}");
      expect(screen.getByRole("option", { name: text })).toHaveClass("focus");
    });
  });

  it("{ArrowUp} should select previous item", () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");

    // Make sure first item is selected by default
    expect(screen.getByRole("option", { name: "Primary" })).toHaveClass(
      "focus",
    );

    // Press ArrowUp and check results
    [
      // ArrowUp on first item should select last item
      "Tertiary",
      "Secondary",
      "Primary",
    ].forEach((text) => {
      userEvent.keyboard("{ArrowUp}");
      expect(screen.getByRole("option", { name: text })).toHaveClass("focus");
    });
  });

  it("After selecting an option using arrow, {enter} or ' ' should trigger optionClick", () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect));
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith([
      props.options[0].value,
      props.options[1].value,
    ]);
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenLastCalledWith([
      props.options[0].value,
      props.options[2].value,
    ]);
  });
});
