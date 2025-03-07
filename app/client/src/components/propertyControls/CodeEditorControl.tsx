import type { ChangeEvent } from "react";
import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { EventOrValueHandler } from "redux-form";
import {
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { bindingHintHelper } from "components/editorComponents/CodeEditor/hintHelpers";
import { slashCommandHintHelper } from "components/editorComponents/CodeEditor/commandsHelper";
import type { EditorProps } from "components/editorComponents/CodeEditor";
import { PopoutEditor } from "components/editorComponents/CodeEditor/PopoutEditor/PopoutEditor";
import { Flex } from "@appsmith/ads";

class CodeEditorControl extends BaseControl<ControlProps> {
  state = {
    popOutVisible: false,
  };

  onExpanded = () => {
    this.setState({ popOutVisible: true });
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
        {this.state.popOutVisible ? (
          <Flex
            alignItems="center"
            bg="var(--ads-v2-color-black-400)"
            border="1px solid var(--ads-v2-color-border)"
            borderRadius="var(--ads-v2-border-radius)"
            h="36px"
            justifyContent="center"
            w="100%"
          >
            <p className="text-sm font-medium">Expanded</p>
          </Flex>
        ) : (
          <LazyCodeEditor
            additionalDynamicData={this.props.additionalAutoComplete}
            hinting={[bindingHintHelper, slashCommandHintHelper]}
            input={{ value: propertyValue, onChange: this.onChange }}
            isExpanded={this.state.popOutVisible}
            maxHeight={controlConfig?.maxHeight as EditorProps["maxHeight"]}
            mode={EditorModes.TEXT_WITH_BINDING}
            onExpandTriggerClick={this.onExpanded}
            positionCursorInsideBinding
            showExpandTrigger
            showLightningMenu={false}
            size={EditorSize.EXTENDED}
            tabBehaviour={TabBehaviour.INDENT}
            theme={this.props.theme}
            useValidationMessage={useValidationMessage}
            {...props}
            AIAssisted
          />
        )}
        {this.state.popOutVisible && (
          <PopoutEditor
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
