import { findIndex, isEmpty } from "lodash";
import React from "react";
import { MenuItem, Classes, Button as BButton } from "@blueprintjs/core";
import { Select, IItemRendererProps } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";

import { DropdownOption } from "widgets/DropdownWidget/constants";
import { stopClickEventPropagation } from "utils/helpers";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";

const SingleDropDown = Select.ofType<DropdownOption>();

const StyledSingleDropDown = styled(SingleDropDown)`
  div {
    padding: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  span {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    box-shadow: none;
    background: transparent;
    min-height: 32px;
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
    }
  }
`;

export const renderDropdown = (props: {
  options: DropdownOption[];
  isCellVisible: boolean;
  onItemSelect: (onOptionChange: string, item: DropdownOption) => void;
  onOptionChange: string;
  selectedIndex?: number;
}) => {
  const isOptionSelected = (selectedOption: DropdownOption) => {
    const optionIndex = findIndex(props.options, (option) => {
      return option.value === selectedOption.value;
    });
    return optionIndex === props.selectedIndex;
  };
  const renderSingleSelectItem = (
    option: DropdownOption,
    itemProps: IItemRendererProps,
  ) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    if (!props.isCellVisible) {
      return null;
    }
    const isSelected: boolean = isOptionSelected(option);
    return (
      <MenuItem
        active={isSelected}
        className="single-select"
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };
  return (
    <div onClick={stopClickEventPropagation} style={{ height: "100%" }}>
      <StyledSingleDropDown
        filterable={false}
        itemRenderer={renderSingleSelectItem}
        items={props.options}
        onItemSelect={(item: DropdownOption) => {
          props.onItemSelect(props.onOptionChange, item);
        }}
        popoverProps={{
          minimal: true,
          usePortal: true,
          popoverClassName: "select-popover-wrapper",
        }}
      >
        <BButton
          rightIcon={IconNames.CHEVRON_DOWN}
          text={
            !isEmpty(props.options) &&
            props.selectedIndex !== undefined &&
            props.selectedIndex > -1
              ? props.options[props.selectedIndex].label
              : "-- Select --"
          }
        />
      </StyledSingleDropDown>
    </div>
  );
};
