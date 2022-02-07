import React from "react";

import TreeDropdown, { TreeDropdownOption } from "components/ads/TreeDropdown";
import {
  ControlWrapper,
  FieldWrapper,
} from "components/propertyControls/StyledControls";
import { KeyValueComponent } from "components/propertyControls/KeyValueComponent";
import { InputText } from "components/propertyControls/InputTextControl";
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import HightlightedCode from "components/editorComponents/HighlightedCode";
import { Skin } from "constants/DefaultTheme";
import { DropdownOption } from "components/constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";

/* eslint-disable @typescript-eslint/ban-types */
/* TODO: Function and object types need to be updated to enable the lint rule */

/**
 ******** Steps to add a new function *******
 * In this file:
 * 1. Create a new entry in ActionType object. This is the name of the function
 *
 * 2. Define new fields in FieldType object. This is the field names
 * for each argument the function accepts.
 *
 * 3. Update fieldConfigs with your field's getter, setting and view. getter is
 * the setting used to extract the field value from the function. setter is used to
 * set the value in function when the field is updated. View is the component used
 * to edit the field value
 *
 * 4. Update renderField function to change things like field label etc.
 *
 * On the index file:
 * 1. Add the new action entry and its text in the baseOptions array
 * 2. Attach fields to the new action in the getFieldFromValue function
 **/

const ALERT_STYLE_OPTIONS = [
  { label: "Info", value: "'info'", id: "info" },
  { label: "Success", value: "'success'", id: "success" },
  { label: "Error", value: "'error'", id: "error" },
  { label: "Warning", value: "'warning'", id: "warning" },
];

const RESET_CHILDREN_OPTIONS = [
  { label: "Yes", value: "true", id: "true" },
  { label: "No", value: "false", id: "false" },
];

const FILE_TYPE_OPTIONS = [
  { label: "Select file type (optional)", value: "", id: "" },
  { label: "Plain text", value: "'text/plain'", id: "text/plain" },
  { label: "HTML", value: "'text/html'", id: "text/html" },
  { label: "CSV", value: "'text/csv'", id: "text/csv" },
  { label: "JSON", value: "'application/json'", id: "application/json" },
  { label: "JPEG", value: "'image/jpeg'", id: "image/jpeg" },
  { label: "PNG", value: "'image/png'", id: "image/png" },
  { label: "SVG", value: "'image/svg+xml'", id: "image/svg+xml" },
];

const NAVIGATION_TARGET_FIELD_OPTIONS = [
  {
    label: "Same window",
    value: `'${NavigationTargetType.SAME_WINDOW}'`,
    id: NavigationTargetType.SAME_WINDOW,
  },
  {
    label: "New window",
    value: `'${NavigationTargetType.NEW_WINDOW}'`,
    id: NavigationTargetType.NEW_WINDOW,
  },
];

export const FUNC_ARGS_REGEX = /((["][^"]*["])|([\[][\s\S]*[\]])|([\{][\s\S]*[\}])|(['][^']*['])|([\(][\s\S]*[\)][ ]*=>[ ]*[{][\s\S]*[}])|([^'",][^,"+]*[^'",]*))*/gi;
export const ACTION_TRIGGER_REGEX = /^{{([\s\S]*?)\(([\s\S]*?)\)}}$/g;
//Old Regex:: /\(\) => ([\s\S]*?)(\([\s\S]*?\))/g;
export const ACTION_ANONYMOUS_FUNC_REGEX = /\(\) => (({[\s\S]*?})|([\s\S]*?)(\([\s\S]*?\)))/g;
export const IS_URL_OR_MODAL = /^'.*'$/;
const modalSetter = (changeValue: any, currentValue: string) => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  let args: string[] = [];
  if (matches.length) {
    args = matches[0][2].split(",");
    if (isDynamicValue(changeValue)) {
      args[0] = `${changeValue.substring(2, changeValue.length - 2)}`;
    } else {
      args[0] = `'${changeValue}'`;
    }
  }
  return currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
};

export const modalGetter = (value: string) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  let name = "none";
  if (matches.length) {
    const modalName = matches[0][2].split(",")[0];
    if (IS_URL_OR_MODAL.test(modalName) || modalName === "") {
      name = modalName.substring(1, modalName.length - 1);
    } else {
      name = `{{${modalName}}}`;
    }
  }
  return name;
};

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);
  const js = stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `'${segment}'`;
      }
    })
    .join(" + ");
  return js;
};

export const JSToString = (js: string): string => {
  const segments = js.split(" + ");
  return segments
    .map((segment) => {
      if (segment.charAt(0) === "'") {
        return segment.substring(1, segment.length - 1);
      } else return "{{" + segment + "}}";
    })
    .join("");
};

export const argsStringToArray = (funcArgs: string): string[] => {
  const argsplitMatches = [...funcArgs.matchAll(FUNC_ARGS_REGEX)];
  const arr: string[] = [];
  let isPrevUndefined = true;
  argsplitMatches.forEach((match) => {
    const matchVal = match[0];
    if (!matchVal || matchVal === "") {
      if (isPrevUndefined) {
        arr.push(matchVal);
      }
      isPrevUndefined = true;
    } else {
      isPrevUndefined = false;
      arr.push(matchVal);
    }
  });
  return arr;
};

const textSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  let args: string[] = [];
  if (matches.length) {
    args = argsStringToArray(matches[0][2]);
    const jsVal = stringToJS(changeValue);
    args[argNum] = jsVal;
  }
  const result = currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
  return result;
};

const textGetter = (value: string, argNum: number) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const args = argsStringToArray(matches[0][2]);
    const arg = args[argNum];
    const stringFromJS = arg ? JSToString(arg.trim()) : arg;
    return stringFromJS;
  }
  return "";
};

const enumTypeSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  let args: string[] = [];
  if (matches.length) {
    args = argsStringToArray(matches[0][2]);
    args[argNum] = changeValue as string;
  }
  const result = currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
  return result;
};

const enumTypeGetter = (
  value: string,
  argNum: number,
  defaultValue = "",
): string => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const args = argsStringToArray(matches[0][2]);
    const arg = args[argNum];
    return arg ? arg.trim() : defaultValue;
  }
  return defaultValue;
};

export const ActionType = {
  none: "none",
  integration: "integration",
  showModal: "showModal",
  closeModal: "closeModal",
  navigateTo: "navigateTo",
  showAlert: "showAlert",
  storeValue: "storeValue",
  download: "download",
  copyToClipboard: "copyToClipboard",
  resetWidget: "resetWidget",
  jsFunction: "jsFunction",
  setInterval: "setInterval",
  clearInterval: "clearInterval",
  getGeolocation: "appsmith.geolocation.getCurrentPosition",
  watchGeolocation: "appsmith.geolocation.watchPosition",
  stopWatchGeolocation: "appsmith.geolocation.clearWatch",
};
type ActionType = typeof ActionType[keyof typeof ActionType];

const ViewTypes = {
  SELECTOR_VIEW: "SELECTOR_VIEW",
  KEY_VALUE_VIEW: "KEY_VALUE_VIEW",
  TEXT_VIEW: "TEXT_VIEW",
  BOOL_VIEW: "BOOL_VIEW",
};
type ViewTypes = typeof ViewTypes[keyof typeof ViewTypes];

type ViewProps = {
  label: string;
  get: Function;
  set: Function;
  value: string;
};
type SelectorViewProps = ViewProps & {
  options: TreeDropdownOption[];
  defaultText: string;
  getDefaults?: (value?: any) => any;
  displayValue?: string;
  selectedLabelModifier?: (
    option: TreeDropdownOption,
    displayValue?: string,
  ) => React.ReactNode;
  index?: number;
};

type KeyValueViewProps = ViewProps;
type TextViewProps = ViewProps & {
  index?: number;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
};

const views = {
  [ViewTypes.SELECTOR_VIEW]: function SelectorView(props: SelectorViewProps) {
    return (
      <FieldWrapper>
        <ControlWrapper isAction key={props.label}>
          {props.label && <label>{props.label}</label>}
          <TreeDropdown
            defaultText={props.defaultText}
            displayValue={props.displayValue}
            getDefaults={props.getDefaults}
            onSelect={(value, defaultValue?: string) => {
              props.set(value, defaultValue);
            }}
            optionTree={props.options}
            selectedLabelModifier={props.selectedLabelModifier}
            selectedValue={props.get(props.value, false) as string}
          />
        </ControlWrapper>
      </FieldWrapper>
    );
  },
  [ViewTypes.KEY_VALUE_VIEW]: function KeyValueView(props: KeyValueViewProps) {
    return (
      <ControlWrapper isAction key={props.label}>
        <KeyValueComponent
          addLabel={"Query Params"}
          pairs={props.get(props.value, false) as DropdownOption[]}
          updatePairs={(pageParams: DropdownOption[]) => props.set(pageParams)}
        />
      </ControlWrapper>
    );
  },
  [ViewTypes.TEXT_VIEW]: function TextView(props: TextViewProps) {
    return (
      <FieldWrapper>
        <ControlWrapper isAction key={props.label}>
          {props.label && <label>{props.label}</label>}
          <InputText
            additionalAutocomplete={props.additionalAutoComplete}
            evaluatedValue={props.get(props.value, false) as string}
            expected={{
              type: "string",
              example: "showMessage('Hello World!', 'info')",
              autocompleteDataType: AutocompleteDataType.STRING,
            }}
            label={props.label}
            onChange={(event: any) => {
              if (event.target) {
                props.set(event.target.value);
              } else {
                props.set(event);
              }
            }}
            value={props.get(props.value, props.index, false) as string}
          />
        </ControlWrapper>
      </FieldWrapper>
    );
  },
};

export enum FieldType {
  ACTION_SELECTOR_FIELD = "ACTION_SELECTOR_FIELD",
  JS_ACTION_SELECTOR_FIELD = "JS_ACTION_SELECTOR_FIELD",
  ON_SUCCESS_FIELD = "ON_SUCCESS_FIELD",
  ON_ERROR_FIELD = "ON_ERROR_FIELD",
  SHOW_MODAL_FIELD = "SHOW_MODAL_FIELD",
  CLOSE_MODAL_FIELD = "CLOSE_MODAL_FIELD",
  PAGE_SELECTOR_FIELD = "PAGE_SELECTOR_FIELD",
  KEY_VALUE_FIELD = "KEY_VALUE_FIELD",
  URL_FIELD = "URL_FIELD",
  ALERT_TEXT_FIELD = "ALERT_TEXT_FIELD",
  ALERT_TYPE_SELECTOR_FIELD = "ALERT_TYPE_SELECTOR_FIELD",
  KEY_TEXT_FIELD = "KEY_TEXT_FIELD",
  VALUE_TEXT_FIELD = "VALUE_TEXT_FIELD",
  QUERY_PARAMS_FIELD = "QUERY_PARAMS_FIELD",
  DOWNLOAD_DATA_FIELD = "DOWNLOAD_DATA_FIELD",
  DOWNLOAD_FILE_NAME_FIELD = "DOWNLOAD_FILE_NAME_FIELD",
  DOWNLOAD_FILE_TYPE_FIELD = "DOWNLOAD_FILE_TYPE_FIELD",
  COPY_TEXT_FIELD = "COPY_TEXT_FIELD",
  NAVIGATION_TARGET_FIELD = "NAVIGATION_TARGET_FIELD",
  WIDGET_NAME_FIELD = "WIDGET_NAME_FIELD",
  RESET_CHILDREN_FIELD = "RESET_CHILDREN_FIELD",
  ARGUMENT_KEY_VALUE_FIELD = "ARGUMENT_KEY_VALUE_FIELD",
  CALLBACK_FUNCTION_FIELD = "CALLBACK_FUNCTION_FIELD",
  DELAY_FIELD = "DELAY_FIELD",
  ID_FIELD = "ID_FIELD",
  CLEAR_INTERVAL_ID_FIELD = "CLEAR_INTERVAL_ID_FIELD",
}

type FieldConfig = {
  getter: Function;
  setter: Function;
  view: ViewTypes;
};

type FieldConfigs = Partial<Record<FieldType, FieldConfig>>;

const fieldConfigs: FieldConfigs = {
  [FieldType.ACTION_SELECTOR_FIELD]: {
    getter: (storedValue: string) => {
      let matches: any[] = [];
      if (storedValue) {
        matches = storedValue
          ? [...storedValue.matchAll(ACTION_TRIGGER_REGEX)]
          : [];
      }
      let mainFuncSelectedValue = ActionType.none;
      if (matches.length) {
        mainFuncSelectedValue = matches[0][1] || ActionType.none;
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
        case ActionType.integration:
          value = `${value}.run`;
          break;
        case ActionType.navigateTo:
          defaultParams = `'#', {}`;
          break;
        case ActionType.jsFunction:
          defaultArgs = option.args ? option.args : [];
          break;
        case ActionType.setInterval:
          defaultParams = "() => { \n\t // add code here \n}, 5000";
          break;
        case ActionType.getGeolocation:
          defaultParams = "(location) => { \n\t // add code here \n  }";
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
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
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
      return textGetter(value, 0);
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
};

function renderField(props: {
  onValueChange: Function;
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
}) {
  const { field } = props;
  const fieldType = field.field;
  const fieldConfig = fieldConfigs[fieldType];
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
          if (option.type === ActionType.integration) {
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
            [ActionType.navigateTo]: `'${props.pageDropdownOptions[0].label}'`,
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
        label = "Page Name";
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
        set: (value: string | DropdownOption, defaultValue?: string) => {
          const finalValueToSet = fieldConfig.setter(
            value,
            props.value,
            defaultValue,
          );
          props.onValueChange(finalValueToSet);
        },
        value: props.value,
        defaultText: defaultText,
        getDefaults: getDefaults,
        selectedLabelModifier: selectedLabelModifier,
        displayValue: displayValue ? displayValue : "",
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
          props.onValueChange(finalValueToSet);
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
          props.onValueChange(finalValueToSet);
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
        fieldLabel = "Page Name or URL";
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
        set: (value: string | DropdownOption) => {
          const finalValueToSet = fieldConfig.setter(value, props.value);
          props.onValueChange(finalValueToSet);
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

function Fields(props: {
  onValueChange: Function;
  value: string;
  fields: any;
  label?: string;
  integrationOptionTree: TreeDropdownOption[];
  widgetOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  depth: number;
  maxDepth: number;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
}) {
  const { fields, ...otherProps } = props;
  if (fields[0].field === FieldType.ACTION_SELECTOR_FIELD) {
    const remainingFields = fields.slice(1);
    return (
      <>
        {renderField({
          field: fields[0],
          ...otherProps,
        })}

        <ul className={props.depth === 1 ? "tree" : ""}>
          {remainingFields.map((field: any, index: number) => {
            if (Array.isArray(field)) {
              if (props.depth > props.maxDepth) {
                return null;
              }
              const selectorField = field[0];
              return (
                <li key={index}>
                  <Fields
                    additionalAutoComplete={props.additionalAutoComplete}
                    depth={props.depth + 1}
                    fields={field}
                    integrationOptionTree={props.integrationOptionTree}
                    key={selectorField.label + index}
                    label={selectorField.label}
                    maxDepth={props.maxDepth}
                    modalDropdownList={props.modalDropdownList}
                    onValueChange={(value: any) => {
                      const parentValue =
                        selectorField.getParentValue &&
                        selectorField.getParentValue(
                          value.substring(2, value.length - 2),
                        );
                      props.onValueChange(parentValue || value);
                    }}
                    pageDropdownOptions={props.pageDropdownOptions}
                    value={selectorField.value}
                    widgetOptionTree={props.widgetOptionTree}
                  />
                </li>
              );
            } else {
              return (
                <li key={field.field + index}>
                  {renderField({
                    field: field,
                    ...otherProps,
                  })}
                </li>
              );
            }
          })}
        </ul>
      </>
    );
  } else {
    const ui = fields.map((field: any, index: number) => {
      if (Array.isArray(field)) {
        if (props.depth > props.maxDepth) {
          return null;
        }
        const selectorField = field[0];
        return (
          <Fields
            depth={props.depth + 1}
            fields={field}
            integrationOptionTree={props.integrationOptionTree}
            key={index}
            label={selectorField.label}
            maxDepth={props.maxDepth}
            modalDropdownList={props.modalDropdownList}
            onValueChange={(value: any) => {
              const parentValue = selectorField.getParentValue(
                value.substring(2, value.length - 2),
              );
              props.onValueChange(parentValue);
            }}
            pageDropdownOptions={props.pageDropdownOptions}
            value={selectorField.value}
            widgetOptionTree={props.widgetOptionTree}
          />
        );
      } else {
        return renderField({
          field: field,
          ...otherProps,
        });
      }
    });
    return ui;
  }
}

export default Fields;
