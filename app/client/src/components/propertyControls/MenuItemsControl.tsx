import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledPropertyPaneButton } from "./StyledControls";
import styled from "constants/DefaultTheme";
import { generateReactKey } from "utils/generators";
import { getNextEntityName } from "utils/AppsmithUtils";
import orderBy from "lodash/orderBy";
import isString from "lodash/isString";
import isUndefined from "lodash/isUndefined";
import { Category, Size } from "design-system";
import { DraggableListControl } from "pages/Editor/PropertyPane/DraggableListControl";
import { DraggableListCard } from "components/propertyControls/DraggableListCard";

const StyledPropertyPaneButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 10px;
`;

const MenuItemsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const AddMenuItemButton = styled(StyledPropertyPaneButton)`
  justify-content: center;
  flex-grow: 1;
`;

type State = {
  focusedIndex: number | null;
};

class MenuItemsControl extends BaseControl<ControlProps, State> {
  constructor(props: ControlProps) {
    super(props);

    this.state = {
      focusedIndex: null,
    };
  }

  componentDidUpdate(prevProps: ControlProps): void {
    //on adding a new column last column should get focused
    if (
      prevProps.propertyValue &&
      this.props.propertyValue &&
      Object.keys(prevProps.propertyValue).length + 1 ===
        Object.keys(this.props.propertyValue).length
    ) {
      this.updateFocus(Object.keys(this.props.propertyValue).length - 1, true);
    }
  }
  updateItems = (items: Array<Record<string, any>>) => {
    const menuItems = items.reduce((obj: any, each: any, index) => {
      obj[each.id] = {
        ...each,
        index,
      };
      return obj;
    }, {});
    this.updateProperty(this.props.propertyName, menuItems);
  };

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
      <MenuItemsWrapper>
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
              placeholder: "Menu item label",
            })
          }
          toggleVisibility={this.toggleVisibility}
          updateFocus={this.updateFocus}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />
        <StyledPropertyPaneButtonWrapper>
          <AddMenuItemButton
            category={Category.secondary}
            className="t--add-menu-item-btn"
            icon="plus"
            onClick={this.addOption}
            size={Size.medium}
            tag="button"
            text="Add a new Menu Item"
            type="button"
          />
        </StyledPropertyPaneButtonWrapper>
      </MenuItemsWrapper>
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
    let menuItems = this.props.propertyValue || [];
    const menuItemsArray = this.getMenuItems();
    const newMenuItemId = generateReactKey({ prefix: "menuItem" });
    const newMenuItemLabel = getNextEntityName(
      "Menu Item ",
      menuItemsArray.map((menuItem: any) => menuItem.label),
    );
    menuItems = {
      ...menuItems,
      [newMenuItemId]: {
        id: newMenuItemId,
        index: menuItemsArray.length,
        label: newMenuItemLabel,
        widgetId: generateReactKey(),
        isDisabled: false,
        isVisible: true,
      },
    };

    this.updateProperty(this.props.propertyName, menuItems);
  };

  updateFocus = (index: number, isFocused: boolean) => {
    this.setState({ focusedIndex: isFocused ? index : null });
  };

  static getControlType() {
    return "MENU_ITEMS";
  }
}

export default MenuItemsControl;
