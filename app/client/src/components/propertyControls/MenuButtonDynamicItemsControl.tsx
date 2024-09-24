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
import { isDynamicValue } from "utils/DynamicBindingUtils";
import styled from "styled-components";
import { isString } from "utils/helpers";
import {
  JSToString,
  stringToJS,
} from "components/editorComponents/ActionCreator/utils";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import type { ColumnProperties } from "widgets/TableWidgetV2/component/Constants";
import { getUniqueKeysFromSourceData } from "widgets/MenuButtonWidget/widget/helper";
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
            Access the current item using{" "}
            <span className="code-wrapper">
              <CurlyBraces>{"{{"}</CurlyBraces>
              currentItem
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

class MenuButtonDynamicItemsControl extends BaseControl<MenuButtonDynamicItemsControlProps> {
  render() {
    const {
      dataTreePath,
      defaultValue,
      expected,
      label,
      propertyValue,
      theme,
      widgetProperties,
    } = this.props;
    const widgetName = widgetProperties.widgetName;
    const widgetType = widgetProperties.type;
    const value =
      propertyValue && isDynamicValue(propertyValue)
        ? MenuButtonDynamicItemsControl.getInputComputedValue(
            propertyValue,
            widgetName,
            widgetType,
            widgetProperties.primaryColumns,
          )
        : propertyValue
          ? propertyValue
          : defaultValue;
    let sourceData;

    if (widgetType === "TABLE_WIDGET_V2") {
      sourceData =
        widgetProperties?.__evaluation__?.evaluatedValues?.primaryColumns?.[
          `${Object.keys(widgetProperties.primaryColumns)[0]}`
        ]?.sourceData;
    } else if (widgetType === "MENU_BUTTON_WIDGET") {
      sourceData =
        widgetProperties?.__evaluation__?.evaluatedValues?.sourceData;
    }

    const keys = getUniqueKeysFromSourceData(sourceData);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  static getBindingPrefix = (
    widgetName: string,
    widgetType?: string,
    primaryColumns?: Record<string, ColumnProperties>,
  ) => {
    if (widgetType === "TABLE_WIDGET_V2" && primaryColumns) {
      const columnName = Object.keys(primaryColumns)?.[0];

      return `{{${widgetName}.processedTableData.map((currentRow, currentRowIndex) => {
        let primaryColumnData = [];

        if (${widgetName}.primaryColumns.${columnName}.sourceData[currentRowIndex].length) {
          primaryColumnData = ${widgetName}.primaryColumns.${columnName}.sourceData[currentRowIndex];
        } else if (${widgetName}.primaryColumns.${columnName}.sourceData.length) {
          primaryColumnData = ${widgetName}.primaryColumns.${columnName}.sourceData;
        }

        return primaryColumnData.map((currentItem, currentIndex) => `;
    } else {
      return `{{${widgetName}.sourceData.map((currentItem, currentIndex) => ( `;
    }
  };

  static getBindingSuffix = (widgetType?: string) =>
    widgetType === "TABLE_WIDGET_V2" ? `);});}}` : `))}}`;

  static getInputComputedValue = (
    propertyValue: string,
    widgetName: string,
    widgetType?: string,
    primaryColumns?: Record<string, ColumnProperties>,
  ) => {
    if (
      !propertyValue.includes(
        this.getBindingPrefix(widgetName, widgetType, primaryColumns),
      )
    ) {
      return propertyValue;
    }

    const value = `${propertyValue.substring(
      this.getBindingPrefix(widgetName, widgetType, primaryColumns).length,
      propertyValue.length - this.getBindingSuffix(widgetType).length,
    )}`;
    const stringValue = JSToString(value);

    return stringValue;
  };

  getComputedValue = (
    value: string,
    widgetName: string,
    widgetType?: string,
    primaryColumns?: Record<string, ColumnProperties>,
  ) => {
    if (!isDynamicValue(value)) {
      return value;
    }

    const stringToEvaluate = stringToJS(value);

    if (stringToEvaluate === "") {
      return stringToEvaluate;
    }

    return `${MenuButtonDynamicItemsControl.getBindingPrefix(
      widgetName,
      widgetType,
      primaryColumns,
    )}${stringToEvaluate}${MenuButtonDynamicItemsControl.getBindingSuffix(
      widgetType,
    )}`;
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
        this.props.widgetProperties.type,
        this.props.widgetProperties.primaryColumns,
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
