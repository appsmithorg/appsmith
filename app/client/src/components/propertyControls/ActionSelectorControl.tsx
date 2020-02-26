import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
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
        onValueChange={this.handleValueUpdate}
      />
    );
  }

  getControlType(): ControlType {
    return "ACTION_SELECTOR";
  }
}

export default ActionSelectorControl;
