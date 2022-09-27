import {
  AppsmithFunction,
  FieldType,
  FILE_TYPE_OPTIONS,
  NAVIGATION_TARGET_FIELD_OPTIONS,
  RESET_CHILDREN_OPTIONS,
  ViewTypes,
} from "../constants";
import { TreeDropdownOption } from "design-system";
import {
  KeyValueViewProps,
  SelectorViewProps,
  SwitchType,
  TabViewProps,
  TextViewProps,
} from "../types";
import HightlightedCode from "../../HighlightedCode";
import { Skin } from "../../../../constants/DefaultTheme";
import { ALERT_STYLE_OPTIONS } from "../../../../ce/constants/messages";
import { DropdownOption } from "../../../constants";
import React from "react";
import { SelectorView } from "../viewComponents/SelectorView/SelectorView";
import { KeyValueView } from "../viewComponents/KeyValueView";
import { TextView } from "../viewComponents/TextView/TextView";
import { TabView } from "../viewComponents/TabView/TabView";
import { FIELD_CONFIGS } from "../FieldConfig";

const views = {
  [ViewTypes.SELECTOR_VIEW]: (props: SelectorViewProps) => (
    <SelectorView {...props} />
  ),
  [ViewTypes.KEY_VALUE_VIEW]: (props: KeyValueViewProps) => (
    <KeyValueView {...props} />
  ),
  [ViewTypes.TEXT_VIEW]: (props: TextViewProps) => <TextView {...props} />,
  [ViewTypes.TAB_VIEW]: (props: TabViewProps) => <TabView {...props} />,
};

export function Field(props: {
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  value: string;
  field: { field: FieldType; value: string; label: string; index: number };
  label?: string;
  widgetOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  integrationOptionTree: TreeDropdownOption[];
  depth: number;
  maxDepth: number;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
  activeNavigateToTab: SwitchType;
  navigateToSwitches: Array<SwitchType>;
}) {
  const { field } = props;
  const fieldType = field.field;
  const fieldConfig = FIELD_CONFIGS[fieldType];
  if (!fieldConfig) return;
  const view = views[fieldConfig.view];
  let viewElement: JSX.Element | null = null;

  switch (fieldType) {
    case FieldType.ACTION_SELECTOR_FIELD:
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
      let label = "";
      let defaultText = "Select Action";
      let options = props.integrationOptionTree;
      let selectedLabelModifier = undefined;
      let displayValue = undefined;
      let getDefaults = undefined;
      if (fieldType === FieldType.ACTION_SELECTOR_FIELD) {
        label = props.label || "";
        displayValue =
          field.value !== "{{undefined}}" &&
          field.value !== "{{()}}" &&
          field.value !== "{{{}, ()}}"
            ? field.value
            : undefined;
        // eslint-disable-next-line react/display-name
        selectedLabelModifier = function(
          option: TreeDropdownOption,
          displayValue?: string,
        ) {
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
        };
        getDefaults = (value: string) => {
          return {
            [AppsmithFunction.navigateTo]: `'${props.pageDropdownOptions[0].label}'`,
          }[value];
        };
      }
      if (
        fieldType === FieldType.SHOW_MODAL_FIELD ||
        fieldType === FieldType.CLOSE_MODAL_FIELD
      ) {
        label = "Modal Name";
        options = props.modalDropdownList;
        defaultText = "Select Modal";
      }
      if (fieldType === FieldType.RESET_CHILDREN_FIELD) {
        label = "Reset Children";
        options = RESET_CHILDREN_OPTIONS;
        defaultText = "true";
      }
      if (fieldType === FieldType.WIDGET_NAME_FIELD) {
        label = "Widget";
        options = props.widgetOptionTree;
        defaultText = "Select Widget";
      }
      if (fieldType === FieldType.PAGE_SELECTOR_FIELD) {
        label = "Choose Page";
        options = props.pageDropdownOptions;
        defaultText = "Select Page";
      }
      if (fieldType === FieldType.ALERT_TYPE_SELECTOR_FIELD) {
        label = "Type";
        options = ALERT_STYLE_OPTIONS;
        defaultText = "Select type";
      }
      if (fieldType === FieldType.DOWNLOAD_FILE_TYPE_FIELD) {
        label = "Type";
        options = FILE_TYPE_OPTIONS;
        defaultText = "Select file type (optional)";
      }
      if (fieldType === FieldType.NAVIGATION_TARGET_FIELD) {
        label = "Target";
        options = NAVIGATION_TARGET_FIELD_OPTIONS;
        defaultText = NAVIGATION_TARGET_FIELD_OPTIONS[0].label;
      }
      viewElement = (view as (props: SelectorViewProps) => JSX.Element)({
        options: options,
        label: label,
        get: fieldConfig.getter,
        set: (
          value: string | DropdownOption,
          defaultValue?: string,
          isUpdatedViaKeyboard = false,
        ) => {
          const finalValueToSet = fieldConfig.setter(
            value,
            props.value,
            defaultValue,
          );
          props.onValueChange(finalValueToSet, isUpdatedViaKeyboard);
        },
        value: props.value,
        defaultText: defaultText,
        getDefaults: getDefaults,
        selectedLabelModifier: selectedLabelModifier,
        displayValue: displayValue ? displayValue : "",
      });
      break;
    case FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD:
      viewElement = (view as (props: TabViewProps) => JSX.Element)({
        activeObj: props.activeNavigateToTab,
        switches: props.navigateToSwitches,
        label: "Type",
        value: props.value,
      });
      break;
    case FieldType.ARGUMENT_KEY_VALUE_FIELD:
      viewElement = (view as (props: TextViewProps) => JSX.Element)({
        label: props.field.label || "",
        get: fieldConfig.getter,
        set: (value: string) => {
          const finalValueToSet = fieldConfig.setter(
            value,
            props.value,
            props.field.index,
          );
          props.onValueChange(finalValueToSet, false);
        },
        index: props.field.index,
        value: props.value || "",
      });
      break;
    case FieldType.KEY_VALUE_FIELD:
      viewElement = (view as (props: SelectorViewProps) => JSX.Element)({
        options: props.integrationOptionTree,
        label: "",
        get: fieldConfig.getter,
        set: (value: string | DropdownOption) => {
          const finalValueToSet = fieldConfig.setter(value, props.value);
          props.onValueChange(finalValueToSet, false);
        },
        value: props.value,
        defaultText: "Select Action",
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
      let fieldLabel = "";
      if (fieldType === FieldType.ALERT_TEXT_FIELD) {
        fieldLabel = "Message";
      } else if (fieldType === FieldType.URL_FIELD) {
        fieldLabel = "Enter URL";
      } else if (fieldType === FieldType.KEY_TEXT_FIELD) {
        fieldLabel = "Key";
      } else if (fieldType === FieldType.VALUE_TEXT_FIELD) {
        fieldLabel = "Value";
      } else if (fieldType === FieldType.QUERY_PARAMS_FIELD) {
        fieldLabel = "Query Params";
      } else if (fieldType === FieldType.DOWNLOAD_DATA_FIELD) {
        fieldLabel = "Data to download";
      } else if (fieldType === FieldType.DOWNLOAD_FILE_NAME_FIELD) {
        fieldLabel = "File name with extension";
      } else if (fieldType === FieldType.COPY_TEXT_FIELD) {
        fieldLabel = "Text to be copied to clipboard";
      } else if (fieldType === FieldType.CALLBACK_FUNCTION_FIELD) {
        fieldLabel = "Callback function";
      } else if (fieldType === FieldType.DELAY_FIELD) {
        fieldLabel = "Delay (ms)";
      } else if (fieldType === FieldType.ID_FIELD) {
        fieldLabel = "Id";
      } else if (fieldType === FieldType.CLEAR_INTERVAL_ID_FIELD) {
        fieldLabel = "Id";
      }
      viewElement = (view as (props: TextViewProps) => JSX.Element)({
        label: fieldLabel,
        get: fieldConfig.getter,
        set: (value: string | DropdownOption, isUpdatedViaKeyboard = false) => {
          const finalValueToSet = fieldConfig.setter(value, props.value);
          props.onValueChange(finalValueToSet, isUpdatedViaKeyboard);
        },
        value: props.value,
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
