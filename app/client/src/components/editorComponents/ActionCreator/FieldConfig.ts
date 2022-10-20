import {
  AppsmithFunction,
  FieldType,
  FILE_TYPE_OPTIONS,
  NAVIGATION_TARGET_FIELD_OPTIONS,
  RESET_CHILDREN_OPTIONS,
  ViewTypes,
} from "./constants";
import { ALERT_STYLE_OPTIONS } from "../../../ce/constants/messages";
import { ActionType, AppsmithFunctionConfigType, FieldProps } from "./types";
import {
  enumTypeGetter,
  enumTypeSetter,
  modalGetter,
  modalSetter,
  textGetter,
  textSetter,
} from "./utils";
import store from "../../../store";
import { getPageList } from "../../../selectors/entitiesSelector";
import { ACTION_TRIGGER_REGEX } from "./regex";
import { TreeDropdownOption } from "design-system";

export const FIELD_CONFIG: AppsmithFunctionConfigType = {
  [FieldType.ACTION_SELECTOR_FIELD]: {
    label: (props: FieldProps) => props.label || "",
    options: (props: FieldProps) => props.integrationOptionTree,
    defaultText: "Select Action",
    getter: (storedValue: string) => {
      let matches: any[] = [];
      if (storedValue) {
        matches = storedValue
          ? [...storedValue.matchAll(ACTION_TRIGGER_REGEX)]
          : [];
      }
      let mainFuncSelectedValue = AppsmithFunction.none;
      if (matches.length) {
        mainFuncSelectedValue = matches[0][1] || AppsmithFunction.none;
      }
      const mainFuncSelectedValueSplit = mainFuncSelectedValue.split(".");
      if (mainFuncSelectedValueSplit[1] === "run") {
        return mainFuncSelectedValueSplit[0];
      }
      return mainFuncSelectedValue;
    },
    setter: (option) => {
      const dropdownOption = option as TreeDropdownOption;
      const type: ActionType = dropdownOption.type || dropdownOption.value;
      let value = dropdownOption.value;
      let defaultParams = "";
      let defaultArgs: Array<any> = [];
      switch (type) {
        case AppsmithFunction.integration:
          value = `${value}.run`;
          break;
        case AppsmithFunction.navigateTo:
          defaultParams = `'', {}, 'SAME_WINDOW'`;
          break;
        case AppsmithFunction.jsFunction:
          defaultArgs = dropdownOption.args ? dropdownOption.args : [];
          break;
        case AppsmithFunction.setInterval:
          defaultParams = "() => { \n\t // add code here \n}, 5000";
          break;
        case AppsmithFunction.getGeolocation:
          defaultParams = "(location) => { \n\t // add code here \n  }";
          break;
        case AppsmithFunction.resetWidget:
          defaultParams = `"",true`;
          break;
        case AppsmithFunction.postMessage:
          defaultParams = `'', 'window', '*'`;
          break;
        default:
          break;
      }
      return value === "none"
        ? ""
        : defaultArgs && defaultArgs.length
        ? `{{${value}(${defaultArgs})}}`
        : `{{${value}(${defaultParams})}}`;
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.ALERT_TEXT_FIELD]: {
    label: () => "Message",
    defaultText: "",
    options: () => null,
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.URL_FIELD]: {
    label: () => "Enter URL",
    defaultText: "",
    options: () => null,
    getter: (value: string) => {
      const appState = store.getState();
      const pageList = getPageList(appState).map((page) => page.pageName);
      const urlFieldValue = textGetter(value, 0);
      return pageList.includes(urlFieldValue) ? "" : urlFieldValue;
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.QUERY_PARAMS_FIELD]: {
    label: () => "Query Params",
    defaultText: "",
    options: () => null,
    getter: (value: any) => {
      return textGetter(value, 1);
    },
    setter: (value: any, currentValue: string) => {
      if (value === "") {
        value = undefined;
      }
      return textSetter(value, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.KEY_TEXT_FIELD]: {
    label: () => "Key",
    defaultText: "",
    options: () => null,
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.VALUE_TEXT_FIELD]: {
    label: () => "Value",
    defaultText: "",
    options: () => null,
    getter: (value: any) => {
      return textGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DOWNLOAD_DATA_FIELD]: {
    label: () => "Data to download",
    defaultText: "",
    options: () => null,
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DOWNLOAD_FILE_NAME_FIELD]: {
    label: () => "File name with extension",
    defaultText: "",
    options: () => null,
    getter: (value: any) => {
      return textGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.COPY_TEXT_FIELD]: {
    label: () => "Text to be copied to clipboard",
    defaultText: "",
    options: () => null,
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.CALLBACK_FUNCTION_FIELD]: {
    label: () => "Callback function",
    defaultText: "",
    options: () => null,
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DELAY_FIELD]: {
    label: () => "Delay (ms)",
    defaultText: "",
    options: () => null,
    getter: (value: string) => {
      return textGetter(value, 1);
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.ID_FIELD]: {
    label: () => "Id",
    defaultText: "",
    options: () => null,
    getter: (value: string) => {
      return textGetter(value, 2);
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 2);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.CLEAR_INTERVAL_ID_FIELD]: {
    label: () => "Id",
    defaultText: "",
    options: () => null,
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.SHOW_MODAL_FIELD]: {
    label: () => "Modal Name",
    options: (props: FieldProps) => props.modalDropdownList,
    defaultText: "Select Modal",
    getter: (value: any) => {
      return modalGetter(value);
    },
    setter: (option: any, currentValue: string) => {
      return modalSetter(option.value, currentValue);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.CLOSE_MODAL_FIELD]: {
    label: () => "Modal Name",
    options: (props: FieldProps) => props.modalDropdownList,
    defaultText: "Select Modal",
    getter: (value: any) => {
      return modalGetter(value);
    },
    setter: (option: any, currentValue: string) => {
      return modalSetter(option.value, currentValue);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.RESET_CHILDREN_FIELD]: {
    label: () => "Reset Children",
    options: () => RESET_CHILDREN_OPTIONS,
    defaultText: "true",
    getter: (value: any) => {
      return enumTypeGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 1);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.WIDGET_NAME_FIELD]: {
    label: () => "Widget",
    options: (props: FieldProps) => props.widgetOptionTree,
    defaultText: "Select Widget",
    getter: (value: any) => {
      return enumTypeGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.PAGE_SELECTOR_FIELD]: {
    label: () => "Choose Page",
    options: (props: FieldProps) => props.pageDropdownOptions,
    defaultText: "Select Page",
    getter: (value: any) => {
      return enumTypeGetter(value, 0, "");
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.ALERT_TYPE_SELECTOR_FIELD]: {
    label: () => "Type",
    options: () => ALERT_STYLE_OPTIONS,
    defaultText: "Select type",
    getter: (value: any) => {
      return enumTypeGetter(value, 1, "success");
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 1);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.DOWNLOAD_FILE_TYPE_FIELD]: {
    label: () => "Type",
    options: () => FILE_TYPE_OPTIONS,
    defaultText: "Select file type (optional)",
    getter: (value: any) => {
      return enumTypeGetter(value, 2);
    },
    setter: (option: any, currentValue: string) =>
      enumTypeSetter(option.value, currentValue, 2),
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.NAVIGATION_TARGET_FIELD]: {
    label: () => "Target",
    options: () => NAVIGATION_TARGET_FIELD_OPTIONS,
    defaultText: NAVIGATION_TARGET_FIELD_OPTIONS[0].label,
    getter: (value: any) => {
      return enumTypeGetter(value, 2, "SAME_WINDOW");
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 2);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.ON_SUCCESS_FIELD]: {
    label: () => "",
    options: (props: FieldProps) => props.integrationOptionTree,
    defaultText: "Select Action",
    view: ViewTypes.NO_VIEW,
    getter: () => "",
    setter: () => "",
  },
  [FieldType.ON_ERROR_FIELD]: {
    label: () => "",
    options: (props: FieldProps) => props.integrationOptionTree,
    defaultText: "Select Action",
    view: ViewTypes.NO_VIEW,
    getter: () => "",
    setter: () => "",
  },
  [FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD]: {
    label: () => "Type",
    defaultText: "",
    options: () => null,
    getter: (value: any) => {
      return enumTypeGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.TAB_VIEW,
  },
  [FieldType.KEY_VALUE_FIELD]: {
    label: () => "",
    defaultText: "Select Action",
    options: (props: FieldProps) => props.integrationOptionTree,
    getter: (value: any) => {
      return value;
    },
    setter: (value: any) => {
      return value;
    },
    view: ViewTypes.KEY_VALUE_VIEW,
  },
  [FieldType.ARGUMENT_KEY_VALUE_FIELD]: {
    label: (props: FieldProps) => props.field.label || "",
    defaultText: "",
    options: () => null,
    getter: (value: any, index: number) => {
      return textGetter(value, index);
    },
    setter: (value: any, currentValue: string, index) => {
      if (value === "") {
        value = undefined;
      }
      return textSetter(value, currentValue, index as number);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.MESSAGE_FIELD]: {
    label: () => "Message",
    defaultText: "",
    options: () => null,
    toolTip: "Data to be sent to the target iframe",
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.TARGET_ORIGIN_FIELD]: {
    label: () => "Allowed origins",
    defaultText: "",
    options: () => null,
    toolTip: "Restricts domains to which the message can be sent",
    getter: (value: string) => {
      return textGetter(value, 2);
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 2);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.SOURCE_FIELD]: {
    label: () => "Target iframe",
    defaultText: "",
    options: () => null,
    toolTip: "Specifies the target iframe widget name or parent window",
    getter: (value: string) => {
      return textGetter(value, 1);
    },
    setter: (value, currentValue) => {
      return textSetter(value, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
};
