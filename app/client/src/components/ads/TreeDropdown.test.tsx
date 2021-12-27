import React from "react";
import {
  getByRole,
  logRoles,
  prettyDOM,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ThemeProvider } from "constants/DefaultTheme";
import { lightTheme } from "selectors/themeSelectors";
import TreeDropdown, {
  TreeDropdownOption,
  TreeDropdownProps,
} from "./TreeDropdown";

const optionTree: TreeDropdownOption[] = [
  {
    label: "No Action",
    value: "none",
  },
  {
    label: "Navigate To",
    value: "navigateTo",
  },
  {
    label: "Execute a query",
    value: "integration",
    children: [
      {
        label: "Query 1",
        value: "query1",
      },
      {
        label: "Query 2",
        value: "query2",
      },
    ],
  },
  {
    label: "Open Modal",
    value: "openModal",
  },
];

const testComponent = (fn: any = undefined) => (
  <ThemeProvider theme={lightTheme}>
    <TreeDropdown
      defaultText="Select Action"
      onSelect={fn}
      // onSelect={(val: TreeDropdownOption, defaultVal) => {}}
      optionTree={optionTree}
      selectedValue="none"
    />
  </ThemeProvider>
);

describe("<TreeDropdown/>", () => {
  it("Pressing Tab should focus the component", () => {
    render(testComponent());
    userEvent.tab();
    expect(screen.getByRole("button", { name: "No Action" })).toHaveFocus();
  });

  it.each(["{Enter}", " ", "{ArrowDown}", "{ArrowUp}"])(
    "Once focused, pressing '%s' should open dropdown",
    async (key) => {
      render(testComponent());
      expect(screen.queryByRole("list")).toBeNull();
      userEvent.tab();

      userEvent.keyboard(key);
      expect(screen.queryAllByRole("list")).not.toBeNull();

      // Escape to close opened dropdown
      userEvent.keyboard("{Escape}");
      await waitForElementToBeRemoved(screen.getAllByRole("list"));
    },
  );

  it("Pressing tab once dropdown is opened should close dropdown", async () => {
    render(testComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    expect(screen.getAllByRole("list")).not.toBeNull();
    userEvent.tab();
    await waitForElementToBeRemoved(screen.getAllByRole("list"));
  });

  it("{ArrowDown} should select next item", () => {
    render(testComponent());
    userEvent.tab();
    expect(screen.getByRole("button")).toHaveTextContent("No Action");
    userEvent.keyboard("{Enter}");

    // Make sure first item is selected by default and not any other items
    expect(screen.getAllByRole("listitem")[0].querySelector("a")).toHaveClass(
      "bp3-active",
    );
    for (const [i, item] of screen.getAllByRole("listitem").entries()) {
      if (i !== 0) expect(item).not.toHaveClass("bp3-active");
    }

    userEvent.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("listitem")[1].querySelector("a")).toHaveClass(
      "bp3-active",
    );
    for (const [i, item] of screen.getAllByRole("listitem").entries()) {
      if (i !== 1)
        expect(item.querySelector("a")).not.toHaveClass("bp3-active");
    }
  });

  it("{ArrowUp} should select next item", () => {
    render(testComponent());
    userEvent.tab();
    expect(screen.getByRole("button")).toHaveTextContent("No Action");
    userEvent.keyboard("{Enter}");

    // Make sure first item is selected by default and not any other items
    expect(screen.getAllByRole("listitem")[0].querySelector("a")).toHaveClass(
      "bp3-active",
    );
    for (const [i, item] of screen.getAllByRole("listitem").entries()) {
      if (i !== 0) expect(item).not.toHaveClass("bp3-active");
    }

    userEvent.keyboard("{ArrowUp}");
    expect(
      screen.getAllByRole("listitem")[optionTree.length - 1].querySelector("a"),
    ).toHaveClass("bp3-active");
    for (const [i, item] of screen.getAllByRole("listitem").entries()) {
      if (i !== optionTree.length - 1)
        expect(item.querySelector("a")).not.toHaveClass("bp3-active");
    }
  });

  it.skip("After selecting an option using arrow, {enter} or ' ' should trigger onSelect", () => {
    const handleOnSelect = jest.fn();
    render(testComponent(handleOnSelect));
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      { label: optionTree[1].label, value: optionTree[1].value },
      undefined,
    );

    userEvent.keyboard("{Enter}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      { label: optionTree[2].label, value: optionTree[2].value },
      undefined,
    );
  });
});
