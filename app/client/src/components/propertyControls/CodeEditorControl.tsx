import { slashCommandHintHelper } from "components/editorComponents/CodeEditor/commandsHelper";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { bindingHintHelper } from "components/editorComponents/CodeEditor/hintHelpers";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import type { ChangeEvent } from "react";
import React from "react";
import type { EventOrValueHandler } from "redux-form";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";

class CodeEditorControl extends BaseControl<ControlProps> {
  render() {
    const {
      controlConfig,
      dataTreePath,
      disabled,
      evaluatedValue,
      expected,
      propertyValue,
      useValidationMessage,
    } = this.props;

    // PropertyPaneControlConfig's disabled is a function (props: any, propertyPath: string) => boolean
    // while LazyCodeEditor expects a boolean. Convert function to boolean result.
    const isReadOnly =
      typeof disabled === "function"
        ? disabled(this.props.widgetProperties, this.props.propertyName)
        : !!disabled;

    const maxHeight = controlConfig?.maxHeight
      ? String(controlConfig.maxHeight)
      : undefined;

    return (
      <LazyCodeEditor
        additionalDynamicData={this.props.additionalAutoComplete}
        dataTreePath={dataTreePath}
        evaluatedValue={evaluatedValue}
        expected={expected}
        hinting={[bindingHintHelper, slashCommandHintHelper]}
        input={{ value: propertyValue, onChange: this.onChange }}
        isReadOnly={isReadOnly}
        marking={[]}
        maxHeight={maxHeight}
        mode={EditorModes.TEXT_WITH_BINDING}
        positionCursorInsideBinding
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={EditorTheme.LIGHT}
        useValidationMessage={useValidationMessage}
        AIAssisted
      />
    );
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: EventOrValueHandler<ChangeEvent<any>> = (
    value: string | ChangeEvent,
  ) => {
    this.updateProperty(this.props.propertyName, value, true);
  };

  static getControlType() {
    return "CODE_EDITOR";
  }
}

export default CodeEditorControl;
