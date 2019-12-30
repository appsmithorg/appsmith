import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import { ControlWrapper } from "./StyledControls";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";
class CodeEditorControl extends BaseControl<ControlProps> {
  render() {
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        <DynamicAutocompleteInput
          theme={"DARK"}
          input={{ value: this.props.propertyValue, onChange: this.onChange }}
        />
      </ControlWrapper>
    );
  }

  onChange = (value: string) => {
    this.updateProperty(this.props.propertyName, value);
  };

  getControlType(): ControlType {
    return "CODE_EDITOR";
  }
}

export default CodeEditorControl;
