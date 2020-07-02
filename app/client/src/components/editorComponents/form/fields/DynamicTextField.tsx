import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import CodeEditor, {
  EditorStyleProps,
} from "components/editorComponents/CodeEditor";
import {
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
    }
> {
  render() {
    const editorProps = {
      mode: this.props.mode || EditorModes.TEXT_WITH_BINDING,
      tabBehaviour: this.props.tabBehaviour || TabBehaviour.INPUT,
      theme: EditorTheme.LIGHT,
      size: this.props.size || EditorSize.COMPACT,
    };
    return <Field component={CodeEditor} {...this.props} {...editorProps} />;
  }
}

export default DynamicTextField;
