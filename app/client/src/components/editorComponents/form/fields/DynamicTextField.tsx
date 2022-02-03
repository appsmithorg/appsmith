import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import CodeEditor, {
  EditorStyleProps,
} from "components/editorComponents/CodeEditor";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";

class DynamicTextField extends React.Component<
  BaseFieldProps &
    EditorStyleProps & {
      size?: EditorSize;
      tabBehaviour?: TabBehaviour;
      mode?: EditorModes;
      theme?: EditorTheme;
      hoverInteraction?: boolean;
      border?: CodeEditorBorder;
      showLightningMenu?: boolean;
      height?: string;
      disabled?: boolean;
    }
> {
  render() {
    const editorProps = {
      mode: this.props.mode || EditorModes.TEXT_WITH_BINDING,
      tabBehaviour: this.props.tabBehaviour || TabBehaviour.INPUT,
      theme: this.props.theme || EditorTheme.LIGHT,
      size: this.props.size || EditorSize.COMPACT,
    };

    return <Field component={CodeEditor} {...this.props} {...editorProps} />;
  }
}

export default DynamicTextField;
