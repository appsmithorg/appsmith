import React, { useState } from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button } from "@appsmith/ads";
import { StyledDynamicInput } from "./StyledControls";
import type { InputType } from "components/constants";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { CollapseContext } from "pages/Editor/PropertyPane/PropertySection";
import LazyCodeEditor from "../editorComponents/LazyCodeEditor";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import { bindingHintHelper } from "components/editorComponents/CodeEditor/hintHelpers";
import { slashCommandHintHelper } from "components/editorComponents/CodeEditor/commandsHelper";
import PopoutResizableEditor from "./PopoutResizableEditor";

export function InputText(props: {
  label: string;
  value: string;
  onBlur?: () => void;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  onFocus?: () => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluatedValue?: any;
  expected?: CodeEditorExpected;
  placeholder?: string;
  dataTreePath?: string;
  additionalAutocomplete?: AdditionalDynamicDataTree;
  theme?: EditorTheme;
  hideEvaluatedValue?: boolean;
  enableAI?: boolean;
  isEditorHidden?: boolean;
  blockCompletions?: FieldEntityInformation["blockCompletions"];
}) {
  const {
    blockCompletions,
    dataTreePath,
    enableAI = true,
    evaluatedValue,
    expected,
    hideEvaluatedValue,
    isEditorHidden,
    label,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    value,
  } = props;

  return (
    <StyledDynamicInput>
      <LazyCodeEditor
        AIAssisted={enableAI}
        additionalDynamicData={props.additionalAutocomplete}
        blockCompletions={blockCompletions}
        border={CodeEditorBorder.ALL_SIDE}
        dataTreePath={dataTreePath}
        evaluatedPopUpLabel={label}
        evaluatedValue={evaluatedValue}
        expected={expected}
        hideEvaluatedValue={hideEvaluatedValue}
        hinting={[bindingHintHelper, slashCommandHintHelper]}
        hoverInteraction
        input={{
          value: value,
          onChange: onChange,
        }}
        isEditorHidden={isEditorHidden}
        mode={EditorModes.TEXT_WITH_BINDING}
        onEditorBlur={onBlur}
        onEditorFocus={onFocus}
        placeholder={placeholder}
        positionCursorInsideBinding
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={props.theme || EditorTheme.LIGHT}
      />
    </StyledDynamicInput>
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  static contextType = CollapseContext;
  context!: React.ContextType<typeof CollapseContext>;

  state = {
    popOutVisible: false,
  };

  render() {
    const {
      additionalAutoComplete,
      dataTreePath,
      defaultValue,
      expected,
      hideEvaluatedValue,
      label,
      onBlur,
      onFocus,
      placeholderText,
      propertyValue,
    } = this.props;

    //subscribing to context to help re-render component on Property section open or close
    const isOpen = this.context;

    return (
      <div className="relative">
        <div className="flex items-center">
          <div className="flex-grow">
            <InputText
              additionalAutocomplete={additionalAutoComplete}
              dataTreePath={dataTreePath}
              expected={expected}
              hideEvaluatedValue={hideEvaluatedValue}
              isEditorHidden={!isOpen}
              label={label}
              onBlur={onBlur}
              onChange={this.onTextChange}
              onFocus={onFocus}
              placeholder={placeholderText}
              theme={this.props.theme}
              value={propertyValue !== undefined ? propertyValue : defaultValue}
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
            additionalAutocomplete={this.props.additionalAutoComplete}
            dataTreePath={this.props.dataTreePath}
            expected={this.props.expected}
            hideEvaluatedValue={this.props.hideEvaluatedValue}
            label={this.props.propertyName}
            onChange={this.onTextChange}
            onClose={() => this.setState({ popOutVisible: false })}
            theme={this.props.theme || EditorTheme.LIGHT}
            value={
              this.props.propertyValue !== undefined
                ? this.props.propertyValue
                : this.props.defaultValue
            }
            widgetName={this.props.widgetProperties.widgetName}
          />
        )}
      </div>
    );
  }

  isNumberType(): boolean {
    const { inputType } = this.props;

    switch (inputType) {
      case "CURRENCY":
      case "INTEGER":
      case "NUMBER":
      case "PHONE_NUMBER":
        return true;
      default:
        return false;
    }
  }

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = event;

    if (typeof event !== "string") {
      value = event.target.value;
    }

    this.updateProperty(this.props.propertyName, value, true);
  };

  static getControlType() {
    return "INPUT_TEXT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
  inputType: InputType;
  validationMessage?: string;
  isDisabled?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default InputTextControl;
