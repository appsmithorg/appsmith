import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import { ControlWrapper } from "./StyledControls";
import CodeEditor from "components/editorComponents/CodeEditor";
class CodeEditorControl extends BaseControl<ControlProps> {
  render() {
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        <CodeEditor
          language={"json"}
          height={200}
          input={{ value: this.props.propertyValue, onChange: this.onChange }}
          lineNumbers={"off"}
          glyphMargin={false}
          folding={false}
          lineDecorationsWidth={0}
          lineNumbersMinChars={0}
          theme={"DARK"}
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
