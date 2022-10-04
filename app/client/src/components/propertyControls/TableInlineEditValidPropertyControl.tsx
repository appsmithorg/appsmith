import React from "react";
import { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import {
  ORIGINAL_INDEX_KEY,
  PRIMARY_COLUMN_KEY_VALUE,
} from "widgets/TableWidgetV2/constants";
import TableInlineEditValidationControlProperty, {
  CurlyBraces,
  InputText,
} from "./TableInlineEditValidationControl";

class TableInlineEditValidPropertyControl extends TableInlineEditValidationControlProperty {
  bindingPrefix = `{{
    (
      (editedValue, currentRow, currentIndex, isNewRow) => (
  `;

  getBindingSuffix(tableId: string) {
    const columnName = this.getColumnName();
    return `
      ))
      (
        (${tableId}.addNewRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
        ${tableId}.addNewRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.index] ||
          Object.keys(${tableId}.processedTableData[0])
            .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
            .reduce((prev, curr) => {
              prev[curr] = "";
              return prev;
            }, {})),
        ${tableId}.addNewRowInProgress ? -1 : ${tableId}.editableCell.index,
        ${tableId}.addNewRowInProgress
      )
    }}
    `;
  }

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
          <>
            Access the current cell using <CurlyBraces>{"{{"}</CurlyBraces>
            currentRow.columnName
            <CurlyBraces>{"}}"}</CurlyBraces>
          </>
        }
        theme={theme}
        value={value}
      />
    );
  }

  static getControlType() {
    return "TABLE_INLINE_EDIT_VALID_PROPERTY_CONTROL";
  }
}

export default TableInlineEditValidPropertyControl;
