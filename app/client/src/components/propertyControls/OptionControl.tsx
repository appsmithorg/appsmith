import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  ControlWrapper,
  StyledInputGroup,
  StyledPropertyPaneButton,
} from "./StyledControls";
import { DropdownOption } from "widgets/DropdownWidget";
import { ControlType } from "constants/PropertyControlConstants";
import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { AnyStyledComponent } from "styled-components";

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 5px 5px;
  position: absolute;
  right: -4px;
  cursor: pointer;
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
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
    return (
      <React.Fragment>
        {options.map((option, index) => {
          return (
            <StyledOptionControlWrapper
              orientation={"HORIZONTAL"}
              key={option.value}
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
        <StyledPropertyPaneButton
          text={"Option"}
          icon={"plus"}
          color={"#FFFFFF"}
          minimal={true}
          onClick={this.addOption}
        />
      </React.Fragment>
    );
  }

  deleteOption = (index: number) => {
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
    const newOptions = options.filter((o, i) => i !== index);
    this.updateProperty("options", newOptions);
  };

  updateOptionLabel = (index: number, updatedLabel: string) => {
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
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
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
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
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
    options.push({ label: "", value: "" });
    this.updateProperty("options", options);
  };

  getControlType(): ControlType {
    return "OPTION_INPUT";
  }
}

export default OptionControl;
