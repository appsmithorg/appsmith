import React from "react";
import { get } from "lodash";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDynamicInput } from "./StyledControls";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import {
  JSToString,
  stringToJS,
} from "components/editorComponents/actioncreator/ActionCreator";

const CurlyBraces = styled.span`
  color: white;
  background-color: #f3672a;
  border-radius: 2px;
  padding: 2px;
  margin: 0px 2px;
`;

export function InputText(props: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  isValid: boolean;
  errorMessage?: string;
  evaluatedValue?: any;
  expected?: string;
  placeholder?: string;
  dataTreePath?: string;
  additionalDynamicData: Record<string, Record<string, unknown>>;
}) {
  const {
    errorMessage,
    expected,
    value,
    isValid,
    onChange,
    placeholder,
    dataTreePath,
    evaluatedValue,
    additionalDynamicData,
  } = props;
  return (
    <StyledDynamicInput>
      <CodeEditor
        input={{
          value: value,
          onChange: onChange,
        }}
        evaluatedValue={evaluatedValue}
        expected={expected}
        dataTreePath={dataTreePath}
        meta={{
          error: isValid ? "" : errorMessage,
          touched: true,
        }}
        theme={EditorTheme.DARK}
        mode={EditorModes.TEXT_WITH_BINDING}
        tabBehaviour={TabBehaviour.INDENT}
        size={EditorSize.EXTENDED}
        placeholder={placeholder}
        additionalDynamicData={additionalDynamicData}
        promptMessage={
          <React.Fragment>
            Use <CurlyBraces>{"{{"}</CurlyBraces>currentRow.columnIdentifier
            <CurlyBraces>{"}}"}</CurlyBraces> to access any column in the table
          </React.Fragment>
        }
      />
    </StyledDynamicInput>
  );
}

class ComputeListPropertyControl extends BaseControl<
  ComputeListPropertyControlProps
> {
  render() {
    const {
      expected,
      propertyValue,
      isValid,
      label,
      dataTreePath,
      validationMessage,
      defaultValue,
      listWidgetProperties,
    } = this.props;

    console.log({ props: this.props });
    const listId = this.props.listWidgetProperties.widgetName;
    const value =
      propertyValue && isDynamicValue(propertyValue)
        ? this.getInputComputedValue(propertyValue, listId)
        : propertyValue
        ? propertyValue
        : defaultValue;
    const evaluatedProperties = this.props.widgetProperties;

    let items;

    try {
      if (!Array.isArray(evaluatedProperties.items)) {
        items = JSON.parse(listWidgetProperties.items);
      }
    } catch (e) {}

    const currentItem: { [key: string]: any } = {};
    Object.keys(get(items, "0", {})).forEach(
      (key: string) => (currentItem[key] = ""),
    );

    return (
      <InputText
        label={label}
        value={value}
        onChange={this.onTextChange}
        isValid={isValid}
        errorMessage={validationMessage}
        expected={expected}
        dataTreePath={dataTreePath}
        additionalDynamicData={{
          currentItem,
        }}
      />
    );
  }

  getInputComputedValue = (propertyValue: string, listId: string) => {
    const value = `${propertyValue.substring(
      `{{${listId}.items.map((currentItem) => `.length,
      propertyValue.length - 3,
    )}`;
    const stringValue = JSToString(value);

    console.log({ propertyValue, value, stringValue });
    return stringValue;
  };

  getComputedValue = (value: string, listId: string) => {
    const stringToEvaluate = stringToJS(value);
    return `{{${listId}.items.map((currentItem) => ${stringToEvaluate})}}`;
  };

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = "";
    if (typeof event !== "string") {
      value = event.target.value;
    } else {
      value = event;
    }
    if (value) {
      const output = this.getComputedValue(
        value,
        this.props.listWidgetProperties.widgetName,
      );

      this.updateProperty(this.props.propertyName, output);
    } else {
      this.updateProperty(this.props.propertyName, value);
    }
  };

  static getControlType() {
    return "COMPUTE_LIST_VALUE";
  }
}

export interface ComputeListPropertyControlProps extends ControlProps {
  defaultValue?: string;
}

export default ComputeListPropertyControl;
