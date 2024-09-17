import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { generateReactKey } from "utils/generators";
import orderBy from "lodash/orderBy";
import isString from "lodash/isString";
import isUndefined from "lodash/isUndefined";
import { Button, Flex } from "@appsmith/ads";
import { ButtonPlacementTypes } from "components/constants";
import { DraggableListControl } from "pages/Editor/PropertyPane/DraggableListControl";
import { DraggableListCard } from "components/propertyControls/DraggableListCard";
import {
  createMessage,
  BUTTON_WIDGET_DEFAULT_LABEL,
} from "ee/constants/messages";

interface State {
  focusedIndex: number | null;
}

interface MenuItem {
  id: string;
  label: string;
  isDisabled: boolean;
  isVisible: boolean;
  widgetId: string;
  itemType: "SEPARATOR" | "BUTTON";
}

class ButtonListControl extends BaseControl<
  ControlProps & { allowSeparators?: boolean; allowSpatialGrouping?: boolean },
  State
> {
  constructor(props: ControlProps) {
    super(props);

    this.state = {
      focusedIndex: null,
    };
  }

  componentDidUpdate(prevProps: ControlProps): void {
    //on adding a new column last column should get focused
    if (
      Object.keys(prevProps.propertyValue).length + 1 ===
      Object.keys(this.props.propertyValue).length
    ) {
      this.updateFocus(Object.keys(this.props.propertyValue).length - 1, true);
    }
  }

  getMenuItems = () => {
    const menuItems: MenuItem[] =
      isString(this.props.propertyValue) ||
      isUndefined(this.props.propertyValue)
        ? []
        : Object.values(this.props.propertyValue);

    return orderBy(menuItems, ["index"], ["asc"]);
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateItems = (items: Array<Record<string, any>>) => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const menuItems = items.reduce((obj: any, each: any, index: number) => {
      obj[each.id] = {
        ...each,
        index,
      };
      return obj;
    }, {});
    this.updateProperty(this.props.propertyName, menuItems);
  };

  onEdit = (index: number) => {
    const menuItems = this.getMenuItems();
    const targetMenuItem = menuItems[index];

    this.props.openNextPanel({
      index,
      ...targetMenuItem,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  render() {
    const hasSeparator = this.getMenuItems().some(
      (item: MenuItem) => item.itemType === "SEPARATOR",
    );

    return (
      <div className="flex flex-col gap-1">
        <DraggableListControl
          deleteOption={this.deleteOption}
          fixedHeight={370}
          focusedIndex={this.state.focusedIndex}
          itemHeight={45}
          items={this.getMenuItems()}
          onEdit={this.onEdit}
          propertyPath={this.props.dataTreePath}
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          renderComponent={(props: any) =>
            DraggableListCard({
              ...props,
              isDelete: true,
              placeholder: "Button label",
            })
          }
          toggleVisibility={this.toggleVisibility}
          updateFocus={this.updateFocus}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />

        <Flex gap="spaces-3" justifyContent="end">
          {(this.props.allowSeparators ||
            (this.props.allowSpatialGrouping && !hasSeparator)) && (
            <Button
              className="self-end"
              kind="tertiary"
              onClick={() => this.addOption({ isSeparator: true })}
              size="sm"
            >
              Add separator
            </Button>
          )}
          <Button
            className="self-end"
            kind="secondary"
            onClick={() => this.addOption({ isSeparator: false })}
            size="sm"
          >
            Add button
          </Button>
        </Flex>
      </div>
    );
  }

  toggleVisibility = (index: number) => {
    const menuItems = this.getMenuItems();
    const isVisible = menuItems[index].isVisible === true ? false : true;
    const updatedMenuItems = menuItems.map((item, itemIndex) => {
      if (index === itemIndex) {
        return {
          ...item,
          isVisible: isVisible,
        };
      }
      return item;
    });
    this.updateProperty(this.props.propertyName, updatedMenuItems);
  };

  deleteOption = (index: number) => {
    const menuItemsArray = this.getMenuItems();
    if (menuItemsArray.length === 1) return;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedArray = menuItemsArray.filter((eachItem: any, i: number) => {
      return i !== index;
    });
    const updatedObj = updatedArray.reduce(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj: any, each: any, index: number) => {
        obj[each.id] = {
          ...each,
          index,
        };
        return obj;
      },
      {},
    );
    this.updateProperty(this.props.propertyName, updatedObj);
  };

  updateOption = (index: number, updatedLabel: string) => {
    const menuItemsArray = this.getMenuItems();
    const itemId = menuItemsArray[index].id;
    this.updateProperty(
      `${this.props.propertyName}.${itemId}.label`,
      updatedLabel,
    );
  };

  addOption = ({ isSeparator }: { isSeparator?: boolean }) => {
    let groupButtons = this.props.propertyValue;
    const groupButtonsArray = this.getMenuItems();
    const newGroupButtonId = generateReactKey({ prefix: "groupButton" });

    groupButtons = {
      ...groupButtons,
      [newGroupButtonId]: {
        id: newGroupButtonId,
        index: groupButtonsArray.length,
        label: isSeparator
          ? "Separator"
          : createMessage(BUTTON_WIDGET_DEFAULT_LABEL),
        widgetId: generateReactKey(),
        isDisabled: false,
        itemType: isSeparator ? "SEPARATOR" : "BUTTON",
        isSeparator,
        isVisible: true,
        variant: "filled",
      },
    };

    if (this.props.widgetProperties.type === "BUTTON_GROUP_WIDGET") {
      /**c
       * These properties are required for "BUTTON_GROUP_WIDGET" but not for
       * "WDS_TOOLBAR_BUTTONS_GROUP_WIDGET"
       */
      const optionalButtonGroupItemProperties = {
        menuItems: {},
        buttonType: "SIMPLE",
        placement: ButtonPlacementTypes.CENTER,
        buttonColor:
          this.props.widgetProperties.childStylesheet.button.buttonColor,
      };

      groupButtons[newGroupButtonId] = {
        ...groupButtons[newGroupButtonId],
        ...optionalButtonGroupItemProperties,
      };
    }

    if (this.props.widgetProperties.type === "WDS_INLINE_BUTTONS_WIDGET") {
      // if buttonVariant and buttonColor values ar present in session storage, then we should use those values
      const buttonVariantSessionValue = sessionStorage.getItem(
        "WDS_INLINE_BUTTONS_WIDGET.buttonVariant",
      );
      const buttonColorSessionValue = sessionStorage.getItem(
        "WDS_INLINE_BUTTONS_WIDGET.buttonColor",
      );

      groupButtons[newGroupButtonId] = {
        ...groupButtons[newGroupButtonId],
        buttonVariant: buttonVariantSessionValue || "filled",
        buttonColor: buttonColorSessionValue || "accent",
      };

      // if the widget is a WDS_INLINE_BUTTONS_WIDGET, and button already have filled button variant in groupButtons,
      // then we should add a secondary button ( outlined button ) instead of simple button
      const filledButtonVariant = groupButtonsArray.find(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (groupButton: any) => groupButton.buttonVariant === "filled",
      );

      if (filledButtonVariant) {
        groupButtons[newGroupButtonId] = {
          ...groupButtons[newGroupButtonId],
          buttonVariant: buttonVariantSessionValue || "outlined",
        };
      }
    }

    this.updateProperty(this.props.propertyName, groupButtons);
  };

  updateFocus = (index: number, isFocused: boolean) => {
    this.setState({ focusedIndex: isFocused ? index : null });
  };

  static getControlType() {
    return "GROUP_BUTTONS";
  }
}

export default ButtonListControl;
