import React, { ChangeEvent } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import { ControlWrapper } from "./StyledControls";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";
import { EventOrValueHandler } from "redux-form";
class CodeEditorControl extends BaseControl<ControlProps> {
  render() {
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        <DynamicAutocompleteInput
          theme={"DARK"}
          input={{ value: this.props.propertyValue, onChange: this.onChange }}
          initialHeight={32}
        />
      </ControlWrapper>
    );
  }

  onChange: EventOrValueHandler<ChangeEvent<any>> = (
    value: string | ChangeEvent,
  ) => {
    this.updateProperty(this.props.propertyName, value);
  };

  getControlType(): ControlType {
    return "CODE_EDITOR";
  }
}

export default CodeEditorControl;
