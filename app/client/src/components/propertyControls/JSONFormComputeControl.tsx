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
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import { isString } from "utils/helpers";
import {
  JSToString,
  stringToJS,
} from "components/editorComponents/ActionCreator/Fields";
import { JSONFormWidgetProps } from "widgets/JSONFormWidget/widget";
import {
  ARRAY_ITEM_KEY,
  DataType,
  FIELD_TYPE_TO_POTENTIAL_DATA,
  getBindingTemplate,
  Schema,
  SchemaItem,
} from "widgets/JSONFormWidget/constants";

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

function processObject(schema: Schema, defaultValue?: any) {
  const obj: Record<string, any> = {};

  Object.values(schema).forEach((schemaItem) => {
    obj[schemaItem.name] = processSchemaItem(schemaItem, defaultValue);
  });

  return obj;
}

function processArray(schema: Schema, defaultValue?: any): any[] {
  if (schema[ARRAY_ITEM_KEY]) {
    return [processSchemaItem(schema[ARRAY_ITEM_KEY], defaultValue)];
  }

  return [];
}

function processSchemaItem(schemaItem: SchemaItem, defaultValue?: any) {
  if (schemaItem.dataType === DataType.OBJECT) {
    return processObject(schemaItem.children, defaultValue);
  }

  if (schemaItem.dataType === DataType.ARRAY) {
    return processArray(schemaItem.children, defaultValue);
  }

  return defaultValue || FIELD_TYPE_TO_POTENTIAL_DATA[schemaItem.fieldType];
}

function generateAutoCompleteStructure(
  schema: Schema,
  defaultValue?: any,
): any {
  let obj;

  if (schema) {
    Object.values(schema).forEach((schemaItem) => {
      obj = processSchemaItem(schemaItem, defaultValue);
    });
  }

  return obj;
}

export function InputText(props: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  evaluatedValue?: any;
  expected?: CodeEditorExpected;
  placeholder?: string;
  dataTreePath?: string;
  additionalDynamicData: Record<string, Record<string, any>>;
  theme: EditorTheme;
}) {
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
            Access the current form using <CurlyBraces>{"{{"}</CurlyBraces>
            sourceData.fieldName
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

class JSONFormComputeControl extends BaseControl<JSONFormComputeControlProps> {
  getInputComputedValue = (propertyValue: string) => {
    const { widgetName } = this.props.widgetProperties;
    const { endTemplate, startTemplate } = getBindingTemplate(widgetName);

    const value = propertyValue.substring(
      startTemplate.length,
      propertyValue.length - endTemplate.length,
    );

    return JSToString(value);
  };

  getComputedValue = (value: string) => {
    const { widgetName } = this.props.widgetProperties;
    const stringToEvaluate = stringToJS(value);
    const { endTemplate, startTemplate } = getBindingTemplate(widgetName);

    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return `${startTemplate}${stringToEvaluate}${endTemplate}`;
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

  render() {
    const {
      dataTreePath,
      defaultValue,
      expected,
      label,
      placeholderText,
      propertyValue,
      theme,
      widgetProperties,
    } = this.props;

    const baseSchemaStructure = generateAutoCompleteStructure(
      widgetProperties.schema,
    );

    const fieldStateStructure = generateAutoCompleteStructure(
      widgetProperties.schema,
      {
        isVisible: true,
        isDisabled: true,
        isRequired: true,
      },
    );

    const value = (() => {
      if (propertyValue && isDynamicValue(propertyValue)) {
        return this.getInputComputedValue(propertyValue);
      }

      return propertyValue || defaultValue;
    })();

    if (value && !propertyValue) {
      this.onTextChange(value);
    }

    return (
      <InputText
        additionalDynamicData={{
          sourceData: baseSchemaStructure,
          data: baseSchemaStructure,
          fieldState: fieldStateStructure,
        }}
        dataTreePath={dataTreePath}
        expected={expected}
        label={label}
        onChange={this.onTextChange}
        placeholder={placeholderText}
        theme={theme}
        value={value}
      />
    );
  }

  static getControlType() {
    return "JSON_FORM_COMPUTE_VALUE";
  }
}

export interface JSONFormComputeControlProps extends ControlProps {
  defaultValue?: string;
  widgetProperties: JSONFormWidgetProps;
  placeholderText?: string;
}

export default JSONFormComputeControl;
