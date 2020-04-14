import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import DynamicActionCreator from "components/editorComponents/DynamicActionCreator";

class ActionSelectorControl extends BaseControl<ControlProps> {
  handleValueUpdate = (newValue: string) => {
    const { propertyName } = this.props;
    this.updateProperty(propertyName, newValue);
  };

  render() {
    const { propertyValue } = this.props;
    return (
      <DynamicActionCreator
        value={propertyValue}
        isValid={this.props.isValid}
        validationMessage={this.props.validationMessage}
        onValueChange={this.handleValueUpdate}
      />
    );
  }

  static getControlType() {
    return "ACTION_SELECTOR";
  }
}

export default ActionSelectorControl;
