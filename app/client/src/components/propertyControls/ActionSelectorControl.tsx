import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
// import DynamicActionCreator from "components/editorComponents/DynamicActionCreator";
import { ActionCreator } from "components/editorComponents/ActionCreator";

class ActionSelectorControl extends BaseControl<ControlProps> {
  handleValueUpdate = (newValue: string, isUpdatedViaKeyboard = false) => {
    const { propertyName } = this.props;
    this.updateProperty(propertyName, newValue, isUpdatedViaKeyboard);
  };

  render() {
    const { propertyValue } = this.props;

    return (
      <ActionCreator
        additionalAutoComplete={this.props.additionalAutoComplete}
        onValueChange={this.handleValueUpdate}
        value={propertyValue}
      />
    );
  }

  static getControlType() {
    return "ACTION_SELECTOR";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return true;
  }
}

export default ActionSelectorControl;
