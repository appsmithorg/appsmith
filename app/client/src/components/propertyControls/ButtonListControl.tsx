import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { generateReactKey } from "utils/generators";
import { getNextEntityName } from "utils/AppsmithUtils";
import orderBy from "lodash/orderBy";
import isString from "lodash/isString";
import isUndefined from "lodash/isUndefined";
import { Button } from "design-system";
import { ButtonPlacementTypes } from "components/constants";
import { DraggableListControl } from "pages/Editor/PropertyPane/DraggableListControl";
import { DraggableListCard } from "components/propertyControls/DraggableListCard";

interface State {
  focusedIndex: number | null;
}

class ButtonListControl extends BaseControl<ControlProps, State> {
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
    const menuItems: Array<{
      id: string;
      label: string;
      isDisabled: boolean;
      isVisible: boolean;
      widgetId: string;
    }> =
      isString(this.props.propertyValue) ||
      isUndefined(this.props.propertyValue)
        ? []
        : Object.values(this.props.propertyValue);

    return orderBy(menuItems, ["index"], ["asc"]);
  };

  updateItems = (items: Array<Record<string, any>>) => {
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

        <Button
          className="self-end"
          kind="tertiary"
          onClick={this.addOption}
          size="sm"
          startIcon="plus"
        >
          Add new button
        </Button>
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
    const updatedArray = menuItemsArray.filter((eachItem: any, i: number) => {
      return i !== index;
    });
    const updatedObj = updatedArray.reduce(
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

  addOption = () => {
    let groupButtons = this.props.propertyValue;
    const groupButtonsArray = this.getMenuItems();
    const newGroupButtonId = generateReactKey({ prefix: "groupButton" });
    const newGroupButtonLabel = getNextEntityName(
      "Group Button ",
      groupButtonsArray.map((groupButton: any) => groupButton.label),
    );

    groupButtons = {
      ...groupButtons,
      [newGroupButtonId]: {
        id: newGroupButtonId,
        index: groupButtonsArray.length,
        label: newGroupButtonLabel,
        widgetId: generateReactKey(),
        isDisabled: false,
        isVisible: true,
      },
    };

    if (this.props.widgetProperties.type === "BUTTON_GROUP_WIDGET") {
      /**
       * These properties are required for "BUTTON_GROUP_WIDGET" but not for
       * "WDS_BUTTON_GROUP_WIDGET"
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
