import React, { useCallback, useEffect, useState } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledInputGroup,
  StyledPropertyPaneButton,
  StyledDragIcon,
  StyledDeleteIcon,
  StyledEditIcon,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { generateReactKey } from "utils/generators";
import { DroppableComponent } from "components/ads/DraggableListComponent";
import { getNextEntityName } from "utils/AppsmithUtils";
import _, { debounce, orderBy } from "lodash";
import { Category, Size } from "components/ads/Button";

const StyledPropertyPaneButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 10px;
`;

const ItemWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const MenuItemsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 2px;
  margin-bottom: 2px;
  width: 100%;
  padding-left: 10px;
  padding-right: 60px;
  text-overflow: ellipsis;
  &&& {
    input {
      border: none;
      color: ${(props) => props.theme.colors.propertyPane.radioGroupText};
      background: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
      &:focus {
        border: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
        background: ${(props) => props.theme.colors.paneInputBG};
      }
    }
  }
`;

const AddMenuItemButton = styled(StyledPropertyPaneButton)`
  justify-content: center;
  flex-grow: 1;
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
    isVisible?: boolean;
  };
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (props: any) => void;
};

function MenuItemComponent(props: RenderComponentProps) {
  const { deleteOption, index, item, updateOption } = props;

  const [value, setValue] = useState(item.label);
  const [isEditing, setEditing] = useState(false);

  useEffect(() => {
    if (!isEditing && item && item.label) setValue(item.label);
  }, [item?.label, isEditing]);

  const debouncedUpdate = debounce(updateOption, 1000);
  const onChange = useCallback(
    (index: number, value: string) => {
      setValue(value);
      debouncedUpdate(index, value);
    },
    [updateOption],
  );
  const handleChange = useCallback(() => props.onEdit && props.onEdit(index), [
    index,
  ]);

  const onFocus = () => setEditing(true);
  const onBlur = () => setEditing(false);

  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        onBlur={onBlur}
        onChange={(value: string) => {
          onChange(index, value);
        }}
        onFocus={onFocus}
        placeholder="Menu item label"
        value={value}
      />
      <StyledDeleteIcon
        className="t--delete-tab-btn"
        height={20}
        marginRight={12}
        onClick={() => {
          deleteOption(index);
        }}
        width={20}
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        onClick={handleChange}
        width={20}
      />
    </ItemWrapper>
  );
}

class MenuItemsControl extends BaseControl<ControlProps> {
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
    const menuItems: Array<{
      id: string;
      label: string;
    }> = Object.values(this.props.propertyValue);
    const targetMenuItem = menuItems[index];
    this.props.openNextPanel({
      index,
      ...targetMenuItem,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  render() {
    const menuItems: Array<{
      id: string;
      label: string;
    }> =
      _.isString(this.props.propertyValue) ||
      _.isUndefined(this.props.propertyValue)
        ? []
        : Object.values(this.props.propertyValue);
    return (
      <MenuItemsWrapper>
        <DroppableComponent
          deleteOption={this.deleteOption}
          itemHeight={45}
          items={orderBy(menuItems, ["index"], ["asc"])}
          onEdit={this.onEdit}
          renderComponent={MenuItemComponent}
          toggleVisibility={this.toggleVisibility}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />
        <StyledPropertyPaneButtonWrapper>
          <AddMenuItemButton
            category={Category.tertiary}
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
    const menuItems: Array<{
      id: string;
      label: string;
      isDisabled: boolean;
      isVisible: boolean;
      widgetId: string;
    }> = this.props.propertyValue.slice();
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
    const menuItemsArray: any = Object.values(this.props.propertyValue);
    const itemId = menuItemsArray[index].id;
    if (menuItemsArray && menuItemsArray.length === 1) return;
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
    this.deleteProperties([`${this.props.propertyName}.${itemId}.isVisible`]);
    this.updateProperty(this.props.propertyName, updatedObj);
  };

  updateOption = (index: number, updatedLabel: string) => {
    const menuItemsArray: any = Object.values(this.props.propertyValue);
    const itemId = menuItemsArray[index].id;
    this.updateProperty(
      `${this.props.propertyName}.${itemId}.label`,
      updatedLabel,
    );
  };

  addOption = () => {
    let menuItems = this.props.propertyValue || [];
    const menuItemsArray = Object.values(menuItems);
    const newMenuItemId = generateReactKey({ prefix: "menuItem" });
    const newMenuItemLabel = getNextEntityName(
      "Menu Item ",
      menuItemsArray.map((menuItem: any) => menuItem.label),
    );
    menuItems = {
      ...menuItems,
      [newMenuItemId]: {
        id: newMenuItemId,
        label: newMenuItemLabel,
        widgetId: generateReactKey(),
        isDisabled: false,
        isVisible: true,
      },
    };

    this.updateProperty(this.props.propertyName, menuItems);
  };

  static getControlType() {
    return "MENU_ITEMS";
  }
}

export default MenuItemsControl;
