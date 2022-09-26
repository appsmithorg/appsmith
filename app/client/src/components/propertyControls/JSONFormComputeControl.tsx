import React from "react";
import { isString } from "lodash";

import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDynamicInput } from "./StyledControls";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import { JSONFormWidgetProps } from "widgets/JSONFormWidget/widget";
import {
  ARRAY_ITEM_KEY,
  DataType,
  FIELD_TYPE_TO_POTENTIAL_DATA,
  getBindingTemplate,
  ROOT_SCHEMA_KEY,
  Schema,
  SchemaItem,
} from "widgets/JSONFormWidget/constants";
import CodeEditor from "components/editorComponents/LazyCodeEditorWrapper";

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

// Auxiliary function for processArray, which returns the value for an object field
function processObject(schema: Schema, defaultValue?: any) {
  const obj: Record<string, any> = {};

  Object.values(schema).forEach((schemaItem) => {
    obj[schemaItem.accessor] = processSchemaItemAutocomplete(
      schemaItem,
      defaultValue,
    );
  });

  return obj;
}

// Auxiliary function for processArray, which returns the value for an array field
function processArray(schema: Schema, defaultValue?: any): any[] {
  if (schema[ARRAY_ITEM_KEY]) {
    return [
      processSchemaItemAutocomplete(schema[ARRAY_ITEM_KEY], defaultValue),
    ];
  }

  return [];
}

/**
 * This function takes a schemaItem, traverses through it and creates an object out of it. This
 * object would look like the form data and this object would be used for autocomplete.
 * Eg -  {
 *    fieldType: object,
 *    children: {
 *      name: {
 *         accessor: "name"
 *        fieldType: "string"
 *      },
 *      age: {
 *         accessor: "आयु"
 *        fieldType: "number"
 *      }
 *    }
 *  }
 *
 * @returns
 * {
 *  name: "",
 *  आयु: 0
 * }
 *
 * @param schema
 * @param defaultValue Values that the autocomplete should show for a particular field
 */
export function processSchemaItemAutocomplete(
  schemaItem: SchemaItem,
  defaultValue?: any,
) {
  if (schemaItem.dataType === DataType.OBJECT) {
    return processObject(schemaItem.children, defaultValue);
  }

  if (schemaItem.dataType === DataType.ARRAY) {
    return processArray(schemaItem.children, defaultValue);
  }

  return defaultValue || FIELD_TYPE_TO_POTENTIAL_DATA[schemaItem.fieldType];
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

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);
  const js = stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `\`${segment}\``;
      }
    })
    .join(" + ");
  return js;
};

export const JSToString = (js: string): string => {
  const segments = js.split(" + ");
  return segments
    .map((segment) => {
      if (segment.charAt(0) === "`") {
        return segment.substring(1, segment.length - 1);
      } else return "{{" + segment + "}}";
    })
    .join("");
};

class JSONFormComputeControl extends BaseControl<JSONFormComputeControlProps> {
  static getInputComputedValue = (
    propertyValue: string,
    widgetName: string,
  ) => {
    if (!isDynamicValue(propertyValue)) return propertyValue;

    const { prefixTemplate, suffixTemplate } = getBindingTemplate(widgetName);

    const value = propertyValue.substring(
      prefixTemplate.length,
      propertyValue.length - suffixTemplate.length,
    );

    return JSToString(value);
  };

  getComputedValue = (value: string) => {
    const { widgetName } = this.props.widgetProperties;

    /**
     * If the input value is not a binding then there is no need of adding binding template
     * to the value as it would be of no use.
     *
     * Original motivation of doing this to allow REGEX to work. If the value is REGEX, eg - ^\d+$ and the
     * binding template is added, the REGEX is processed by evaluation and the "\" is considered as a escape and
     * is removed from the final value and the regex become ^d+$. In order to make it work inside a binding the "\"
     * has to be escaped by doing ^\\d+$.
     * As the user is unaware of this binding template being added under the hood, it is not obvious for the user
     * to escape the "\".
     * Thus now we only add the binding template around a value only if the original value has a binding as that could
     * be an indication of the usage of formData/sourceData/fieldState in the value.
     */
    if (!isDynamicValue(value)) return value;

    const stringToEvaluate = stringToJS(value);
    const { prefixTemplate, suffixTemplate } = getBindingTemplate(widgetName);

    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return `${prefixTemplate}${stringToEvaluate}${suffixTemplate}`;
  };

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    const value = isString(event) ? event : event.target?.value;
    const output = this.getComputedValue(value);

    this.updateProperty(this.props.propertyName, output);
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

    const { schema } = widgetProperties;
    const rootSchemaItem = schema[ROOT_SCHEMA_KEY] || {};
    const { sourceData } = rootSchemaItem;

    const baseSchemaStructure = processSchemaItemAutocomplete(rootSchemaItem);

    const fieldStateStructure = processSchemaItemAutocomplete(rootSchemaItem, {
      isVisible: true,
      isDisabled: true,
      isRequired: true,
      isValid: true,
    });

    const value = (() => {
      if (propertyValue && isDynamicValue(propertyValue)) {
        const { widgetName } = this.props.widgetProperties;
        return JSONFormComputeControl.getInputComputedValue(
          propertyValue,
          widgetName,
        );
      }

      return propertyValue || defaultValue;
    })();

    if (value && !propertyValue) {
      this.onTextChange(value);
    }

    return (
      <InputText
        additionalDynamicData={{
          sourceData,
          formData: baseSchemaStructure,
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
