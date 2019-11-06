import * as React from "react";
import { ComponentProps } from "../appsmith/BaseComponent";
import { MenuItem, Button } from "@blueprintjs/core";
import { Container } from "../appsmith/ContainerComponent";
import { SelectionType, DropdownOption } from "../../../widgets/DropdownWidget";
import { Select, MultiSelect, IItemRendererProps } from "@blueprintjs/select";
import _ from "lodash";
import "../../../../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";

const SingleDropDown = Select.ofType<DropdownOption>();
const MultiDropDown = MultiSelect.ofType<DropdownOption>();

class DropDownComponent extends React.Component<DropDownComponentProps> {
  render() {
    const selectedItems = this.props.selectedIndexArr
      ? _.map(this.props.selectedIndexArr, index => {
          return this.props.options[index];
        })
      : [];
    return (
      <div style={{ textAlign: "center" }}>
        {this.props.selectionType === "SINGLE_SELECT" ? (
          <SingleDropDown
            items={this.props.options}
            filterable={false}
            itemRenderer={this.renderItem}
            onItemSelect={this.onItemSelect}
          >
            <Container {...this.props}>
              <Button
                intent={"primary"}
                rightIcon="chevron-down"
                text={
                  !_.isEmpty(this.props.options)
                    ? this.props.options[this.props.selectedIndex].label
                    : "Add options"
                }
              />
            </Container>
          </SingleDropDown>
        ) : (
          <Container {...this.props}>
            <MultiDropDown
              items={this.props.options}
              placeholder={this.props.placeholder}
              tagRenderer={this.renderTag}
              itemRenderer={this.renderItem}
              selectedItems={selectedItems}
              tagInputProps={{ onRemove: this.onItemRemoved }}
              onItemSelect={this.onItemSelect}
            ></MultiDropDown>
          </Container>
        )}
      </div>
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
}

export default DropDownComponent;
