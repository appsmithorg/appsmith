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
import type { WidgetProps } from "widgets/BaseWidget";

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
      <LazyCodeEditor
        AIAssisted
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

class WrappedCodeEditorControl extends BaseControl<WrappedCodeEditorControlProps> {
  wrapperCode: {
    prefix: string;
    suffix: string;
  };

  constructor(props: WrappedCodeEditorControlProps) {
    super(props);

    this.wrapperCode = {
      prefix:
        typeof props.controlConfig.wrapperCode.prefix === "function"
          ? props.controlConfig.wrapperCode.prefix(props.widgetProperties)
          : props.controlConfig.wrapperCode.prefix,
      suffix:
        typeof props.controlConfig.wrapperCode.suffix === "function"
          ? props.controlConfig.wrapperCode.suffix(props.widgetProperties)
          : props.controlConfig.wrapperCode.suffix,
    };
  }

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
        ? this.getInputComputedValue(propertyValue)
        : propertyValue
        ? propertyValue
        : defaultValue;
    const evaluatedProperties = this.props.widgetProperties;

    const columns: Record<string, ColumnProperties> =
      evaluatedProperties.primaryColumns || {};
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

  getInputComputedValue = (propertyValue: string) => {
    const bindingPrefix = this.wrapperCode.prefix;

    if (propertyValue.includes(bindingPrefix)) {
      const value = `${propertyValue.substring(
        bindingPrefix.length,
        propertyValue.length - this.wrapperCode.suffix.length,
      )}`;
      return JSToString(value);
    } else {
      return propertyValue;
    }
  };

  getComputedValue = (value: string) => {
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

    return `${this.wrapperCode.prefix}${stringToEvaluate}${this.wrapperCode.suffix}`;
  };

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = "";

    if (typeof event !== "string") {
      value = event.target?.value;
    } else {
      value = event;
    }

    if (isString(value)) {
      const output = this.getComputedValue(value);

      this.updateProperty(this.props.propertyName, output);
    } else {
      this.updateProperty(this.props.propertyName, value);
    }
  };

  static getControlType() {
    return "WRAPPED_CODE_EDITOR";
  }
}

export interface WrappedCodeEditorControlProps extends ControlProps {
  controlConfig: {
    wrapperCode: {
      prefix: string | ((widget: WidgetProps) => string);
      suffix: string | ((widget: WidgetProps) => string);
    };
  };
}

export default WrappedCodeEditorControl;
