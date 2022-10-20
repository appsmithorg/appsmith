import { AppsmithFunction, FieldType, ViewTypes } from "../constants";
import { TreeDropdownOption } from "design-system";
import {
  FieldProps,
  KeyValueViewProps,
  SelectorViewProps,
  TabViewProps,
  TextViewProps,
} from "../types";
import HightlightedCode from "../../HighlightedCode";
import { Skin } from "../../../../constants/DefaultTheme";
import { DropdownOption } from "../../../constants";
import React from "react";
import { SelectorView } from "../viewComponents/SelectorView";
import { KeyValueView } from "../viewComponents/KeyValueView";
import { TextView } from "../viewComponents/TextView";
import { TabView } from "../viewComponents/TabView";
import { FIELD_CONFIG } from "../FieldConfig";

const views = {
  [ViewTypes.SELECTOR_VIEW]: (props: SelectorViewProps) => (
    <SelectorView {...props} />
  ),
  [ViewTypes.KEY_VALUE_VIEW]: (props: KeyValueViewProps) => (
    <KeyValueView {...props} />
  ),
  [ViewTypes.TEXT_VIEW]: (props: TextViewProps) => <TextView {...props} />,
  [ViewTypes.TAB_VIEW]: (props: TabViewProps) => <TabView {...props} />,
  // eslint-disable-next-line react/jsx-no-useless-fragment
  [ViewTypes.NO_VIEW]: () => <></>,
};

export function Field(props: FieldProps) {
  const { field } = props;
  const fieldType = field.field;
  const fieldConfig = FIELD_CONFIG[fieldType];
  // eslint-disable-next-line react/jsx-no-useless-fragment
  if (!fieldConfig) return <></>;
  let viewElement: JSX.Element | null = null;
  const view = fieldConfig.view && views[fieldConfig.view];
  const label = FIELD_CONFIG[fieldType].label(props);
  const getterFunction = fieldConfig.getter;
  const value = props.value;
  const defaultText = FIELD_CONFIG[fieldType].defaultText;
  const options = FIELD_CONFIG[fieldType].options(props);
  const toolTip = FIELD_CONFIG[fieldType].toolTip;

  switch (fieldType) {
    case FieldType.ACTION_SELECTOR_FIELD:
      viewElement = (view as (props: SelectorViewProps) => JSX.Element)({
        options: options as TreeDropdownOption[],
        label: label,
        get: getterFunction,
        set: (
          value: TreeDropdownOption,
          defaultValue?: string,
          isUpdatedViaKeyboard = false,
        ) => {
          const finalValueToSet = fieldConfig.setter(value, "");
          props.onValueChange(finalValueToSet, isUpdatedViaKeyboard);
        },
        value: value,
        defaultText: defaultText,
        getDefaults: (value: string) => {
          return {
            [AppsmithFunction.navigateTo]: `'${props.pageDropdownOptions[0].label}'`,
          }[value];
        },
        selectedLabelModifier: (
          option: TreeDropdownOption,
          displayValue?: string,
        ) => {
          if (option.type === AppsmithFunction.integration) {
            return (
              <HightlightedCode
                codeText={`{{${option.label}.run()}}`}
                skin={Skin.LIGHT}
              />
            );
          } else if (displayValue) {
            return (
              <HightlightedCode codeText={displayValue} skin={Skin.LIGHT} />
            );
          }
          return <span>{option.label}</span>;
        },
        displayValue:
          field.value !== "{{undefined}}" &&
          field.value !== "{{()}}" &&
          field.value !== "{{{}, ()}}"
            ? field.value
            : undefined,
      });
      break;
    case FieldType.ON_SUCCESS_FIELD:
    case FieldType.ON_ERROR_FIELD:
    case FieldType.SHOW_MODAL_FIELD:
    case FieldType.CLOSE_MODAL_FIELD:
    case FieldType.PAGE_SELECTOR_FIELD:
    case FieldType.ALERT_TYPE_SELECTOR_FIELD:
    case FieldType.DOWNLOAD_FILE_TYPE_FIELD:
    case FieldType.NAVIGATION_TARGET_FIELD:
    case FieldType.RESET_CHILDREN_FIELD:
    case FieldType.WIDGET_NAME_FIELD:
      viewElement = (view as (props: SelectorViewProps) => JSX.Element)({
        options: options as TreeDropdownOption[],
        label: label,
        get: getterFunction,
        set: (
          value: TreeDropdownOption,
          defaultValue?: string,
          isUpdatedViaKeyboard = false,
        ) => {
          const finalValueToSet = fieldConfig.setter(
            value,
            props.value,
            isUpdatedViaKeyboard,
          );
          props.onValueChange(finalValueToSet, isUpdatedViaKeyboard);
        },
        value: value,
        defaultText: defaultText,
      });
      break;
    case FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD:
      viewElement = (view as (props: TabViewProps) => JSX.Element)({
        activeObj: props.activeNavigateToTab,
        switches: props.navigateToSwitches,
        label: label,
        value: value,
      });
      break;
    case FieldType.ARGUMENT_KEY_VALUE_FIELD:
      viewElement = (view as (props: TextViewProps) => JSX.Element)({
        label: label,
        get: getterFunction,
        set: (value: string) => {
          const finalValueToSet = fieldConfig.setter(
            value,
            props.value,
            props.field.index,
          );
          props.onValueChange(finalValueToSet, false);
        },
        index: props.field.index,
        value: value || "",
      });
      break;
    case FieldType.KEY_VALUE_FIELD:
      viewElement = (view as (props: SelectorViewProps) => JSX.Element)({
        options: options as TreeDropdownOption[],
        label: label,
        get: getterFunction,
        set: (value: string | DropdownOption) => {
          const finalValueToSet = fieldConfig.setter(value, props.value);
          props.onValueChange(finalValueToSet, false);
        },
        value: value,
        defaultText: defaultText,
      });
      break;
    case FieldType.ALERT_TEXT_FIELD:
    case FieldType.URL_FIELD:
    case FieldType.KEY_TEXT_FIELD:
    case FieldType.VALUE_TEXT_FIELD:
    case FieldType.QUERY_PARAMS_FIELD:
    case FieldType.DOWNLOAD_DATA_FIELD:
    case FieldType.DOWNLOAD_FILE_NAME_FIELD:
    case FieldType.COPY_TEXT_FIELD:
    case FieldType.CALLBACK_FUNCTION_FIELD:
    case FieldType.DELAY_FIELD:
    case FieldType.ID_FIELD:
    case FieldType.CLEAR_INTERVAL_ID_FIELD:
    case FieldType.MESSAGE_FIELD:
    case FieldType.TARGET_ORIGIN_FIELD:
    case FieldType.SOURCE_FIELD:
      viewElement = (view as (props: TextViewProps) => JSX.Element)({
        label: label,
        toolTip: toolTip,
        get: getterFunction,
        set: (value: string | DropdownOption, isUpdatedViaKeyboard = false) => {
          const finalValueToSet = fieldConfig.setter(value, props.value);
          props.onValueChange(finalValueToSet, isUpdatedViaKeyboard);
        },
        value: value,
        additionalAutoComplete: props.additionalAutoComplete,
      });
      break;
    default:
      break;
  }

  return (
    <div data-guided-tour-iid={field.label} key={fieldType}>
      {viewElement}
    </div>
  );
}
