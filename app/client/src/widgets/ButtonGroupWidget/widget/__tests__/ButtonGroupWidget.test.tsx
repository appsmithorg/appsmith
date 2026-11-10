import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import ButtonGroupWidget from "../index";
import { RenderModes } from "constants/WidgetConstants";
import type { ButtonGroupWidgetProps } from "../index";
import { klona } from "klona";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";

const renderWidget = (props: ButtonGroupWidgetProps) =>
  render(
    <ThemeProvider theme={lightTheme}>
      <ButtonGroupWidget {...props} />
    </ThemeProvider>,
  );

const defaultProps: ButtonGroupWidgetProps = {
  widgetId: "test-button-group",
  renderMode: RenderModes.CANVAS,
  version: 1,
  parentColumnSpace: 1,
  parentRowSpace: 1,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
  orientation: "horizontal",
  isDisabled: false,
  buttonVariant: "PRIMARY",
  type: "BUTTON_GROUP_WIDGET",
  widgetName: "ButtonGroup1",
  groupButtons: {
    groupButton1: {
      label: "Test Button 1",
      id: "groupButton1",
      widgetId: "",
      buttonType: "SIMPLE",
      placement: "CENTER",
      isVisible: true,
      isDisabled: false,
      disabledWhenInvalid: true,
      index: 0,
      menuItems: {},
    },
    groupButton2: {
      label: "Test Button 2",
      id: "groupButton2",
      widgetId: "",
      buttonType: "SIMPLE",
      placement: "CENTER",
      isVisible: true,
      isDisabled: false,
      disabledWhenInvalid: true,
      index: 1,
      menuItems: {},
    },
  },
};

const getTooltipContent = () =>
  document.querySelector(".btnGroupTooltipContainer .bp3-popover2-content")
    ?.textContent;

const menuButtonProps = (): ButtonGroupWidgetProps["groupButtons"] => ({
  groupButton1: {
    label: "More",
    id: "groupButton1",
    widgetId: "",
    buttonType: "MENU",
    placement: "CENTER",
    isVisible: true,
    isDisabled: false,
    disabledWhenInvalid: false,
    index: 0,
    tooltip: "Open more actions",
    menuItems: {
      menuItem1: {
        label: "First Option",
        id: "menuItem1",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 0,
      },
    },
  },
});

describe("ButtonGroupWidget disabledWhenInvalid", () => {
  it("disables buttons when disabledWhenInvalid is true and form is invalid", () => {
    const props = klona(defaultProps);

    props.isFormValid = false;

    const { container } = renderWidget(props);
    const buttons = container.querySelectorAll("button");

    buttons.forEach((button) => {
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });

  it("enables buttons when disabledWhenInvalid is true but form is valid", () => {
    const props = klona(defaultProps);

    props.isFormValid = true;

    const { container } = renderWidget(props);
    const buttons = container.querySelectorAll("button");

    buttons.forEach((button) => {
      expect(button.hasAttribute("disabled")).toBe(false);
    });
  });

  it("enables buttons when disabledWhenInvalid is false regardless of form validity", () => {
    const props = klona(defaultProps);

    props.groupButtons = {
      ...defaultProps.groupButtons,
      groupButton1: {
        ...defaultProps.groupButtons.groupButton1,
        disabledWhenInvalid: false,
      },
      groupButton2: {
        ...defaultProps.groupButtons.groupButton2,
        disabledWhenInvalid: false,
      },
    };

    const { container } = renderWidget(props);
    const buttons = container.querySelectorAll("button");

    buttons.forEach((button) => {
      expect(button.hasAttribute("disabled")).toBe(false);
    });
  });
});

describe("ButtonGroupWidget tooltip", () => {
  it("exposes tooltip in the per-button General property pane config", () => {
    const contentConfig = ButtonGroupWidget.getPropertyPaneContentConfig();
    const buttonsSection = contentConfig.find(
      (section) => section.sectionName === "Data",
    );
    const groupButtonsProperty = buttonsSection?.children?.find(
      (child) => child.propertyName === "groupButtons",
    );

    expect(groupButtonsProperty).toBeDefined();
    expect(groupButtonsProperty).toHaveProperty("panelConfig");

    // Narrow the property-pane union: only GROUP_BUTTONS carries panelConfig.
    const panelConfig = (
      groupButtonsProperty as {
        panelConfig: {
          contentChildren: Array<{
            sectionName: string;
            children?: Array<{ propertyName: string }>;
          }>;
        };
      }
    ).panelConfig;

    const generalSection = panelConfig.contentChildren.find(
      (section) => section.sectionName === "General",
    );
    const tooltipProperty = generalSection?.children?.find(
      (child) => child.propertyName === "tooltip",
    );

    expect(tooltipProperty).toMatchObject({
      label: "Tooltip",
      controlType: "INPUT_TEXT",
      isBindProperty: true,
      isTriggerProperty: false,
    });
  });

  it("shows tooltip content on hover for a simple button", async () => {
    const props = klona(defaultProps);

    props.groupButtons.groupButton1.tooltip = "Favorite this item";
    props.groupButtons.groupButton1.disabledWhenInvalid = false;
    props.groupButtons.groupButton2.disabledWhenInvalid = false;

    const { container } = renderWidget(props);
    const button = container.querySelector("button");

    expect(button).not.toBeNull();
    fireEvent.mouseEnter(button as HTMLButtonElement);

    // hoverOpenDelay={200} — must not open synchronously via wrapper mouseEnter.
    expect(getTooltipContent()).toBeUndefined();

    await waitFor(() => {
      expect(getTooltipContent()).toBe("Favorite this item");
    });
  });

  it("does not show a tooltip on hover when tooltip is empty", async () => {
    const props = klona(defaultProps);

    props.groupButtons.groupButton1.tooltip = "";
    props.groupButtons.groupButton1.disabledWhenInvalid = false;
    props.groupButtons.groupButton2.disabledWhenInvalid = false;

    const { container } = renderWidget(props);
    const group = container.querySelector(".t--buttongroup-widget");
    const button = container.querySelector("button");

    expect(button).not.toBeNull();
    // Without a tooltip, wrapWithTooltip must not add a Popover2 target wrapper.
    expect(group?.querySelectorAll(".bp3-popover2-target")).toHaveLength(0);

    fireEvent.mouseEnter(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBeUndefined();
    });
    expect(document.querySelector(".btnGroupTooltipContainer")).toBeNull();
  });

  it("fills the group slot for a tooltipped simple button in published mode", () => {
    const props = klona(defaultProps);

    props.renderMode = RenderModes.PAGE;
    props.groupButtons.groupButton1.tooltip = "Favorite this item";
    props.groupButtons.groupButton1.disabledWhenInvalid = false;
    props.groupButtons.groupButton2.disabledWhenInvalid = false;

    const { container } = renderWidget(props);
    const tooltipTarget = container.querySelector(
      ".t--buttongroup-widget .bp3-popover2-target",
    );
    const fillWrapper = tooltipTarget?.firstElementChild;

    expect(tooltipTarget).not.toBeNull();
    // showInAllModes keeps a DragContainer div under the target in PAGE mode.
    expect(fillWrapper?.tagName).toBe("DIV");
    expect(fillWrapper?.querySelector("button")).not.toBeNull();
  });

  it("shows tooltip content on hover for a menu trigger", async () => {
    const props = klona(defaultProps);

    props.groupButtons = menuButtonProps();

    const { container } = renderWidget(props);
    const button = container.querySelector("button");

    expect(button).not.toBeNull();
    fireEvent.mouseEnter(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBe("Open more actions");
    });
  });

  it("hides the menu trigger tooltip while the menu is open and does not restore it on toggle-close", async () => {
    const props = klona(defaultProps);

    props.groupButtons = menuButtonProps();

    const { container } = renderWidget(props);
    const button = container.querySelector("button");

    expect(button).not.toBeNull();
    fireEvent.mouseEnter(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBe("Open more actions");
    });

    fireEvent.click(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBeUndefined();
    });

    // Toggle closed while still "hovering" — require a fresh hover, no flash.
    fireEvent.click(button as HTMLButtonElement);

    await waitFor(() => {
      expect(
        document.querySelector(".button-group-test-button-group"),
      ).toBeNull();
    });

    await waitFor(() => {
      expect(getTooltipContent()).toBeUndefined();
    });
  });

  it("does not show the menu tooltip after selecting a menu item", async () => {
    const props = klona(defaultProps);

    props.groupButtons = menuButtonProps();

    const { container } = renderWidget(props);
    const button = container.querySelector("button");

    expect(button).not.toBeNull();
    fireEvent.mouseEnter(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBe("Open more actions");
    });

    fireEvent.click(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBeUndefined();
    });

    const menuItem = document.querySelector(".bp3-menu-item");

    expect(menuItem).not.toBeNull();
    fireEvent.click(menuItem as HTMLElement);

    await waitFor(() => {
      expect(
        document.querySelector(".button-group-test-button-group"),
      ).toBeNull();
    });

    await waitFor(() => {
      expect(getTooltipContent()).toBeUndefined();
    });
  });

  it("shows the menu tooltip again only after a fresh hover following menu close", async () => {
    const props = klona(defaultProps);

    props.groupButtons = menuButtonProps();

    const { container } = renderWidget(props);
    const button = container.querySelector("button");

    expect(button).not.toBeNull();
    fireEvent.mouseEnter(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBe("Open more actions");
    });

    fireEvent.click(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBeUndefined();
    });

    fireEvent.click(button as HTMLButtonElement);

    await waitFor(() => {
      expect(
        document.querySelector(".button-group-test-button-group"),
      ).toBeNull();
    });

    expect(getTooltipContent()).toBeUndefined();

    const tooltipWrapper = button?.closest(
      ".t--buttongroup-widget",
    )?.firstElementChild;

    expect(tooltipWrapper).not.toBeNull();
    fireEvent.mouseLeave(tooltipWrapper as Element);
    fireEvent.mouseEnter(tooltipWrapper as Element);
    fireEvent.mouseEnter(button as HTMLButtonElement);

    await waitFor(() => {
      expect(getTooltipContent()).toBe("Open more actions");
    });
  });

  it("keeps the open menu owner when switching between two menu buttons", async () => {
    const props = klona(defaultProps);

    props.groupButtons = {
      ...menuButtonProps(),
      groupButton2: {
        label: "Options",
        id: "groupButton2",
        widgetId: "",
        buttonType: "MENU",
        placement: "CENTER",
        isVisible: true,
        isDisabled: false,
        disabledWhenInvalid: false,
        index: 1,
        tooltip: "Open options",
        menuItems: {
          menuItem1: {
            label: "Second Option",
            id: "menuItem1",
            widgetId: "",
            isVisible: true,
            isDisabled: false,
            index: 0,
          },
        },
      },
    };

    const { container } = renderWidget(props);
    const buttons = container.querySelectorAll("button");

    expect(buttons).toHaveLength(2);

    fireEvent.mouseEnter(buttons[0]);
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(document.querySelector(".bp3-menu-item")).not.toBeNull();
    });

    fireEvent.mouseEnter(buttons[1]);
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(document.body.textContent).toContain("Second Option");
    });

    // Options menu is open; its tooltip must stay hidden even after More's
    // onClosing runs in the same interaction.
    await waitFor(() => {
      expect(getTooltipContent()).toBeUndefined();
    });
  });
});
