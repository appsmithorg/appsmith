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
import type { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import { isString } from "utils/helpers";
import { JSToString, stringToJS } from "./utils";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
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
}

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
      <LazyCodeEditor
        AIAssisted
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

class ComputeTablePropertyControlV2 extends BaseControl<ComputeTablePropertyControlPropsV2> {
  static getBindingPrefix = (tableName: string) => {
    return `{{(() => { const tableData = ${tableName}.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (`;
  };

  static getBindingSuffix = (stringToEvaluate: string) => {
    return `)) : ${stringToEvaluate} })()}}`;
  };

  render() {
    const {
      dataTreePath,
      defaultValue,
      expected,
      label,
      propertyValue,
      theme,
    } = this.props;
    const value =
      propertyValue && isDynamicValue(propertyValue)
        ? ComputeTablePropertyControlV2.getInputComputedValue(propertyValue)
        : propertyValue
          ? propertyValue
          : defaultValue;
    const evaluatedProperties = this.props.widgetProperties;

    const columns: Record<string, ColumnProperties> =
      evaluatedProperties.primaryColumns || {};
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

    return (
      <InputText
        additionalDynamicData={{
          currentRow,
          currentIndex: -1,
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

  static getInputComputedValue = (propertyValue: string) => {
    // First find the starting point after the map function
    const mapStart = propertyValue.indexOf(
      "map((currentRow, currentIndex) => (",
    );

    if (mapStart === -1) return propertyValue;

    // Find the position after the map opening parenthesis
    const valueStart = mapStart + "map((currentRow, currentIndex) => (".length;

    // Find the first closing parenthesis after the map
    const valueEnd = propertyValue.indexOf("))", valueStart);

    if (valueEnd === -1) return propertyValue;

    // Extract the value between the map parentheses
    const evaluateString = propertyValue.substring(valueStart, valueEnd);

    return JSToString(evaluateString);
  };

  getComputedValue = (value: string, tableName: string) => {
    // Return the value if it's not dynamic and not an array
    if (this.shouldReturnValueDirectly(value)) {
      return value;
    }

    // Convert string to JavaScript expression
    const stringToEvaluate = stringToJS(value);

    // Return empty if the evaluated string is empty
    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return this.buildTableSpecificBinding(stringToEvaluate, tableName);
  };

  shouldReturnValueDirectly = (value: string) => {
    return (
      !isDynamicValue(value) && !this.props.additionalControlData?.isArrayValue
    );
  };

  buildTableSpecificBinding = (stringToEvaluate: string, tableName: string) => {
    return `{{(() => { 
      const tableData = ${tableName}.processedTableData || []; 
      return tableData.length > 0 ? 
        tableData.map((currentRow, currentIndex) => (${stringToEvaluate})) : 
        ${stringToEvaluate}
    })()}}`;
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
    return "TABLE_COMPUTE_VALUE";
  }
}

export interface ComputeTablePropertyControlPropsV2 extends ControlProps {
  defaultValue?: string;
}

export default ComputeTablePropertyControlV2;
