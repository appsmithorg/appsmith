import React from "react";
import styled from "styled-components";
import { isString } from "lodash";

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
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import CodeEditor from "components/editorComponents/LazyCodeEditor";
import type { ListWidgetProps } from "widgets/ListWidgetV2/widget";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import { getBindingTemplate } from "widgets/ListWidgetV2/constants";

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

export function InputText(props: {
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
            Access the current listData using{" "}
            <span className="code-wrapper">
              <CurlyBraces>{"{{"}</CurlyBraces>
              currentItem.id
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

class ListComputeControl extends BaseControl<ListComputeControlProps> {
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

    const { listData = [] } = widgetProperties;
    const additionalDynamicData = {
      currentItem: listData[0] || {},
      currentIndex: 0,
    };

    const value = (() => {
      if (propertyValue && isDynamicValue(propertyValue)) {
        const { widgetName } = this.props.widgetProperties;
        return ListComputeControl.getInputComputedValue(
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
        additionalDynamicData={additionalDynamicData}
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
    return "LIST_COMPUTE_CONTROL";
  }
}

export interface ListComputeControlProps extends ControlProps {
  defaultValue?: string;
  widgetProperties: ListWidgetProps;
  placeholderText?: string;
}

export default ListComputeControl;
