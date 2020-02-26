import React, { ChangeEvent } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";
import { EventOrValueHandler } from "redux-form";
class CodeEditorControl extends BaseControl<ControlProps> {
  render() {
    const { validationMessage, propertyValue, isValid } = this.props;
    return (
      <DynamicAutocompleteInput
        theme={"DARK"}
        input={{ value: propertyValue, onChange: this.onChange }}
        meta={{
          error: isValid ? "" : validationMessage,
          touched: true,
        }}
        singleLine={false}
      />
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
