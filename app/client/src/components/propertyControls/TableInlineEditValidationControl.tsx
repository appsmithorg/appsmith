import React from "react";
import type { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
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
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import { isString } from "utils/helpers";
import { JSToString, stringToJS } from "./utils";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import {
  ORIGINAL_INDEX_KEY,
  PRIMARY_COLUMN_KEY_VALUE,
} from "widgets/TableWidgetV2/constants";
import {
  createMessage,
  TABLE_WIDGET_VALIDATION_ASSIST_PROMPT,
} from "ee/constants/messages";
import { bindingHintHelper } from "components/editorComponents/CodeEditor/hintHelpers";
import { slashCommandHintHelper } from "components/editorComponents/CodeEditor/commandsHelper";

export const PromptMessage = styled.span`
  line-height: 17px;

  > .code-wrapper {
    font-family: var(--ads-v2-font-family-code);
    display: inline-flex;
    align-items: center;
  }
`;

export const StyledCode = styled.span`
  color: var(--ads-v2-color-fg-brand);
`;

export const CurlyBraces = styled.span`
  color: var(--ads-v2-color-fg-brand);
  border-radius: 2px;
  padding: 2px;
  margin: 0 2px 0 0;
  font-size: 10px;
  font-weight: var(--ads-v2-font-weight-bold);
`;

interface InputTextProp {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluatedValue?: any;
  expected?: CodeEditorExpected;
  placeholder?: string;
  dataTreePath?: string;
  additionalDynamicData: AdditionalDynamicDataTree;
  theme: EditorTheme;
  promptMessage?: JSX.Element;
}

export function InputText(props: InputTextProp) {
  const {
    additionalDynamicData,
    dataTreePath,
    evaluatedValue,
    expected,
    onChange,
    placeholder,
    promptMessage,
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
        promptMessage={<PromptMessage>{promptMessage}</PromptMessage>}
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={theme}
      />
    </StyledDynamicInput>
  );
}

const bindingPrefix = `{{
  (
    (isNewRow, currentIndex, currentRow) => (
`;

const getBindingSuffix = (tableId: string) => {
  return `
    ))
    (
      ${tableId}.isAddRowInProgress,
      ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.${ORIGINAL_INDEX_KEY}] ||
        Object.keys(${tableId}.processedTableData[0])
          .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
          .reduce((prev, curr) => {
            prev[curr] = "";
            return prev;
          }, {}))
    )
  }}
  `;
};

class TableInlineEditValidationControl extends BaseControl<TableInlineEditValidationControlProps> {
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentRow: { [key: string]: any } = {};

    Object.values(columns).forEach((column) => {
      currentRow[column.alias || column.originalId] = undefined;
    });

    // Load default value in evaluated value
    if (value && !propertyValue) {
      this.onTextChange(value);
    }

    const additionalDynamicData = {
      isNewRow: false,
      currentIndex: -1,
      currentRow,
    };

    return (
      <InputText
        additionalDynamicData={additionalDynamicData}
        dataTreePath={dataTreePath}
        expected={expected}
        label={label}
        onChange={this.onTextChange}
        promptMessage={
          <PromptMessage>
            {createMessage(TABLE_WIDGET_VALIDATION_ASSIST_PROMPT)}
            <span className="code-wrapper">
              <CurlyBraces>{"{{"}</CurlyBraces>
              <StyledCode>currentRow.columnName</StyledCode>
              <CurlyBraces>{"}}"}</CurlyBraces>
            </span>
          </PromptMessage>
        }
        theme={theme}
        value={value}
      />
    );
  }

  getInputComputedValue = (propertyValue: string, tableId: string) => {
    let value;

    if (propertyValue.indexOf(bindingPrefix) === 0) {
      value = `${propertyValue.substring(
        bindingPrefix.length,
        propertyValue.length - getBindingSuffix(tableId).length,
      )}`;
    } else {
      value = propertyValue;
    }

    const stringValue = JSToString(value);

    return stringValue;
  };

  getComputedValue = (value: string, tableId: string) => {
    if (!isDynamicValue(value)) {
      return value;
    }

    const stringToEvaluate = stringToJS(value);

    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return `${bindingPrefix}${stringToEvaluate}${getBindingSuffix(tableId)}`;
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
    return "TABLE_INLINE_EDIT_VALIDATION_CONTROL";
  }
}

export interface TableInlineEditValidationControlProps extends ControlProps {
  defaultValue?: string;
}

export default TableInlineEditValidationControl;
