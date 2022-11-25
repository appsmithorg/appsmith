import React, { useContext } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import GeneratePageForm from "components/editorComponents/ChooseTableForm";
import { StyledDynamicInput } from "./StyledControls";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { CollapseContext } from "pages/Editor/PropertyPane/PropertySection";
import CodeEditor from "../editorComponents/LazyCodeEditorWrapper";

export function InputText(props: {
  label: string;
  value: string;
  onBlur?: () => void;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  onFocus?: () => void;
  evaluatedValue?: any;
  expected?: CodeEditorExpected;
  placeholder?: string;
  dataTreePath?: string;
  additionalAutocomplete?: Record<string, Record<string, unknown>>;
  theme?: EditorTheme;
  hideEvaluatedValue?: boolean;
}) {
  const {
    dataTreePath,
    evaluatedValue,
    expected,
    hideEvaluatedValue,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    value,
  } = props;

  //subscribing to context to help re-render component on Property section open or close
  const isOpen = useContext(CollapseContext);

  return (
    <StyledDynamicInput>
      <CodeEditor
        additionalDynamicData={props.additionalAutocomplete}
        border={CodeEditorBorder.ALL_SIDE}
        dataTreePath={dataTreePath}
        evaluatedValue={evaluatedValue}
        expected={expected}
        hideEvaluatedValue={hideEvaluatedValue}
        hoverInteraction
        input={{
          value: value,
          onChange: onChange,
        }}
        isEditorHidden={!isOpen}
        mode={EditorModes.TEXT_WITH_BINDING}
        onEditorBlur={onBlur}
        onEditorFocus={onFocus}
        placeholder={placeholder}
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={props.theme || EditorTheme.LIGHT}
      />
    </StyledDynamicInput>
  );
}

class TableBindingSelectorControl extends BaseControl<ControlProps> {
  constructor(props: ControlProps) {
    super(props);
  }

  render() {
    const {
      additionalAutoComplete,
      dataTreePath,
      defaultValue,
      expected,
      hideEvaluatedValue,
      label,
      propertyValue,
    } = this.props;

    return propertyValue ? (
      <InputText
        additionalAutocomplete={additionalAutoComplete}
        dataTreePath={dataTreePath}
        expected={expected}
        hideEvaluatedValue={hideEvaluatedValue}
        label={label}
        onChange={this.onTextChange}
        theme={this.props.theme}
        value={propertyValue !== undefined ? propertyValue : defaultValue}
      />
    ) : (
      <GeneratePageForm />
    );
  }

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = event;
    if (typeof event !== "string") {
      value = event.target.value;
    }
    this.updateProperty(this.props.propertyName, value, true);
  };

  static getControlType() {
    return "TABLE_BINDING_SELECTOR";
  }
}

export default TableBindingSelectorControl;
