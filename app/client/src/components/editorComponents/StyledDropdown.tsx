import React from "react";
import _ from "lodash";
import { DropdownOption } from "widgets/DropdownWidget";
import {
  StyledPopover,
  StyledDropDownContainer,
  StyledMenuItem,
} from "components/propertyControls/StyledControls";
import {
  Button as BlueprintButton,
  Menu,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import Button from "components/editorComponents/Button";

type ActionTypeDropdownProps = {
  options: DropdownOption[];
  selectedValue: string;
  defaultText: string;
  onSelect: (value: string) => void;
  createButton?: {
    text: string;
    onClick: () => void;
  };
};

class StyledDropdown extends React.Component<ActionTypeDropdownProps> {
  handleSelect = (option: DropdownOption) => {
    this.props.onSelect(option.value);
  };
  renderItem = (option: DropdownOption) => {
    const isSelected = this.isOptionSelected(option);
    return (
      <StyledMenuItem
        className="single-select"
        active={isSelected}
        key={option.value}
        onClick={option.children ? _.noop : () => this.handleSelect(option)}
        text={option.label}
        popoverProps={{
          minimal: true,
          interactionKind: PopoverInteractionKind.CLICK,
          position: PopoverPosition.RIGHT,
        }}
      >
        {option.children && option.children.map(this.renderItem)}
      </StyledMenuItem>
    );
  };
  isOptionSelected = (currentOption: DropdownOption) => {
    if (currentOption.children) {
      return _.some(currentOption.children, {
        value: this.props.selectedValue,
      });
    } else {
      return currentOption.value === this.props.selectedValue;
    }
  };

  render() {
    const { selectedValue } = this.props;
    let selectedOption = {
      label: this.props.defaultText,
    };
    this.props.options.length > 0 &&
      this.props.options.forEach(o => {
        if (o.value === selectedValue) {
          selectedOption = o;
        } else {
          const childOption = _.find(o.children, {
            value: this.props.selectedValue,
          });
          if (childOption) selectedOption = childOption;
        }
      });
    const list =
      this.props.options.length > 0 && this.props.options.map(this.renderItem);
    let createBtn: React.ReactNode;
    if (this.props.createButton) {
      createBtn = (
        <Button
          text={`Create ${this.props.createButton.text}`}
          icon="plus"
          intent="primary"
          className="t--create-modal-btn"
          onClick={this.props.createButton?.onClick}
          fluid
        />
      );
    }
    const popoverContent = (
      <Menu>
        {createBtn}
        {list}
      </Menu>
    );
    return (
      <StyledDropDownContainer>
        <StyledPopover usePortal={true} minimal={true} content={popoverContent}>
          <BlueprintButton
            rightIcon={IconNames.CHEVRON_DOWN}
            text={selectedOption.label}
            className={`t--open-dropdown-${this.props.defaultText
              .split(" ")
              .join("-")}`}
          />
        </StyledPopover>
      </StyledDropDownContainer>
    );
  }
}

export default StyledDropdown;
