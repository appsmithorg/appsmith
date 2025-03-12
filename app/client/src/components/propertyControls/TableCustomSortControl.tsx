import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { StyledDynamicInput } from "./StyledControls";
import type {
  CodeEditorExpected,
  EditorProps,
} from "components/editorComponents/CodeEditor";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import { isString } from "utils/helpers";
import { JSToString, stringToJS } from "./utils";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { bindingHintHelper } from "components/editorComponents/CodeEditor/hintHelpers";
import { slashCommandHintHelper } from "components/editorComponents/CodeEditor/commandsHelper";
import { CollapseContext } from "pages/Editor/PropertyPane/PropertySection";

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

interface InputTextProp {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  evaluatedValue?: unknown;
  expected?: CodeEditorExpected;
  placeholder?: string;
  dataTreePath?: string;
  additionalDynamicData: AdditionalDynamicDataTree;
  theme: EditorTheme;
  height?: string | number;
  maxHeight?: string | number;
  isEditorHidden?: boolean;
}

function InputText(props: InputTextProp) {
  const {
    additionalDynamicData,
    dataTreePath,
    evaluatedValue,
    expected,
    height,
    isEditorHidden,
    maxHeight,
    onChange,
    placeholder,
    theme,
    value,
  } = props;

  return (
    <StyledDynamicInput>
      <LazyCodeEditor
        AIAssisted
        additionalDynamicData={additionalDynamicData}
        border={CodeEditorBorder.ALL_SIDE}
        dataTreePath={dataTreePath}
        evaluatedValue={evaluatedValue}
        expected={expected}
        height={height as EditorProps["height"]}
        hinting={[bindingHintHelper, slashCommandHintHelper]}
        hoverInteraction
        input={{
          value: value,
          onChange: onChange,
        }}
        isEditorHidden={isEditorHidden}
        maxHeight={maxHeight as EditorProps["maxHeight"]}
        mode={EditorModes.TEXT_WITH_BINDING}
        placeholder={placeholder}
        positionCursorInsideBinding
        promptMessage={
          <PromptMessage>
            Access data using{" "}
            <span className="code-wrapper">
              <CurlyBraces>{"{{"}</CurlyBraces>
              originalTableData, computedTableData, column, order
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

class TableCustomSortControl extends BaseControl<TableCustomSortControlProps> {
  static contextType = CollapseContext;
  context!: React.ContextType<typeof CollapseContext>;

  static getTableCustomSortBinding = (
    tableName: string,
    stringToEvaluate: string,
  ) => {
    return `{{(() => {
    try {
      const tableData = ${tableName}.tableData || [];
      const filteredTableData = ${tableName}.filteredTableData || [];
      if(filteredTableData.length > 0 && ${stringToEvaluate}) {
        const sortedTableData = ((originalTableData, computedTableData, column, order) => (${stringToEvaluate}))(tableData, filteredTableData, ${tableName}.sortOrder.column, ${tableName}.sortOrder.order);
        return Array.isArray(sortedTableData) && sortedTableData.length > 0 ? sortedTableData : filteredTableData;
      }
      return filteredTableData;
    } catch (e) {
      return filteredTableData;
    }
    })()}}`;
  };

  render() {
    const {
      controlConfig,
      dataTreePath,
      defaultValue,
      expected,
      label,
      placeholderText,
      propertyValue,
      theme,
    } = this.props;

    // subscribing to context to help re-render component on Property section open or close
    const isOpen = this.context;

    const value =
      propertyValue && isDynamicValue(propertyValue)
        ? TableCustomSortControl.getInputComputedValue(propertyValue)
        : propertyValue
          ? propertyValue
          : defaultValue;
    const evaluatedProperties = this.props.widgetProperties;

    const columns: Record<string, ColumnProperties> =
      evaluatedProperties.primaryColumns || {};
    const currentRow: Record<string, unknown> = {};

    Object.values(columns).forEach((column) => {
      currentRow[column.alias || column.originalId] = undefined;
    });

    // Load default value in evaluated value
    if (value && !propertyValue) {
      this.onTextChange(value);
    }

    return (
      <InputText
        additionalDynamicData={{
          originalTableData: {} as Record<string, unknown>,
          computedTableData: {} as Record<string, unknown>,
          column: {} as Record<string, unknown>,
          order: {} as Record<string, unknown>,
        }}
        dataTreePath={dataTreePath}
        expected={expected}
        height={controlConfig?.height as EditorProps["height"]}
        isEditorHidden={!isOpen}
        label={label}
        maxHeight={controlConfig?.maxHeight as EditorProps["maxHeight"]}
        onChange={this.onTextChange}
        placeholder={placeholderText}
        theme={theme || EditorTheme.LIGHT}
        value={value}
      />
    );
  }

  static getInputComputedValue = (propertyValue: string) => {
    const MAP_FUNCTION_SIGNATURE =
      "(originalTableData, computedTableData, column, order) => (";

    if (!propertyValue.includes(MAP_FUNCTION_SIGNATURE)) {
      return propertyValue;
    }

    /** The binding will look like:
     * {{(() => {
     *   try {
     *     const tableData = Table1.tableData || [];
     *     const filteredTableData = Table1.filteredTableData || [];
     *     if(filteredTableData.length > 0 && EXPRESSION_HERE) {
     *       const sortedTableData = ((originalTableData, computedTableData, column, order) => (EXPRESSION_HERE))(tableData, filteredTableData, Table1.sortOrder.column, Table1.sortOrder.order);
     *       return Array.isArray(sortedTableData) && sortedTableData.length > 0 ? sortedTableData : filteredTableData;
     *     }
     *     return filteredTableData;
     *   } catch (e) {
     *     return filteredTableData;
     *   }
     * })()}}
     * */

    try {
      const mapSignatureIndex = propertyValue.indexOf(MAP_FUNCTION_SIGNATURE);

      if (mapSignatureIndex === -1) return propertyValue;

      const computationStart =
        mapSignatureIndex + MAP_FUNCTION_SIGNATURE.length;
      const computationEnd = propertyValue.lastIndexOf("))");

      if (computationEnd === -1) return propertyValue;

      // Extract the computation expression
      const computationExpression = propertyValue.substring(
        computationStart,
        computationEnd,
      );

      return JSToString(computationExpression);
    } catch (e) {
      return propertyValue;
    }
  };

  getComputedValue = (value: string, tableName: string) => {
    if (
      !isDynamicValue(value) &&
      !this.props.additionalControlData?.isArrayValue
    ) {
      return value;
    }

    const stringToEvaluate = stringToJS(value);

    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return TableCustomSortControl.getTableCustomSortBinding(
      tableName,
      stringToEvaluate,
    );
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
    return "TABLE_CUSTOM_SORT";
  }
}

export interface TableCustomSortControlProps extends ControlProps {
  defaultValue?: string;
  placeholderText?: string;
  controlConfig?: {
    height?: string | number;
    maxHeight?: string | number;
  };
}

export default TableCustomSortControl;
