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
      validationMessage,
      expected,
      propertyValue,
      isValid,
      dataTreePath,
      evaluatedValue,
    } = this.props;
    const props: Partial<ControlProps> = {};
    if (dataTreePath) props.dataTreePath = dataTreePath;
    if (evaluatedValue) props.evaluatedValue = evaluatedValue;
    if (expected) props.expected = expected;

    return (
      <CodeEditor
        theme={this.props.theme}
        input={{ value: propertyValue, onChange: this.onChange }}
        meta={{
          error: isValid ? "" : validationMessage,
          touched: true,
        }}
        size={EditorSize.EXTENDED}
        mode={EditorModes.TEXT_WITH_BINDING}
        tabBehaviour={TabBehaviour.INDENT}
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
