import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import DynamicAutocompleteInput, {
  EditorStyleProps,
} from "components/editorComponents/CodeEditor/DynamicAutocompleteInput";
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
    return (
      <Field
        component={DynamicAutocompleteInput}
        {...this.props}
        {...editorProps}
      />
    );
  }
}

export default DynamicTextField;
