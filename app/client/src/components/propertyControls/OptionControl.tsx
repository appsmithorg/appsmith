import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledInputGroup } from "./StyledControls";
import { Button } from "@blueprintjs/core";
import { DropdownOption } from "../../widgets/DropdownWidget";
import { ControlType } from "../../constants/PropertyControlConstants";

class OptionControl extends BaseControl<ControlProps> {
  render() {
    const options: DropdownOption[] = this.props.propertyValue || [{}];
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        {options.map((option, index) => {
          return (
            <ControlWrapper orientation={"HORIZONTAL"} key={index + ""}>
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
            </ControlWrapper>
          );
        })}
        <Button text={"Option"} icon={"add"} onClick={this.addOption} />
      </ControlWrapper>
    );
  }

  updateOptionLabel = (index: number, updatedLabel: string) => {
    const options: DropdownOption[] = this.props.propertyValue || [{}];
    options[index].label = updatedLabel;
    this.updateProperty("options", options);
  };

  updateOptionValue = (index: number, updatedValue: string) => {
    const options: DropdownOption[] = this.props.propertyValue || [{}];
    options[index].value = updatedValue;
    this.updateProperty("options", options);
  };

  addOption = () => {
    const options: DropdownOption[] = this.props.propertyValue || [{}];
    options.push({ label: "", value: "" });
    this.updateProperty("options", options);
  };

  getControlType(): ControlType {
    return "OPTION_INPUT";
  }
}

export default OptionControl;
