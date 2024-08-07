import React from "react";
import type { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import {
  ORIGINAL_INDEX_KEY,
  PRIMARY_COLUMN_KEY_VALUE,
} from "widgets/TableWidgetV2/constants";
import TableInlineEditValidationControlProperty, {
  CurlyBraces,
  StyledCode,
  InputText,
  PromptMessage,
} from "./TableInlineEditValidationControl";
import { isString } from "lodash";
import { JSToString, stringToJS } from "./utils";
import {
  createMessage,
  TABLE_WIDGET_VALIDATION_ASSIST_PROMPT,
} from "ee/constants/messages";

const bindingPrefix = `{{
  (
    (editedValue, currentRow, currentIndex, isNewRow) => (
`;

const getBindingSuffix = (tableId: string, columnName: string) => {
  return `
    ))
    (
      (${tableId}.isAddRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.${ORIGINAL_INDEX_KEY}] ||
        Object.keys(${tableId}.processedTableData[0])
          .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
          .reduce((prev, curr) => {
            prev[curr] = "";
            return prev;
          }, {})),
      ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
      ${tableId}.isAddRowInProgress
    )
  }}
  `;
};
class TableInlineEditValidPropertyControl extends TableInlineEditValidationControlProperty {
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
      currentRow,
      currentIndex: -1,
      editedValue: "",
      isNewRow: false,
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
        propertyValue.length -
          getBindingSuffix(tableId, this.getColumnName()).length,
      )}`;
    } else {
      value = propertyValue;
    }

    return JSToString(value);
  };

  getComputedValue = (value: string, tableId: string) => {
    if (!isDynamicValue(value)) {
      return value;
    }

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
    const value = typeof event !== "string" ? event.target?.value : event;

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
    /*
     * Regex to extract the column name from the property path
     */
    const matchedColumnName = this.props.parentPropertyName.match(
      /primaryColumns\.([^.]+)\.[^.]+\.[^.]+/,
    );

    if (matchedColumnName) {
      return matchedColumnName[1];
    }

    return "";
  };

  static getControlType() {
    return "TABLE_INLINE_EDIT_VALID_PROPERTY_CONTROL";
  }
}

export default TableInlineEditValidPropertyControl;
