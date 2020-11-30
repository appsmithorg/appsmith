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
import { ColumnProperties } from "widgets/TableWidget";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";

const CurlyBraces = styled.span`
  color: white;
  background-color: #f3672a;
  border-radius: 2px;
  padding: 2px;
  margin: 0px 2px;
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
        theme={EditorTheme.DARK}
        mode={EditorModes.TEXT_WITH_BINDING}
        tabBehaviour={TabBehaviour.INDENT}
        size={EditorSize.EXTENDED}
        placeholder={placeholder}
        additionalDynamicData={additionalDynamicData}
        promptMessage={
          <React.Fragment>
            Use <CurlyBraces>{"{{"}</CurlyBraces>currentRow.columnIdentifier
            <CurlyBraces>{"}}"}</CurlyBraces> to access any column in the table
          </React.Fragment>
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
    } = this.props;
    const widgetId = this.props.widgetProperties.widgetName;
    const value =
      propertyValue &&
      propertyValue.includes(`{{${widgetId}.tableData.map((currentRow) => `)
        ? this.getInputComputedValue(
            `${propertyValue.substring(
              `{{${widgetId}.tableData.map((currentRow) => `.length,
              propertyValue.length - 3,
            )}`,
            widgetId,
          )
        : propertyValue
        ? propertyValue
        : defaultValue;
    const evaluatedProperties = this.props.widgetProperties;

    const columns: ColumnProperties[] =
      evaluatedProperties.primaryColumns || [];
    const currentRow: { [key: string]: any } = {};
    for (let i = 0; i < columns.length; i++) {
      currentRow[columns[i].id] = undefined;
    }
    return (
      <InputText
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

  getInputComputedValue = (value: string, tableId: string) => {
    const regex = /(\(currentRow.[\w\d]*\))/g;
    const args = [...value.matchAll(regex)];
    let output = value;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i][0];
      const trimmedValue = "{{" + arg.substring(1, arg.length - 1) + "}}";
      output = output.replace(arg, trimmedValue);
    }
    return output;
  };

  getComputedValue = (value: string, tableId: string) => {
    const regex = /({{currentRow.[\w\d]*}})/g;
    const args = [...value.matchAll(regex)];
    let output = value;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i][0];
      const trimmedValue = "(" + arg.substring(2, arg.length - 2) + ")";
      output = output.replace(arg, trimmedValue);
    }
    if (args.length) {
      return `{{${tableId}.tableData.map((currentRow) => ${output})}}`;
    }
    return output;
  };

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = "";
    if (typeof event !== "string") {
      value = event.target.value;
    } else {
      value = event;
    }
    if (value && isDynamicValue(value)) {
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
