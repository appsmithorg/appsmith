import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { IconName, ButtonGroup, Button, Classes } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
const iconNames: string[] = Object.values({ ...IconNames });

class MultiSwitchControl extends BaseControl<MultiSwitchControlProps> {
  renderOption = (option: SwitchOption) => {
    const isIcon: boolean =
      !!option.icon && iconNames.indexOf(option.icon) > -1;
    return (
      <Button
        active={this.props.propertyValue === option.value}
        icon={isIcon ? (option.icon as IconName) : undefined}
        key={option.label || option.icon}
        onClick={() =>
          this.updateProperty(this.props.propertyName, option.value)
        }
        text={!isIcon && option.label}
      />
    );
  };
  render() {
    return (
      <ButtonGroup className={Classes.DARK}>
        {this.props.options.map(this.renderOption)}
      </ButtonGroup>
    );
  }
  static getControlType() {
    return "MULTI_SWITCH";
  }
}

interface SwitchOption {
  label?: string;
  icon?: string;
  altText?: string;
  value: string | number;
}

export interface MultiSwitchControlProps extends ControlProps {
  options: SwitchOption[];
}

export default MultiSwitchControl;
