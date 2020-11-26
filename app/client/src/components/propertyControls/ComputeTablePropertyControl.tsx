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
    const value =
      propertyValue &&
      propertyValue.includes(
        `{{${this.props.widgetProperties.widgetName}.tableData.map((currentRow) => `,
      )
        ? `{{${propertyValue.substring(
            `{{${this.props.widgetProperties.widgetName}.tableData.map((currentRow) => `
              .length,
            propertyValue.length - 3,
          )}}}`
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

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = "";
    if (typeof event !== "string") {
      value = event.target.value;
    } else {
      value = event;
    }
    if (value && isDynamicValue(value)) {
      const trimmedValue = value.substring(2, value.length - 2);
      if (trimmedValue) {
        this.updateProperty(
          this.props.propertyName,
          `{{${this.props.widgetProperties.widgetName}.tableData.map((currentRow) => ${trimmedValue})}}`,
        );
      } else {
        this.updateProperty(this.props.propertyName, "");
      }
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
