import React, { useCallback, useEffect, useState, useRef } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledPropertyPaneButton,
  StyledDragIcon,
  StyledDeleteIcon,
  StyledEditIcon,
  StyledOptionControlInputGroup,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { generateReactKey } from "utils/generators";
import { DroppableComponent } from "components/ads/DraggableListComponent";
import { getNextEntityName } from "utils/AppsmithUtils";
import _, { debounce } from "lodash";
import { Category, Size } from "components/ads/Button";
import { Colors } from "constants/Colors";
import { ButtonPlacementTypes } from "components/constants";

const StyledPropertyPaneButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 10px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
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

type RenderComponentProps = {
  focusedIndex: number | null | undefined;
  index: number;
  isDragging: boolean;
  item: {
    label: string;
    isVisible?: boolean;
  };
  deleteOption: (index: number) => void;
  updateFocus?: (index: number, isFocused: boolean) => void;

  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (props: any) => void;
};

function GroupButtonComponent(props: RenderComponentProps) {
  const {
    deleteOption,
    focusedIndex,
    index,
    isDragging,
    item,
    updateFocus,
    updateOption,
  } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(item.label);
  const [isEditing, setEditing] = useState(false);

  useEffect(() => {
    if (!isEditing && item && item.label) setValue(item.label);
  }, [item?.label, isEditing]);

  useEffect(() => {
    if (focusedIndex !== null && focusedIndex === index && !isDragging) {
      if (ref && ref.current) {
        ref?.current.focus();
      }
    } else if (isDragging && focusedIndex === index) {
      if (ref && ref.current) {
        ref?.current.blur();
      }
    }
  }, [focusedIndex, isDragging]);

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

  const onFocus = () => {
    setEditing(true);
    if (updateFocus) {
      updateFocus(index, true);
    }
  };

  const onBlur = () => {
    if (!isDragging) {
      setEditing(false);
      if (updateFocus) {
        updateFocus(index, false);
      }
    }
  };

  return (
    <ButtonWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        onBlur={onBlur}
        onChange={(value: string) => {
          onChange(index, value);
        }}
        onFocus={onFocus}
        placeholder="Button label"
        ref={ref}
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
    </ButtonWrapper>
  );
}

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
    }> = _.isString(this.props.propertyValue)
      ? []
      : Object.values(this.props.propertyValue);
    return (
      <ButtonListWrapper>
        <DroppableComponent
          deleteOption={this.deleteOption}
          fixedHeight={370}
          focusedIndex={this.state.focusedIndex}
          itemHeight={45}
          items={menuItems}
          onEdit={this.onEdit}
          renderComponent={GroupButtonComponent}
          toggleVisibility={this.toggleVisibility}
          updateFocus={this.updateFocus}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />
        <StyledPropertyPaneButtonWrapper>
          <AddNewButton
            category={Category.tertiary}
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
    let groupButtons = this.props.propertyValue;
    const groupButtonsArray = Object.values(groupButtons);
    const newGroupButtonId = generateReactKey({ prefix: "groupButton" });
    const newGroupButtonLabel = getNextEntityName(
      "Group Button ",
      groupButtonsArray.map((groupButton: any) => groupButton.label),
    );
    groupButtons = {
      ...groupButtons,
      [newGroupButtonId]: {
        id: newGroupButtonId,
        label: newGroupButtonLabel,
        menuItems: {},
        buttonType: "SIMPLE",
        buttonColor: Colors.GREEN,
        placement: ButtonPlacementTypes.CENTER,
        widgetId: generateReactKey(),
        isDisabled: false,
        isVisible: true,
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
