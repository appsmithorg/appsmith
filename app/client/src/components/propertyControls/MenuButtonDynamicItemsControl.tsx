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
} from "components/editorComponents/ActionCreator/utils";
import { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";

const PromptMessage = styled.span`
  line-height: 17px;
`;
const CurlyBraces = styled.span`
  color: ${(props) => props.theme.colors.codeMirror.background.hoverState};
  background-color: #575757;
  border-radius: 2px;
  padding: 2px;
  margin: 0px 2px;
  font-size: 10px;
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
            Access the current item using <CurlyBraces>{"{{"}</CurlyBraces>
            currentItem
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

class MenuButtonDynamicItemsControl extends BaseControl<
  MenuButtonDynamicItemsControlProps
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
    const menuButtonId = this.props.widgetProperties.widgetName;
    const value =
      propertyValue && isDynamicValue(propertyValue)
        ? MenuButtonDynamicItemsControl.getInputComputedValue(
            propertyValue,
            menuButtonId,
          )
        : propertyValue
        ? propertyValue
        : defaultValue;
    const keys = this.props.widgetProperties.sourceDataKeys || [];
    const currentItem: { [key: string]: any } = {};

    Object.values(keys).forEach((key) => {
      currentItem[key as keyof typeof currentItem] = undefined;
    });

    // Load default value in evaluated value
    if (value && !propertyValue) {
      this.onTextChange(value);
    }
    return (
      <InputText
        additionalDynamicData={{
          currentItem,
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

  static getBindingPrefix = (menuButtonId: string) => {
    return `{{${menuButtonId}.sourceData.map((currentItem, currentIndex) => ( `;
  };

  static bindingSuffix = `))}}`;

  static getInputComputedValue = (
    propertyValue: string,
    menuButtonId: string,
  ) => {
    if (!propertyValue.includes(this.getBindingPrefix(menuButtonId))) {
      return propertyValue;
    }

    const value = `${propertyValue.substring(
      this.getBindingPrefix(menuButtonId).length,
      propertyValue.length - this.bindingSuffix.length,
    )}`;
    const stringValue = JSToString(value);

    return stringValue;
  };

  getComputedValue = (value: string, menuButtonId: string) => {
    if (!isDynamicValue(value)) {
      return value;
    }

    const stringToEvaluate = stringToJS(value);

    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return `${MenuButtonDynamicItemsControl.getBindingPrefix(
      menuButtonId,
    )}${stringToEvaluate}${MenuButtonDynamicItemsControl.bindingSuffix}`;
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
    return "MENU_BUTTON_DYNAMIC_ITEMS";
  }
}

export interface MenuButtonDynamicItemsControlProps extends ControlProps {
  defaultValue?: string;
}

export default MenuButtonDynamicItemsControl;
