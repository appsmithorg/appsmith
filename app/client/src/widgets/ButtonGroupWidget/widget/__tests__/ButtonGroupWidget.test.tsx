import { render } from "@testing-library/react";
import React from "react";
import ButtonGroupWidget from "../index";
import { RenderModes } from "constants/WidgetConstants";
import type { ButtonGroupWidgetProps } from "../index";

describe("ButtonGroupWidget disabledWhenInvalid", () => {
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

  it("disables buttons when disabledWhenInvalid is true and form is invalid", () => {
    const props = {
      ...defaultProps,
      isFormValid: false,
    };

    const { container } = render(<ButtonGroupWidget {...props} />);
    const buttons = container.querySelectorAll("button");

    buttons.forEach((button) => {
      expect(button).toHaveAttribute("disabled");
    });
  });

  it("enables buttons when disabledWhenInvalid is true but form is valid", () => {
    const props = {
      ...defaultProps,
      isFormValid: true,
    };

    const { container } = render(<ButtonGroupWidget {...props} />);
    const buttons = container.querySelectorAll("button");

    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute("disabled");
    });
  });

  it("enables buttons when disabledWhenInvalid is false regardless of form validity", () => {
    const props = {
      ...defaultProps,
      isFormValid: false,
      groupButtons: {
        ...defaultProps.groupButtons,
        groupButton1: {
          ...defaultProps.groupButtons.groupButton1,
          disabledWhenInvalid: false,
        },
        groupButton2: {
          ...defaultProps.groupButtons.groupButton2,
          disabledWhenInvalid: false,
        },
      },
    };

    const { container } = render(<ButtonGroupWidget {...props} />);
    const buttons = container.querySelectorAll("button");

    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute("disabled");
    });
  });
});
