import React, { useCallback } from "react";
import { Alignment } from "@blueprintjs/core";
import _, { debounce } from "lodash";

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
import { getCamelCaseString, getNextEntityName } from "utils/AppsmithUtils";
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

const ItemsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 2px;
  margin-bottom: 2px;
  width: 100%;
  padding-left: 30px;
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

const AddItemButton = styled(StyledPropertyPaneButton)`
  justify-content: center;
  flex-grow: 1;
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
    value?: string;
    isVisible?: boolean;
  };
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (props: any) => void;
};

function ItemComponent(props: RenderComponentProps) {
  const { deleteOption, index, item, updateOption } = props;
  const debouncedUpdate = debounce(updateOption, 1000);
  const handleChange = useCallback(() => props.onEdit && props.onEdit(index), [
    index,
  ]);
  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        defaultValue={item.label}
        onChange={(value: string) => {
          debouncedUpdate(index, value);
        }}
        placeholder="Item label"
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

class ItemsControl extends BaseControl<ControlProps> {
  updateItems = (items: Array<Record<string, any>>) => {
    const updatedItemsObj = items.reduce(
      (obj: any, each: any, index: number) => {
        obj[each.id] = {
          ...each,
          index,
        };
        return obj;
      },
      {},
    );
    this.updateProperty(this.props.propertyName, updatedItemsObj);
  };

  onEdit = (index: number) => {
    const items: Array<{
      id: string;
      label: string;
    }> = Object.values(this.props.propertyValue);
    const targetItem = items[index];
    this.props.openNextPanel({
      index,
      ...targetItem,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  render() {
    const items: Array<{
      id: string;
      label: string;
    }> = _.isString(this.props.propertyValue)
      ? []
      : Object.values(this.props.propertyValue);
    return (
      <ItemsWrapper>
        <DroppableComponent
          deleteOption={this.deleteOption}
          itemHeight={45}
          items={items}
          onEdit={this.onEdit}
          renderComponent={ItemComponent}
          toggleVisibility={this.toggleVisibility}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />
        <StyledPropertyPaneButtonWrapper>
          <AddItemButton
            category={Category.tertiary}
            icon="plus"
            onClick={this.addOption}
            size={Size.medium}
            tag="button"
            text="Add a new item"
            type="button"
          />
        </StyledPropertyPaneButtonWrapper>
      </ItemsWrapper>
    );
  }

  toggleVisibility = (index: number) => {
    const items: Array<{
      id: string;
      label: string;
      isDisabled: boolean;
      isVisible: boolean;
      widgetId: string;
    }> = Object.values(this.props.propertyValue);
    const isVisible = items[index].isVisible === true ? false : true;
    const updatedItems = items.map((item, itemIndex) => {
      if (index === itemIndex) {
        return {
          ...item,
          isVisible: isVisible,
        };
      }
      return item;
    });
    const updatedObj = updatedItems.reduce(
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

  deleteOption = (index: number) => {
    const itemsArray: any = Object.values(this.props.propertyValue);
    const itemId = itemsArray[index].id;
    if (itemsArray && itemsArray.length === 1) return;
    const updatedArray = itemsArray.filter((eachItem: any, i: number) => {
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
    const itemsArray: any = Object.values(this.props.propertyValue);
    const itemId = itemsArray[index].id;
    this.updateProperty(
      `${this.props.propertyName}.${itemId}.label`,
      updatedLabel,
    );
  };

  addOption = () => {
    let items = this.props.propertyValue;
    const itemsArray = Object.values(items);
    const newItemId = generateReactKey({ prefix: "item" });
    const newItemLabel = getNextEntityName(
      "Item ",
      itemsArray.map((item: any) => item.label),
    );
    const newItemValue = getCamelCaseString(newItemLabel);
    items = {
      ...items,
      [newItemId]: {
        id: newItemId,
        label: newItemLabel,
        value: newItemValue,
        alignIndicator: Alignment.LEFT,
        widgetId: generateReactKey(),
        isDisabled: false,
        isVisible: true,
      },
    };

    this.updateProperty(this.props.propertyName, items);
  };

  static getControlType() {
    return "ITEMS";
  }
}

export default ItemsControl;
