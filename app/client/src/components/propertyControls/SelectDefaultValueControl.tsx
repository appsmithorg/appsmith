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
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import { isString } from "utils/helpers";

export const getBindingTemplate = (widgetName: string) => {
  const prefixTemplate = `{{ ((options, serverSideFiltering) => ( `;
  const suffixTemplate = `))(${widgetName}.options, ${widgetName}.serverSideFiltering) }}`;

  return { prefixTemplate, suffixTemplate };
};

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

type InputTextProp = {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  evaluatedValue?: any;
  expected?: CodeEditorExpected;
  placeholder?: string;
  dataTreePath?: string;
  theme: EditorTheme;
};

function InputText(props: InputTextProp) {
  const {
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
        dataTreePath={dataTreePath}
        evaluatedValue={evaluatedValue}
        expected={expected}
        input={{
          value: value,
          onChange: onChange,
        }}
        mode={EditorModes.TEXT_WITH_BINDING}
        placeholder={placeholder}
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={theme}
      />
    </StyledDynamicInput>
  );
}

class SelectDefaultValueControl extends BaseControl<
  SelectDefaultValueControlProps
> {
  render() {
    const {
      dataTreePath,
      defaultValue,
      expected,
      label,
      propertyValue,
      theme,
    } = this.props;
    const value = (() => {
      if (propertyValue && isDynamicValue(propertyValue)) {
        const { widgetName } = this.props.widgetProperties;
        return this.getInputComputedValue(propertyValue, widgetName);
      }

      return propertyValue || defaultValue;
    })();

    if (value && !propertyValue) {
      this.onTextChange(value);
    }
    return (
      <InputText
        dataTreePath={dataTreePath}
        expected={expected}
        label={label}
        onChange={this.onTextChange}
        theme={theme}
        value={value}
      />
    );
  }

  getInputComputedValue = (propertyValue: string, widgetName: string) => {
    const { prefixTemplate, suffixTemplate } = getBindingTemplate(widgetName);

    const value = propertyValue.substring(
      prefixTemplate.length,
      propertyValue.length - suffixTemplate.length,
    );

    return JSToString(value);
  };

  getComputedValue = (value: string, widgetName: string) => {
    const stringToEvaluate = stringToJS(value);
    const { prefixTemplate, suffixTemplate } = getBindingTemplate(widgetName);

    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return `${prefixTemplate}${stringToEvaluate}${suffixTemplate}`;
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
    return "SELECT_DEFAULT_VALUE_CONTROL";
  }
}

export interface SelectDefaultValueControlProps extends ControlProps {
  defaultValue?: string;
}

export default SelectDefaultValueControl;
