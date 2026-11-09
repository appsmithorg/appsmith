import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import ButtonGroupWidget from "../index";
import { RenderModes } from "constants/WidgetConstants";
import type { ButtonGroupWidgetProps } from "../index";
import { klona } from "klona";

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

describe("ButtonGroupWidget disabledWhenInvalid", () => {
  it("disables buttons when disabledWhenInvalid is true and form is invalid", () => {
    const props = klona(defaultProps);

    props.isFormValid = false;

    const { container } = render(<ButtonGroupWidget {...props} />);
    const buttons = container.querySelectorAll("button");

    buttons.forEach((button) => {
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });

  it("enables buttons when disabledWhenInvalid is true but form is valid", () => {
    const props = klona(defaultProps);

    props.isFormValid = true;

    const { container } = render(<ButtonGroupWidget {...props} />);
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

    const { container } = render(<ButtonGroupWidget {...props} />);
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
    const generalSection =
      groupButtonsProperty?.panelConfig?.contentChildren?.find(
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

    const { container } = render(<ButtonGroupWidget {...props} />);
    const button = container.querySelector("button");

    expect(button).not.toBeNull();
    fireEvent.mouseEnter(button as HTMLButtonElement);

    await waitFor(() => {
      expect(
        document.querySelector(
          ".btnGroupTooltipContainer .bp3-popover2-content",
        )?.textContent,
      ).toBe("Favorite this item");
    });
  });

  it("does not show a tooltip on hover when tooltip is empty", async () => {
    const props = klona(defaultProps);

    props.groupButtons.groupButton1.disabledWhenInvalid = false;
    props.groupButtons.groupButton2.disabledWhenInvalid = false;

    const { container } = render(<ButtonGroupWidget {...props} />);
    const button = container.querySelector("button");

    expect(button).not.toBeNull();
    fireEvent.mouseEnter(button as HTMLButtonElement);

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(document.querySelector(".btnGroupTooltipContainer")).toBeNull();
  });
});
