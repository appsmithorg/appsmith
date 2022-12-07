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
import { ButtonPlacementTypes } from "components/constants";
import { DraggableListControl } from "pages/Editor/PropertyPane/DraggableListControl";
import { DraggableListCard } from "components/propertyControls/DraggableListCard";

const StyledPropertyPaneButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 10px;
`;

const ButtonListWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const AddNewButton = styled(StyledPropertyPaneButton)`
  justify-content: center;
  flex-grow: 1;
`;

type State = {
  focusedIndex: number | null;
};

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
      <ButtonListWrapper>
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
        <StyledPropertyPaneButtonWrapper>
          <AddNewButton
            category={Category.secondary}
            icon="plus"
            onClick={this.addOption}
            size={Size.medium}
            tag="button"
            text="Add new Button"
            type="button"
          />
        </StyledPropertyPaneButtonWrapper>
      </ButtonListWrapper>
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
        menuItems: {},
        buttonType: "SIMPLE",
        placement: ButtonPlacementTypes.CENTER,
        widgetId: generateReactKey(),
        isDisabled: false,
        isVisible: true,
        buttonColor: this.props.widgetProperties.childStylesheet.button
          .buttonColor,
      },
    };

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
