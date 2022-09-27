import { ActionType, FieldConfigs } from "./types";
import { AppsmithFunction, FieldType, ViewTypes } from "./constants";
import { ACTION_TRIGGER_REGEX } from "./regex";
import { TreeDropdownOption } from "design-system";
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
import { NavigationTargetType } from "../../../sagas/ActionExecution/NavigateActionSaga";

export const FIELD_CONFIGS: FieldConfigs = {
  [FieldType.ACTION_SELECTOR_FIELD]: {
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
    setter: (option: TreeDropdownOption) => {
      const type: ActionType = option.type || option.value;
      let value = option.value;
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
          defaultArgs = option.args ? option.args : [];
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
  [FieldType.SHOW_MODAL_FIELD]: {
    getter: (value: any) => {
      return modalGetter(value);
    },
    setter: (option: any, currentValue: string) => {
      return modalSetter(option.value, currentValue);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.CLOSE_MODAL_FIELD]: {
    getter: (value: any) => {
      return modalGetter(value);
    },
    setter: (option: any, currentValue: string) => {
      return modalSetter(option.value, currentValue);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.PAGE_SELECTOR_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 0, "");
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.KEY_VALUE_FIELD]: {
    getter: (value: any) => {
      return value;
    },
    setter: (value: any) => {
      return value;
    },
    view: ViewTypes.KEY_VALUE_VIEW,
  },
  [FieldType.ARGUMENT_KEY_VALUE_FIELD]: {
    getter: (value: any, index: number) => {
      return textGetter(value, index);
    },
    setter: (value: any, currentValue: string, index: number) => {
      if (value === "") {
        value = undefined;
      }
      return textSetter(value, currentValue, index);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.URL_FIELD]: {
    getter: (value: string) => {
      const appState = store.getState();
      const pageList = getPageList(appState).map((page) => page.pageName);
      const urlFieldValue = textGetter(value, 0);
      return pageList.includes(urlFieldValue) ? "" : urlFieldValue;
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.NAVIGATION_TARGET_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 2, NavigationTargetType.SAME_WINDOW);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 2);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.ALERT_TEXT_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.ALERT_TYPE_SELECTOR_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 1, "success");
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 1);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.KEY_TEXT_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.VALUE_TEXT_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.QUERY_PARAMS_FIELD]: {
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
  [FieldType.DOWNLOAD_DATA_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DOWNLOAD_FILE_NAME_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DOWNLOAD_FILE_TYPE_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 2);
    },
    setter: (option: any, currentValue: string) =>
      enumTypeSetter(option.value, currentValue, 2),
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.COPY_TEXT_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.WIDGET_NAME_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.RESET_CHILDREN_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 1);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.CALLBACK_FUNCTION_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DELAY_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 1);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.ID_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 2);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 2);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.CLEAR_INTERVAL_ID_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.MESSAGE_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.TARGET_ORIGIN_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 1);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.TAB_VIEW,
  },
};
