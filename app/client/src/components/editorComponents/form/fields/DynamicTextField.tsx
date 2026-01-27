import React from "react";
import type { BaseFieldProps } from "redux-form";
import { Field } from "redux-form";
import type { EditorStyleProps } from "components/editorComponents/CodeEditor";
import type {
  CodeEditorBorder,
  TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { isSqlMode } from "components/editorComponents/CodeEditor/sql/config";

class DynamicTextField extends React.Component<
  BaseFieldProps &
    EditorStyleProps & {
      size?: EditorSize;
      tabBehaviour?: TabBehaviour;
      mode?: TEditorModes;
      theme?: EditorTheme;
      hoverInteraction?: boolean;
      border?: CodeEditorBorder;
      showLightningMenu?: boolean;
      height?: string;
      disabled?: boolean;
      evaluatedPopUpLabel?: string;
    }
> {
  render() {
    const isSQLMode =
      this.props.mode !== undefined && isSqlMode(this.props.mode);
    const editorProps = {
      mode: this.props.mode || EditorModes.TEXT_WITH_BINDING,
      tabBehaviour: this.props.tabBehaviour || TabBehaviour.INPUT,
      theme: this.props.theme || EditorTheme.LIGHT,
      size: this.props.size || EditorSize.COMPACT,
      AIAssisted: isSQLMode,
    };

    return (
      <Field component={LazyCodeEditor} {...this.props} {...editorProps} />
    );
  }
}

export default DynamicTextField;
