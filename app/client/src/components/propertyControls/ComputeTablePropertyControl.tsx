import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { StyledDynamicInput } from "./StyledControls";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { ColumnProperties } from "widgets/TableWidget/component/Constants";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import { isString } from "utils/helpers";
import { JSToString, stringToJS } from "./utils";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { bindingHintHelper } from "components/editorComponents/CodeEditor/hintHelpers";
import { slashCommandHintHelper } from "components/editorComponents/CodeEditor/commandsHelper";

const PromptMessage = styled.span`
  line-height: 17px;

  > .code-wrapper {
    font-family: var(--ads-v2-font-family-code);
    display: inline-flex;
    align-items: center;
  }
`;
const CurlyBraces = styled.span`
  color: var(--ads-v2-color-fg);
  background-color: var(--ads-v2-color-bg-muted);
  border-radius: 2px;
  padding: 2px;
  margin: 0 2px 0 0;
  font-size: 10px;
  font-weight: var(--ads-v2-font-weight-bold);
`;

export function InputText(props: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluatedValue?: any;
  expected?: CodeEditorExpected;
  placeholder?: string;
  dataTreePath?: string;
  additionalDynamicData: Record<string, Record<string, unknown>>;
  theme: EditorTheme;
}) {
  const {
    additionalDynamicData,
    dataTreePath,
    evaluatedValue,
    expected,
    onChange,
    placeholder,
    theme,
    value,
  } = props;

  return (
    <StyledDynamicInput>
      <LazyCodeEditor
        additionalDynamicData={additionalDynamicData}
        dataTreePath={dataTreePath}
        evaluatedValue={evaluatedValue}
        expected={expected}
        hinting={[bindingHintHelper, slashCommandHintHelper]}
        input={{
          value: value,
          onChange: onChange,
        }}
        mode={EditorModes.TEXT_WITH_BINDING}
        placeholder={placeholder}
        positionCursorInsideBinding
        promptMessage={
          <PromptMessage>
            Access the current cell using{" "}
            <span className="code-wrapper">
              <CurlyBraces>{"{{"}</CurlyBraces>
              currentRow.columnName
              <CurlyBraces>{"}}"}</CurlyBraces>
            </span>
          </PromptMessage>
        }
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={theme}
      />
    </StyledDynamicInput>
  );
}

class ComputeTablePropertyControl extends BaseControl<ComputeTablePropertyControlProps> {
  render() {
    const {
      dataTreePath,
      defaultValue,
      expected,
      label,
      propertyValue,
      theme,
    } = this.props;
    const tableId = this.props.widgetProperties.widgetName;
    const value =
      propertyValue && isDynamicValue(propertyValue)
        ? ComputeTablePropertyControl.getInputComputedValue(
            propertyValue,
            tableId,
          )
        : propertyValue
          ? propertyValue
          : defaultValue;
    const evaluatedProperties = this.props.widgetProperties;

    const columns: Record<string, ColumnProperties> =
      evaluatedProperties.primaryColumns || {};
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentRow: { [key: string]: any } = {};

    Object.keys(columns).forEach((id: string) => {
      currentRow[id] = undefined;
    });

    // Load default value in evaluated value
    if (value && !propertyValue) {
      this.onTextChange(value);
    }

    return (
      <InputText
        additionalDynamicData={{
          currentRow,
        }}
        dataTreePath={dataTreePath}
        expected={expected}
        label={label}
        onChange={this.onTextChange}
        theme={theme}
        value={value}
      />
    );
  }

  static getInputComputedValue = (propertyValue: string, tableId: string) => {
    const value = `${propertyValue.substring(
      `{{${tableId}.sanitizedTableData.map((currentRow) => ( `.length,
      propertyValue.length - 4,
    )}`;
    const stringValue = JSToString(value);

    return stringValue;
  };

  getComputedValue = (value: string, tableId: string) => {
    const stringToEvaluate = stringToJS(value);

    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return `{{${tableId}.sanitizedTableData.map((currentRow) => ( ${stringToEvaluate}))}}`;
  };

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = "";

    if (typeof event !== "string") {
      value = event.target?.value;
    } else {
      value = event;
    }

    if (isString(value)) {
      const output = this.getComputedValue(
        value,
        this.props.widgetProperties.widgetName,
      );

      this.updateProperty(this.props.propertyName, output);
    } else {
      this.updateProperty(this.props.propertyName, value);
    }
  };

  static getControlType() {
    return "COMPUTE_VALUE";
  }
}

export interface ComputeTablePropertyControlProps extends ControlProps {
  defaultValue?: string;
}

export default ComputeTablePropertyControl;
