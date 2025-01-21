import type { ChangeEvent } from "react";
import React, { useState } from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { EventOrValueHandler } from "redux-form";
import { Button } from "@appsmith/ads";
import {
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { bindingHintHelper } from "components/editorComponents/CodeEditor/hintHelpers";
import { slashCommandHintHelper } from "components/editorComponents/CodeEditor/commandsHelper";
import type { EditorProps } from "components/editorComponents/CodeEditor";
import PopoutResizableEditor from "./PopoutResizableEditor";

class CodeEditorControl extends BaseControl<ControlProps> {
  state = {
    popOutVisible: false,
  };

  render() {
    const {
      controlConfig,
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
      <div className="relative">
        <div className="flex items-center">
          <div className="flex-grow">
            <LazyCodeEditor
              additionalDynamicData={this.props.additionalAutoComplete}
              hinting={[bindingHintHelper, slashCommandHintHelper]}
              input={{ value: propertyValue, onChange: this.onChange }}
              maxHeight={controlConfig?.maxHeight as EditorProps["maxHeight"]}
              mode={EditorModes.TEXT_WITH_BINDING}
              positionCursorInsideBinding
              size={EditorSize.EXTENDED}
              tabBehaviour={TabBehaviour.INDENT}
              theme={this.props.theme}
              useValidationMessage={useValidationMessage}
              {...props}
              AIAssisted
            />
          </div>
          <Button
            className="ml-1"
            isIconButton
            kind="tertiary"
            onClick={() => this.setState({ popOutVisible: true })}
            size="sm"
            startIcon="expand"
          />
        </div>
        {this.state.popOutVisible && (
          <PopoutResizableEditor
            {...props}
            label={this.props.propertyName}
            onChange={this.onChange}
            onClose={() => this.setState({ popOutVisible: false })}
            theme={this.props.theme}
            value={this.props.propertyValue}
            widgetName={this.props.widgetProperties.widgetName}
          />
        )}
      </div>
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
