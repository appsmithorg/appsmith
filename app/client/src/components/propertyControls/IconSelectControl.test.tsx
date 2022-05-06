import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import IconSelectControl from "./IconSelectControl";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

describe("<IconSelectControl /> - Keyboard navigation", () => {
  const getTestComponent = (
    onPropertyChange: (
      propertyName: string,
      propertyValue: string,
    ) => void = noop,
  ) => (
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
      onPropertyChange={onPropertyChange}
      openNextPanel={noop}
      parentPropertyName="iconName"
      parentPropertyValue="add"
      propertyName="iconName"
      theme={EditorTheme.LIGHT}
      widgetProperties={undefined}
    />
  );

  it("Pressing tab should focus the component", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
  });

  it.each(["{Enter}", " ", "{ArrowDown}", "{ArrowUp}"])(
    "Pressing '%s' should open the icon selector",
    async (key) => {
      render(getTestComponent());
      await userEvent.tab();
      expect(screen.queryByRole("list")).toBeNull();
      await userEvent.keyboard(key);
      expect(screen.queryByRole("list")).toBeInTheDocument();

      // Makes sure search bar is having focus
      await waitFor(() => {
        expect(screen.queryByRole("textbox")).toHaveFocus();
      });
    },
  );

  it("Pressing '{Escape}' should close the icon selector", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.queryByRole("list")).toBeNull();
    await userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("list")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitForElementToBeRemoved(screen.getAllByRole("list"));
  });

  it("Pressing '{ArrowDown}' while search is in focus should remove the focus", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("list")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.queryByRole("textbox")).not.toHaveFocus();
  });

  it("Pressing '{Shift} + {ArrowUp}' while search is not in focus should focus search box", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("list")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.queryByRole("textbox")).not.toHaveFocus();
    await userEvent.keyboard("{Shift}{ArrowUp}");
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
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    await userEvent.keyboard("{ArrowDown}");

    await userEvent.keyboard("{ArrowDown}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add-row-bottom",
    );
  });

  it("Pressing '{ArrowUp}' should navigate the icon selection upwards", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    await userEvent.keyboard("{ArrowDown}");

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-align-right",
    );

    await userEvent.keyboard("{ArrowUp}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-airplane",
    );
  });

  it("Pressing '{ArrowRight}' should navigate the icon selection towards right", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    await userEvent.keyboard("{ArrowDown}");

    await userEvent.keyboard("{ArrowRight}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add",
    );
  });

  it("Pressing '{ArrowLeft}' should navigate the icon selection towards left", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    await userEvent.keyboard("{ArrowDown}");

    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add-column-right",
    );

    await userEvent.keyboard("{ArrowLeft}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add-column-left",
    );
  });

  it("Pressing '{Enter}' or ' ' should select the icon", async () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect));
    await userEvent.tab();
    expect(screen.queryByRole("button")?.textContent).toEqual(
      "(none)caret-down",
    );
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-(none)",
    );
    // used to shift the focus from search
    await userEvent.keyboard("{ArrowDown}");

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add-row-top",
    );
    await userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenCalledTimes(1);
    expect(handleOnSelect).toHaveBeenLastCalledWith("iconName", "add-row-top");
    await waitForElementToBeRemoved(screen.getByRole("list"));

    await userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("list")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    });
    expect(document.querySelector("a.bp3-active")?.children[0]).toHaveClass(
      "bp3-icon-add-row-top",
    );
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenCalledTimes(2);
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      "iconName",
      "add-to-artifact",
    );
  });
});
