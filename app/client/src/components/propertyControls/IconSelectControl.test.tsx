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

const requiredParams = {
  evaluatedValue: undefined,
  deleteProperties: noop,
  widgetProperties: undefined,
  parentPropertyName: "",
  parentPropertyValue: undefined,
  additionalDynamicData: {},
  label: "",
  openNextPanel: noop,
  onPropertyChange: noop,
  theme: EditorTheme.LIGHT,
  propertyName: "iconName",
  controlType: "",
  isBindProperty: false,
  isTriggerProperty: false,
};

const waitForParamsForSearchFocus = {
  timeout: 3000,
};

describe("<IconSelectControl /> - Keyboard navigation", () => {
  const getTestComponent = (
    onPropertyChange: (
      propertyName: string,
      propertyValue: string,
      isUpdatedViaKeyboard?: boolean,
    ) => void = noop,
  ) => (
    <IconSelectControl
      {...requiredParams}
      onPropertyChange={onPropertyChange}
    />
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
      }, waitForParamsForSearchFocus);
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
    }, waitForParamsForSearchFocus);
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
    }, waitForParamsForSearchFocus);
    userEvent.keyboard("{ArrowDown}");
    expect(screen.queryByRole("textbox")).not.toHaveFocus();
    userEvent.keyboard("{Shift}{ArrowUp}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    }, waitForParamsForSearchFocus);
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
    }, waitForParamsForSearchFocus);
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowDown}");
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
  });

  it("Pressing '{ArrowUp}' should navigate the icon selection upwards", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    }, waitForParamsForSearchFocus);
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowDown}");
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();

    userEvent.keyboard("{ArrowUp}");
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
  });

  it("Pressing '{ArrowRight}' should navigate the icon selection towards right", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    }, waitForParamsForSearchFocus);
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowRight}");
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
  });

  it("Pressing '{ArrowLeft}' should navigate the icon selection towards left", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    }, waitForParamsForSearchFocus);
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();

    userEvent.keyboard("{ArrowLeft}");
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
  });

  it("Pressing '{Enter}' or ' ' should select the icon", async () => {
    const handleOnSelect = jest.fn();
    render(getTestComponent(handleOnSelect));
    userEvent.tab();
    expect(screen.queryByRole("button")?.textContent).toEqual(
      "(none)caret-down",
    );
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    }, waitForParamsForSearchFocus);
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
    // used to shift the focus from search
    userEvent.keyboard("{ArrowDown}");

    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowRight}");
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
    userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenCalledTimes(1);
    expect(handleOnSelect.mock.calls[0]).toMatchSnapshot();
    await waitForElementToBeRemoved(screen.getByRole("list"));

    userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("list")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    }, waitForParamsForSearchFocus);
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard(" ");
    expect(handleOnSelect).toHaveBeenCalledTimes(2);
    expect(handleOnSelect.mock.calls[1]).toMatchSnapshot();
  });
});

const config = { ...requiredParams };
describe("IconSelectControl.canDisplayValue", () => {
  it("Should return true when a proper icon name is passed", () => {
    expect(IconSelectControl.canDisplayValueInUI(config, "add")).toEqual(true);
    expect(IconSelectControl.canDisplayValueInUI(config, "airplane")).toEqual(
      true,
    );
  });

  it("Should return false when a non-alowed icon value is passed", () => {
    expect(IconSelectControl.canDisplayValueInUI(config, "macbook")).toEqual(
      false,
    );
  });
});

describe("<IconSelectControl /> - (none) icon", () => {
  const getTestComponent = (hideNoneIcon?: boolean) => (
    <IconSelectControl {...requiredParams} hideNoneIcon={hideNoneIcon} />
  );

  it("Should display (none) icon when hideNoneIcon property is false/undefined", async () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.queryByRole("button")?.textContent).toEqual(
      "(none)caret-down",
    );
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    }, waitForParamsForSearchFocus);
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();

    // Check if the (none) icon is in the list
    expect(screen.getByText("(none)", { selector: "div" })).toBeInTheDocument();
  });

  it("Should not display (none) icon when hideNoneIcon property is true", async () => {
    render(getTestComponent(true));
    userEvent.tab();
    expect(screen.queryByRole("button")?.textContent).toEqual(
      "(none)caret-down",
    );
    userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).toHaveFocus();
    }, waitForParamsForSearchFocus);
    expect(
      document.querySelector("a.bp3-active")?.children[0].classList,
    ).toMatchSnapshot();

    // Check if the (none) icon is in the list
    expect(screen.queryByText("(none)", { selector: "div" })).toBeNull();
  });
});
