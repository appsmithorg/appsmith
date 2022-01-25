import React from "react";
import "@testing-library/jest-dom";
import {
  prettyDOM,
  queryAllByRole,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { ThemeProvider } from "constants/DefaultTheme";
import Dropdown from "./Dropdown";
import IconSelectControl from "./IconSelectControl";
import { lightTheme } from "selectors/themeSelectors";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

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

describe("<IconSelectControl /> - Keyboard navigation", () => {
  const getTestComponent = (handleOnSelect: any = undefined) => (
    // <ThemeProvider theme={lightTheme}>
    <IconSelectControl
      additionalDynamicData={{
        dummy: {
          dummy: 1,
        },
      }}
      controlType="add"
      deleteProperties={noop}
      evaluatedValue={undefined}
      isBindProperty={false}
      isTriggerProperty={false}
      label="Icon"
      openNextPanel={noop}
      parentPropertyName="iconName"
      parentPropertyValue="add"
      propertyName="iconName"
      theme={EditorTheme.LIGHT}
      widgetProperties={undefined}
    />
    // </ThemeProvider>
  );

  it("Pressing tab should focus the component", () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
  });

  it.each(["{Enter}", " ", "{ArrowDown}", "{ArrowUp}"])(
    "Pressing '%s' should open the icon selector",
    async (key) => {
      render(getTestComponent());
      userEvent.tab();
      expect(screen.queryByRole("list")).toBeNull();
      userEvent.keyboard(key);
      expect(screen.queryByRole("list")).toBeInTheDocument();

      // Makes sure search bar is having focus
      await waitFor(() => {
        expect(screen.queryByRole("textbox")).toHaveFocus();
      });
    },
  );

  it("Pressing '{Escape}' should close the icon selector", async () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.queryByRole("list")).toBeNull();
    userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("list")).toBeInTheDocument();
    userEvent.keyboard("{Escape}");
    await waitForElementToBeRemoved(screen.getAllByRole("list"));
  });

  it("Pressing '{ArrowDown}' while search is in focus should remove the focus", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("list")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    userEvent.keyboard("{ArrowDown}");
    expect(screen.queryByRole("textbox")).not.toHaveFocus();
  });

  it("Pressing '{Shift} + {ArrowUp}' while search is not in focus should focus search box", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("list")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    userEvent.keyboard("{ArrowDown}");
    expect(screen.queryByRole("textbox")).not.toHaveFocus();
    userEvent.keyboard("{Shift}{ArrowUp}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
  });

  /*
    Icon Arrangement

    (none)          add           add-column-left  add-column-right
    add-row-bottom  add-row-top   add-to-artifact  add-to-folder
    airplane        align-center  align-justify    align-left
  */
  it("Pressing '{ArrowDown}' should navigate the icon selection downwards", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowDown}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add-row-bottom",
    );
  });

  it("Pressing '{ArrowUp}' should navigate the icon selection upwards", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowDown}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-align-right",
    );

    userEvent.keyboard("{ArrowUp}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-airplane",
    );
  });

  it("Pressing '{ArrowRight}' should navigate the icon selection towards right", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowRight}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add",
    );
  });

  it("Pressing '{ArrowLeft}' should navigate the icon selection towards left", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add-column-right",
    );

    userEvent.keyboard("{ArrowLeft}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add-column-left",
    );
  });
});
