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
  static getTableComputeBinding = (
    tableName: string,
    stringToEvaluate: string,
  ) => {
    return `{{(() => { const tableData = ${tableName}.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (${stringToEvaluate})) : ${stringToEvaluate} })()}}`;
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
    const MAP_FUNCTION_SIGNATURE = "map((currentRow, currentIndex) => (";

    const isComputedValue = propertyValue.includes(MAP_FUNCTION_SIGNATURE);

    if (!isComputedValue) return propertyValue;

    // Extract the computation logic from the full binding string
    // Input example: "{{(() => { const tableData = Table1.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (currentRow.price * 2)) : currentRow.price * 2 })()}}"
    const mapSignatureIndex = propertyValue.indexOf(MAP_FUNCTION_SIGNATURE);

    // Find the actual computation expression between the map parentheses
    const computationStart = mapSignatureIndex + MAP_FUNCTION_SIGNATURE.length;

    // Handle nested parentheses to find the correct closing parenthesis
    let openParenCount = 1; // Start with 1 for the opening parenthesis in "=> ("
    let computationEnd = computationStart;

    for (let i = computationStart; i < propertyValue.length; i++) {
      if (propertyValue[i] === "(") {
        openParenCount++;
      } else if (propertyValue[i] === ")") {
        openParenCount--;

        if (openParenCount === 0) {
          computationEnd = i;
          break;
        }
      }
    }

    // Extract the computation expression between the map parentheses
    const computationExpression = propertyValue.substring(
      computationStart,
      computationEnd,
    );

    return JSToString(computationExpression);
  };

  getComputedValue = (value: string, tableName: string) => {
    // Return raw value if:
    // 1. The value is not a dynamic binding (not wrapped in {{...}})
    // 2. AND this control is not configured to handle array values via additionalControlData
    // This allows single values to be returned without table binding computation
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

    return ComputeTablePropertyControlV2.getTableComputeBinding(
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
    return "TABLE_COMPUTE_VALUE";
  }
}

export interface ComputeTablePropertyControlPropsV2 extends ControlProps {
  defaultValue?: string;
}

export default ComputeTablePropertyControlV2;
