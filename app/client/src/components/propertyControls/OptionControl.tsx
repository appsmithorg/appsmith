import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import { DropdownOption } from "components/constants";
import { KeyValueComponent } from "./KeyValueComponent";
import { isDynamicValue } from "utils/DynamicBindingUtils";

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

  updateOptions = (options: DropdownOption[], isUpdatedViaKeyboard = false) => {
    this.updateProperty("options", options, isUpdatedViaKeyboard);
  };

  static getControlType() {
    return "OPTION_INPUT";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    if (isDynamicValue(value)) return false;

    try {
      const pairs: DropdownOption[] = JSON.parse(value);
      for (const x of pairs) {
        const keys = Object.keys(x);
        if (!keys.includes("label") || !keys.includes("value")) {
          return false;
        }
      }
    } catch {
      return false;
    }

    return true;
  }
}

export default OptionControl;
