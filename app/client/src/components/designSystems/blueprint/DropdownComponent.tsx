import * as React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import {
  MenuItem,
  Button,
  ControlGroup,
  Label,
  Classes,
} from "@blueprintjs/core";
import { SelectionType, DropdownOption } from "widgets/DropdownWidget";
import { Select, MultiSelect, IItemRendererProps } from "@blueprintjs/select";
import _ from "lodash";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import "../../../../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import styled, { labelStyle } from "constants/DefaultTheme";

const SingleDropDown = Select.ofType<DropdownOption>();
const MultiDropDown = MultiSelect.ofType<DropdownOption>();

const StyledSingleDropDown = styled(SingleDropDown)`
  div {
    flex: 1 1 auto;
  }
  span {
    width: 100%;
  }
  .bp3-button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
  }
  .bp3-button-text {
    text-overflow: ellipsis;
    text-align: center;
    overflow: hidden;
  }
  .bp3-icon {
    width: fit-content;
  }
`;

const StyledControlGroup = styled(ControlGroup)`
  &&& {
    label {
      ${labelStyle}
      margin: 0 ${WIDGET_PADDING * 2}px 0 0;
      align-self: center;
      flex: 0 1 30%;
      text-align: right;
    }
  }
`;

const DropdownContainer = styled.div`
  textalign: center;
  width: 100%;
`;

const StyledMultiDropDown = styled(MultiDropDown)`
  .bp3-multi-select {
    min-width: 0;
  }
`;
class DropDownComponent extends React.Component<DropDownComponentProps> {
  render() {
    const selectedItems = this.props.selectedIndexArr
      ? _.map(this.props.selectedIndexArr, index => {
          return this.props.options[index];
        })
      : [];
    return (
      <DropdownContainer>
        <StyledControlGroup fill>
          <Label className={Classes.TEXT_OVERFLOW_ELLIPSIS}>
            {this.props.label}
          </Label>
          {this.props.selectionType === "SINGLE_SELECT" ? (
            <StyledSingleDropDown
              className={this.props.isLoading ? "bp3-skeleton" : ""}
              items={this.props.options}
              filterable={false}
              itemRenderer={this.renderItem}
              onItemSelect={this.onItemSelect}
            >
              <Button
                intent={"primary"}
                rightIcon="chevron-down"
                text={
                  !_.isEmpty(this.props.options)
                    ? this.props.options[this.props.selectedIndex].label
                    : "Add options"
                }
              />
            </StyledSingleDropDown>
          ) : (
            <StyledMultiDropDown
              className={this.props.isLoading ? "bp3-skeleton" : ""}
              items={this.props.options}
              fill={true}
              placeholder={this.props.placeholder}
              tagRenderer={this.renderTag}
              itemRenderer={this.renderItem}
              selectedItems={selectedItems}
              tagInputProps={{ onRemove: this.onItemRemoved }}
              onItemSelect={this.onItemSelect}
            ></StyledMultiDropDown>
          )}
        </StyledControlGroup>
      </DropdownContainer>
    );
  }

  onItemSelect = (item: DropdownOption): void => {
    this.props.onOptionSelected(item);
  };

  onItemRemoved = (_tag: string, index: number) => {
    this.props.onOptionRemoved(index);
  };

  renderTag = (option: DropdownOption) => {
    return option.label;
  };

  isOptionSelected = (selectedOption: DropdownOption) => {
    const optionIndex = _.findIndex(this.props.options, option => {
      return option.value === selectedOption.value;
    });
    if (this.props.selectionType === "SINGLE_SELECT") {
      return optionIndex === this.props.selectedIndex;
    } else {
      return (
        _.findIndex(this.props.selectedIndexArr, index => {
          return index === optionIndex;
        }) !== -1
      );
    }
  };

  renderItem = (option: DropdownOption, itemProps: IItemRendererProps) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    return (
      <MenuItem
        icon={isSelected ? "tick" : "blank"}
        active={itemProps.modifiers.active}
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };
}

export interface DropDownComponentProps extends ComponentProps {
  selectionType: SelectionType;
  disabled?: boolean;
  onOptionSelected: (optionSelected: DropdownOption) => void;
  onOptionRemoved: (removedIndex: number) => void;
  placeholder?: string;
  label?: string;
  selectedIndex: number;
  selectedIndexArr: number[];
  options: DropdownOption[];
  isLoading: boolean;
}

export default DropDownComponent;
