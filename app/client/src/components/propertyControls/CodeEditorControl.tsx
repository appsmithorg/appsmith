import React, { ChangeEvent } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import CodeEditor from "components/editorComponents/CodeEditor";
import { EventOrValueHandler } from "redux-form";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
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

    return (
      <CodeEditor
        theme={EditorTheme.DARK}
        input={{ value: propertyValue, onChange: this.onChange }}
        dataTreePath={dataTreePath}
        expected={expected}
        evaluatedValue={evaluatedValue}
        meta={{
          error: isValid ? "" : validationMessage,
          touched: true,
        }}
        size={EditorSize.EXTENDED}
        mode={EditorModes.TEXT_WITH_BINDING}
        tabBehaviour={TabBehaviour.INDENT}
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
