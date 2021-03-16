import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDynamicInput } from "./StyledControls";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import {
  JSToString,
  stringToJS,
} from "components/editorComponents/ActionCreator";

const PromptMessage = styled.span`
  line-height: 17px;
`;
const CurlyBraces = styled.span`
  color: ${(props) => props.theme.colors.codeMirror.background.hoverState};
  background-color: #ffffff;
  border-radius: 2px;
  padding: 2px;
  margin: 0px 2px;
  font-size: 10px;
`;

export function InputText(props: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  isValid: boolean;
  errorMessage?: string;
  evaluatedValue?: any;
  expected?: string;
  placeholder?: string;
  dataTreePath?: string;
  additionalDynamicData: Record<string, Record<string, unknown>>;
  theme: EditorTheme;
}) {
  const {
    errorMessage,
    expected,
    value,
    isValid,
    onChange,
    placeholder,
    dataTreePath,
    evaluatedValue,
    additionalDynamicData,
    theme,
  } = props;
  return (
    <StyledDynamicInput>
      <CodeEditor
        input={{
          value: value,
          onChange: onChange,
        }}
        evaluatedValue={evaluatedValue}
        expected={expected}
        dataTreePath={dataTreePath}
        meta={{
          error: isValid ? "" : errorMessage,
          touched: true,
        }}
        theme={theme}
        mode={EditorModes.TEXT_WITH_BINDING}
        tabBehaviour={TabBehaviour.INDENT}
        size={EditorSize.EXTENDED}
        placeholder={placeholder}
        additionalDynamicData={additionalDynamicData}
        promptMessage={
          <PromptMessage>
            Access the current cell using <CurlyBraces>{"{{"}</CurlyBraces>
            currentRow.columnName
            <CurlyBraces>{"}}"}</CurlyBraces>
          </PromptMessage>
        }
      />
    </StyledDynamicInput>
  );
}

class ComputeTablePropertyControl extends BaseControl<
  ComputeTablePropertyControlProps
> {
  render() {
    const {
      expected,
      propertyValue,
      isValid,
      label,
      dataTreePath,
      validationMessage,
      defaultValue,
      theme,
    } = this.props;
    const tableId = this.props.widgetProperties.widgetName;
    const value =
      propertyValue && isDynamicValue(propertyValue)
        ? this.getInputComputedValue(propertyValue, tableId)
        : propertyValue
        ? propertyValue
        : defaultValue;
    const evaluatedProperties = this.props.widgetProperties;

    const columns: Record<string, ColumnProperties> =
      evaluatedProperties.primaryColumns || {};
    const currentRow: { [key: string]: any } = {};
    Object.keys(columns).forEach((id: string) => {
      currentRow[id] = undefined;
    });

    return (
      <InputText
        theme={theme}
        label={label}
        value={value}
        onChange={this.onTextChange}
        isValid={isValid}
        errorMessage={validationMessage}
        expected={expected}
        dataTreePath={dataTreePath}
        additionalDynamicData={{
          currentRow,
        }}
      />
    );
  }

  getInputComputedValue = (propertyValue: string, tableId: string) => {
    const value = `${propertyValue.substring(
      `{{${tableId}.sanitizedTableData.map((currentRow) => { return `.length,
      propertyValue.length - 4,
    )}`;
    const stringValue = JSToString(value);

    return stringValue;
  };

  getComputedValue = (value: string, tableId: string) => {
    const stringToEvaluate = stringToJS(value);
    return `{{${tableId}.sanitizedTableData.map((currentRow) => { return ${stringToEvaluate}})}}`;
  };

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = "";
    if (typeof event !== "string") {
      value = event.target.value;
    } else {
      value = event;
    }
    if (value) {
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
