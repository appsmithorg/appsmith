import React from "react";

import type { DropdownOption } from "components/constants";
import { isDynamicValue } from "utils/DynamicBindingUtils";

import type { SegmentedControlOption } from "@appsmith/ads";

import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { KeyValueComponent } from "./KeyValueComponent";

class OptionControl extends BaseControl<ControlProps> {
  render() {
    return (
      <KeyValueComponent
        pairs={this.props.propertyValue}
        updatePairs={this.updateOptions}
      />
    );
  }

  updateOptions = (
    options: SegmentedControlOption[],
    isUpdatedViaKeyboard = false,
  ) => {
    this.updateProperty("options", options, isUpdatedViaKeyboard);
  };

  static getControlType() {
    return "OPTION_INPUT";
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
