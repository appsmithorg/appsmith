import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledInputGroup } from "./StyledControls";
import { Button } from "@blueprintjs/core";
import { DropdownOption } from "widgets/DropdownWidget";
import { ControlType } from "constants/PropertyControlConstants";
import { generateReactKey } from "utils/generators";

class OptionControl extends BaseControl<ControlProps> {
  render() {
    const options: DropdownOption[] = this.props.propertyValue || [{}];
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        {options.map((option, index) => {
          return (
            <ControlWrapper orientation={"HORIZONTAL"} key={option.id}>
              <StyledInputGroup
                type={"text"}
                placeholder={"Name"}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  this.updateOptionLabel(index, event.target.value);
                }}
                defaultValue={option.label}
              />
              <StyledInputGroup
                type={"text"}
                placeholder={"Value"}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  this.updateOptionValue(index, event.target.value);
                }}
                defaultValue={option.value}
              />
              <Button
                color={"#A3B3BF"}
                icon={"delete"}
                onClick={() => {
                  this.deleteOption(index);
                }}
              ></Button>
            </ControlWrapper>
          );
        })}
        <Button text={"Option"} icon={"add"} onClick={this.addOption} />
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
