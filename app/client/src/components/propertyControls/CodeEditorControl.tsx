import React, { ChangeEvent } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";
import { EventOrValueHandler } from "redux-form";
class CodeEditorControl extends BaseControl<ControlProps> {
  render() {
    const {
      errorMessage,
      expected,
      propertyValue,
      isValid,
      dataTreePath,
    } = this.props;
    return (
      <DynamicAutocompleteInput
        theme={"DARK"}
        input={{ value: propertyValue, onChange: this.onChange }}
        dataTreePath={dataTreePath}
        expected={expected}
        meta={{
          error: isValid ? "" : errorMessage,
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

  static getControlType() {
    return "CODE_EDITOR";
  }
}

export default CodeEditorControl;
