import React, { useMemo } from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
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
import { PopoutEditor } from "components/editorComponents/CodeEditor/PopoutEditor";
import { useBoolean } from "usehooks-ts";
import { Flex } from "@appsmith/ads";

const HINT_HELPERS = [bindingHintHelper, slashCommandHintHelper];

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
  widgetName?: string;
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
    theme = EditorTheme.LIGHT,
    value,
    widgetName,
  } = props;

  const {
    setFalse: handlePopOutEditorClose,
    setTrue: handlePopOutEditorOpen,
    value: isPopoutOpen,
  } = useBoolean(false);

  const inputProps = useMemo(() => {
    return {
      value: value,
      onChange: onChange,
    };
  }, [onChange, value]);

  return (
    <div className="relative">
      {isPopoutOpen ? (
        <Flex
          alignItems="center"
          bg="var(--ads-v2-color-bg)"
          border="1px solid var(--ads-v2-color-border)"
          borderRadius="var(--ads-v2-border-radius)"
          h="36px"
          justifyContent="center"
          w="100%"
        />
      ) : (
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
            hinting={HINT_HELPERS}
            hoverInteraction
            input={inputProps}
            isEditorHidden={isEditorHidden}
            mode={EditorModes.TEXT_WITH_BINDING}
            onEditorBlur={onBlur}
            onEditorFocus={onFocus}
            onExpandTriggerClick={handlePopOutEditorOpen}
            placeholder={placeholder}
            positionCursorInsideBinding
            showExpandTrigger
            size={EditorSize.EXTENDED}
            tabBehaviour={TabBehaviour.INDENT}
            theme={theme}
          />
        </StyledDynamicInput>
      )}
      {isPopoutOpen && (
        <PopoutEditor
          {...props}
          label={label}
          onChange={onChange}
          onClose={handlePopOutEditorClose}
          theme={theme}
          value={value}
          widgetName={widgetName}
        />
      )}
    </div>
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  static contextType = CollapseContext;
  context!: React.ContextType<typeof CollapseContext>;

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
      widgetProperties: { widgetName },
    } = this.props;

    //subscribing to context to help re-render component on Property section open or close
    const isOpen = this.context;

    return (
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
        widgetName={widgetName}
      />
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
