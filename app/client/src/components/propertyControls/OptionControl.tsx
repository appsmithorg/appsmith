import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledInputGroup } from "./StyledControls";
import { Button } from "@blueprintjs/core";
import { DropdownOption } from "widgets/DropdownWidget";
import { ControlType } from "constants/PropertyControlConstants";
import { generateReactKey } from "utils/generators";
import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { AnyStyledComponent } from "styled-components";

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 5px 5px;
  position: absolute;
  right: -13px;
  cursor: pointer;
`;

const StyledAddOptionButton = styled(Button)`
  &&&& {
    background-color: ${props => props.theme.colors.info};
    color: #ffffff;
    .bp3-icon {
      color: #ffffff;
      margin-right: 4px;
    }
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 2px;
`;

const StyledOptionControlWrapper = styled(ControlWrapper)`
  display: flex;
  justify-content: flex-start;
  padding-right: 16px;
`;

class OptionControl extends BaseControl<ControlProps> {
  render() {
    const options: DropdownOption[] = this.props.propertyValue || [{}];
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        {options.map((option, index) => {
          return (
            <StyledOptionControlWrapper
              orientation={"HORIZONTAL"}
              key={option.id}
            >
              <StyledOptionControlInputGroup
                type={"text"}
                placeholder={"Name"}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  this.updateOptionLabel(index, event.target.value);
                }}
                defaultValue={option.label}
              />
              <StyledOptionControlInputGroup
                type={"text"}
                placeholder={"Value"}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  this.updateOptionValue(index, event.target.value);
                }}
                defaultValue={option.value}
              />
              <StyledDeleteIcon
                height={20}
                width={20}
                onClick={() => {
                  this.deleteOption(index);
                }}
              />
            </StyledOptionControlWrapper>
          );
        })}
        <StyledAddOptionButton
          text={"Option"}
          icon={"plus"}
          color={"#FFFFFF"}
          minimal={true}
          onClick={this.addOption}
        />
      </ControlWrapper>
    );
  }

  deleteOption = (index: number) => {
    const options: DropdownOption[] = this.props.propertyValue.slice();
    options.splice(index, 1);
    this.updateProperty("options", options);
  };

  updateOptionLabel = (index: number, updatedLabel: string) => {
    const options: DropdownOption[] = this.props.propertyValue;
    this.updateProperty(
      "options",
      options.map((option, optionIndex) => {
        if (index !== optionIndex) {
          return option;
        }
        return {
          ...option,
          label: updatedLabel,
        };
      }),
    );
  };

  updateOptionValue = (index: number, updatedValue: string) => {
    const options: DropdownOption[] = this.props.propertyValue;
    this.updateProperty(
      "options",
      options.map((option, optionIndex) => {
        if (index !== optionIndex) {
          return option;
        }
        return {
          ...option,
          value: updatedValue,
        };
      }),
    );
  };

  addOption = () => {
    const options: DropdownOption[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    options.push({ label: "", value: "", id: generateReactKey() });
    this.updateProperty("options", options);
  };

  getControlType(): ControlType {
    return "OPTION_INPUT";
  }
}

export default OptionControl;
