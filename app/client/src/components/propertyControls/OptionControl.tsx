import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { DropdownOption } from "widgets/DropdownWidget";
import { ControlType } from "constants/PropertyControlConstants";
import { KeyValueComponent } from "./KeyValueComponent";

export type DropDownOptionWithKey = DropdownOption & {
  key: string;
};

class OptionControl extends BaseControl<ControlProps> {
  render() {
    return (
      <KeyValueComponent
        pairs={this.props.propertyValue}
        updatePairs={this.updateOptions}
      />
    );
  }

  updateOptions = (options: DropdownOption[]) => {
    this.updateProperty("options", options);
  };

  getControlType(): ControlType {
    return "OPTION_INPUT";
  }
}

export default OptionControl;
