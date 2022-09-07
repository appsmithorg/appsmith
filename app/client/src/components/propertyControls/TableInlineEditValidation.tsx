import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDynamicInput } from "./StyledControls";
import CodeEditor, {
  CodeEditorExpected,
} from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import { isString } from "utils/helpers";
import {
  JSToString,
  stringToJS,
} from "components/editorComponents/ActionCreator/Fields";
import { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import {
  ORIGINAL_INDEX_KEY,
  PRIMARY_COLUMN_KEY_VALUE,
} from "widgets/TableWidgetV2/constants";

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

type InputTextProp = {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  evaluatedValue?: any;
  expected?: CodeEditorExpected;
  placeholder?: string;
  dataTreePath?: string;
  additionalDynamicData: AdditionalDynamicDataTree;
  theme: EditorTheme;
};

function InputText(props: InputTextProp) {
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
      <CodeEditor
        additionalDynamicData={additionalDynamicData}
        dataTreePath={dataTreePath}
        evaluatedValue={evaluatedValue}
        expected={expected}
        input={{
          value: value,
          onChange: onChange,
        }}
        mode={EditorModes.TEXT_WITH_BINDING}
        placeholder={placeholder}
        promptMessage={
          <PromptMessage>
            Access the current cell using <CurlyBraces>{"{{"}</CurlyBraces>
            currentRow.columnName
            <CurlyBraces>{"}}"}</CurlyBraces>
          </PromptMessage>
        }
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={theme}
      />
    </StyledDynamicInput>
  );
}

const bindingPrefix = `{{
  (
    (editedValue, currentRow, currentIndex) => (
`;
const getBindingSuffix = (tableId: string, columnName: string) => `
  ))
  (
    ${tableId}.columnEditableCellValue.${columnName} || "",
    ${tableId}.processedTableData[${tableId}.editableCell.index] ||
      Object.keys(${tableId}.processedTableData[0])
        .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
        .reduce((prev, curr) => {
          prev[curr] = "";
          return prev;
        }, {}),
    ${tableId}.editableCell.index)
}}
`;

class TableInlineEditValidationControlProperty extends BaseControl<
  TableInlineEditValidationControlProps
> {
  render() {
    const {
      dataTreePath,
      defaultValue,
      expected,
      label,
      propertyValue,
      theme,
      widgetProperties,
    } = this.props;
    const tableId = widgetProperties.widgetName;
    const value =
      propertyValue && isDynamicValue(propertyValue)
        ? this.getInputComputedValue(propertyValue, tableId)
        : propertyValue || defaultValue;

    const columns: Record<string, ColumnProperties> =
      widgetProperties.primaryColumns || {};
    const currentRow: { [key: string]: any } = {};
    Object.values(columns).forEach((column) => {
      currentRow[column.alias || column.originalId] = undefined;
    });
    // Load default value in evaluated value
    if (value && !propertyValue) {
      this.onTextChange(value);
    }

    const additionalDynamicData = {
      currentRow,
      currentIndex: -1,
      editedValue: "",
    };

    return (
      <InputText
        additionalDynamicData={additionalDynamicData}
        dataTreePath={dataTreePath}
        expected={expected}
        label={label}
        onChange={this.onTextChange}
        theme={theme}
        value={value}
      />
    );
  }

  getInputComputedValue = (propertyValue: string, tableId: string) => {
    const value = `${propertyValue.substring(
      bindingPrefix.length,
      propertyValue.length -
        getBindingSuffix(tableId, this.getColumnName()).length,
    )}`;
    const stringValue = JSToString(value);

    return stringValue;
  };

  getComputedValue = (value: string, tableId: string) => {
    const stringToEvaluate = stringToJS(value);
    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }
    return `${bindingPrefix}${stringToEvaluate}${getBindingSuffix(
      tableId,
      this.getColumnName(),
    )}`;
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

  getColumnName = () => {
    const matchedColumnName = this.props.parentPropertyName.match(
      /primaryColumns\.([^.]+)\.[^.]+\.[^.]+/,
    );

    if (matchedColumnName) {
      return matchedColumnName[1];
    }

    return "";
  };

  static getControlType() {
    return "TABLE_INLINE_EDIT_VALIDATION";
  }
}

export interface TableInlineEditValidationControlProps extends ControlProps {
  defaultValue?: string;
}

export default TableInlineEditValidationControlProperty;
