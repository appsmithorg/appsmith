import React, { ChangeEvent } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import CodeEditor from "components/editorComponents/CodeEditor";
import { EventOrValueHandler } from "redux-form";
import {
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";

class CodeEditorControl extends BaseControl<ControlProps> {
  render() {
    const {
      dataTreePath,
      evaluatedValue,
      expected,
      propertyValue,
      useValidationMessage,
    } = this.props;

    const props: Partial<ControlProps> = {};

    if (dataTreePath) props.dataTreePath = dataTreePath;
    if (evaluatedValue) props.evaluatedValue = evaluatedValue;
    if (expected) props.expected = expected;

    return (
      <CodeEditor
        additionalDynamicData={this.props.additionalAutoComplete}
        input={{ value: propertyValue, onChange: this.onChange }}
        mode={EditorModes.TEXT_WITH_BINDING}
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={this.props.theme}
        useValidationMessage={useValidationMessage}
        {...props}
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
