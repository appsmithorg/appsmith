import React from "react";
import { AppState } from "reducers";
import { getActionsForCurrentPage } from "selectors/entitiesSelector";
import {
  getModalDropdownList,
  getNextModalName,
} from "selectors/widgetSelectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { DropdownOption } from "widgets/DropdownWidget";
import { useDispatch, useSelector } from "react-redux";
import TreeDropdown, { TreeDropdownOption } from "components/ads/TreeDropdown";
import {
  ControlWrapper,
  FieldWrapper,
} from "components/propertyControls/StyledControls";
import { KeyValueComponent } from "components/propertyControls/KeyValueComponent";
import { InputText } from "components/propertyControls/InputTextControl";
import { createModalAction } from "actions/widgetActions";
import { createNewApiName, createNewQueryName } from "utils/AppsmithUtils";
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import HightlightedCode from "components/editorComponents/HighlightedCode";
import TreeStructure from "components/utils/TreeStructure";
import {
  createNewApiAction,
  createNewQueryAction,
} from "actions/apiPaneActions";
import { NavigationTargetType } from "sagas/ActionExecutionSagas";
import { checkCurrentStep } from "sagas/OnboardingSagas";
import { OnboardingStep } from "constants/OnboardingConstants";
import { getWidgets } from "sagas/selectors";
import { Skin } from "constants/DefaultTheme";

/* eslint-disable @typescript-eslint/ban-types */
/* TODO: Function and object types need to be updated to enable the lint rule */

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

const FUNC_ARGS_REGEX = /((["][^"]*["])|([\[].*[\]])|([\{].*[\}])|(['][^']*['])|([\(].*[\)[=][>][{].*[}])|([^'",][^,"+]*[^'",]*))*/gi;
const ACTION_TRIGGER_REGEX = /^{{([\s\S]*?)\(([\s\S]*?)\)}}$/g;
//Old Regex:: /\(\) => ([\s\S]*?)(\([\s\S]*?\))/g;
const ACTION_ANONYMOUS_FUNC_REGEX = /\(\) => (({[\s\S]*?})|([\s\S]*?)(\([\s\S]*?\)))/g;
const IS_URL_OR_MODAL = /^'.*'$/;
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
  const { stringSegments, jsSnippets } = getDynamicBindings(string);
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

const argsStringToArray = (funcArgs: string): string[] => {
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

type ActionCreatorProps = {
  value: string;
  isValid: boolean;
  validationMessage?: string;
  onValueChange: (newValue: string) => void;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
};

const ActionType = {
  none: "none",
  api: "api",
  query: "query",
  showModal: "showModal",
  closeModal: "closeModal",
  navigateTo: "navigateTo",
  showAlert: "showAlert",
  storeValue: "storeValue",
  download: "download",
  copyToClipboard: "copyToClipboard",
  resetWidget: "resetWidget",
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
};

type KeyValueViewProps = ViewProps;
type TextViewProps = ViewProps & {
  isValid: boolean;
  validationMessage?: string;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
};

const views = {
  [ViewTypes.SELECTOR_VIEW]: function SelectorView(props: SelectorViewProps) {
    return (
      <FieldWrapper>
        <ControlWrapper key={props.label} isAction={true}>
          {props.label && <label>{props.label}</label>}
          <TreeDropdown
            optionTree={props.options}
            selectedValue={props.get(props.value, false) as string}
            defaultText={props.defaultText}
            onSelect={(value, defaultValue?: string) => {
              props.set(value, defaultValue);
            }}
            getDefaults={props.getDefaults}
            selectedLabelModifier={props.selectedLabelModifier}
            displayValue={props.displayValue}
          />
        </ControlWrapper>
      </FieldWrapper>
    );
  },
  [ViewTypes.KEY_VALUE_VIEW]: function KeyValueView(props: KeyValueViewProps) {
    return (
      <ControlWrapper key={props.label} isAction={true}>
        <KeyValueComponent
          pairs={props.get(props.value, false) as DropdownOption[]}
          addLabel={"Query Params"}
          updatePairs={(pageParams: DropdownOption[]) => props.set(pageParams)}
        />
      </ControlWrapper>
    );
  },
  [ViewTypes.TEXT_VIEW]: function TextView(props: TextViewProps) {
    return (
      <FieldWrapper>
        <ControlWrapper key={props.label} isAction={true}>
          {props.label && <label>{props.label}</label>}
          <InputText
            label={props.label}
            value={props.get(props.value, false) as string}
            onChange={(event: any) => {
              if (event.target) {
                props.set(event.target.value);
              } else {
                props.set(event);
              }
            }}
            expected={"string"}
            evaluatedValue={props.get(props.value, false) as string}
            isValid={props.isValid}
            errorMessage={props.validationMessage}
            additionalAutocomplete={props.additionalAutoComplete}
          />
        </ControlWrapper>
      </FieldWrapper>
    );
  },
};

const FieldType = {
  ACTION_SELECTOR_FIELD: "ACTION_SELECTOR_FIELD",
  ON_SUCCESS_FIELD: "ON_SUCCESS_FIELD",
  ON_ERROR_FIELD: "ON_ERROR_FIELD",
  SHOW_MODAL_FIELD: "SHOW_MODAL_FIELD",
  CLOSE_MODAL_FIELD: "CLOSE_MODAL_FIELD",
  PAGE_SELECTOR_FIELD: "PAGE_SELECTOR_FIELD",
  KEY_VALUE_FIELD: "KEY_VALUE_FIELD",
  URL_FIELD: "URL_FIELD",
  ALERT_TEXT_FIELD: "ALERT_TEXT_FIELD",
  ALERT_TYPE_SELECTOR_FIELD: "ALERT_TYPE_SELECTOR_FIELD",
  KEY_TEXT_FIELD: "KEY_TEXT_FIELD",
  VALUE_TEXT_FIELD: "VALUE_TEXT_FIELD",
  QUERY_PARAMS_FIELD: "QUERY_PARAMS_FIELD",
  DOWNLOAD_DATA_FIELD: "DOWNLOAD_DATA_FIELD",
  DOWNLOAD_FILE_NAME_FIELD: "DOWNLOAD_FILE_NAME_FIELD",
  DOWNLOAD_FILE_TYPE_FIELD: "DOWNLOAD_FILE_TYPE_FIELD",
  COPY_TEXT_FIELD: "COPY_TEXT_FIELD",
  NAVIGATION_TARGET_FIELD: "NAVIGATION_TARGET_FIELD",
  WIDGET_NAME_FIELD: "WIDGET_NAME_FIELD",
  RESET_CHILDREN_FIELD: "RESET_CHILDREN_FIELD",
};
type FieldType = typeof FieldType[keyof typeof FieldType];

type FieldConfig = {
  getter: Function;
  setter: Function;
  view: ViewTypes;
};

type FieldConfigs = Record<FieldType, FieldConfig>;

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
      switch (type) {
        case ActionType.api:
        case ActionType.query:
          value = `${value}.run`;
          break;
        default:
          break;
      }
      return value === "none" ? "" : `{{${value}()}}`;
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
};

const baseOptions: any = [
  {
    label: "No Action",
    value: ActionType.none,
  },
  {
    label: "Call An API",
    value: ActionType.api,
  },
  {
    label: "Execute a DB Query",
    value: ActionType.query,
  },
  {
    label: "Navigate To",
    value: ActionType.navigateTo,
  },
  {
    label: "Show Message",
    value: ActionType.showAlert,
  },
  {
    label: "Open Modal",
    value: ActionType.showModal,
  },
  {
    label: "Close Modal",
    value: ActionType.closeModal,
  },
  {
    label: "Store Value",
    value: ActionType.storeValue,
  },
  {
    label: "Download",
    value: ActionType.download,
  },
  {
    label: "Copy to Clipboard",
    value: ActionType.copyToClipboard,
  },
  {
    label: "Reset Widget",
    value: ActionType.resetWidget,
  },
];
function getOptionsWithChildren(
  options: TreeDropdownOption[],
  actions: ActionDataState,
  createActionOption: TreeDropdownOption,
) {
  const option = options.find((option) => option.value === ActionType.api);
  if (option) {
    option.children = [createActionOption];
    actions.forEach((action) => {
      (option.children as TreeDropdownOption[]).push({
        label: action.config.name,
        id: action.config.id,
        value: action.config.name,
        type: option.value,
      } as TreeDropdownOption);
    });
  }
  return options;
}

function getFieldFromValue(
  value: string | undefined,
  getParentValue?: Function,
): any[] {
  const fields: any[] = [
    {
      field: FieldType.ACTION_SELECTOR_FIELD,
      getParentValue,
      value,
    },
  ];
  if (!value) {
    return fields;
  }
  if (value.indexOf("run") !== -1) {
    const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
    if (matches.length) {
      const funcArgs = matches[0][2];
      const args = [...funcArgs.matchAll(ACTION_ANONYMOUS_FUNC_REGEX)];
      const successArg = args[0];
      const errorArg = args[1];
      let sucesssValue;
      if (successArg && successArg.length > 0) {
        sucesssValue = successArg[1] !== "{}" ? `{{${successArg[1]}}}` : ""; //successArg[1] + successArg[2];
      }
      const successFields = getFieldFromValue(
        sucesssValue,
        (changeValue: string) => {
          const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
          const args = [...matches[0][2].matchAll(ACTION_ANONYMOUS_FUNC_REGEX)];
          let successArg = args[0] ? args[0][0] : "() => {}";
          const errorArg = args[1] ? args[1][0] : "() => {}";
          successArg = changeValue.endsWith(")")
            ? `() => ${changeValue}`
            : `() => ${changeValue}()`;

          return value.replace(
            ACTION_TRIGGER_REGEX,
            `{{$1(${successArg}, ${errorArg})}}`,
          );
        },
      );
      successFields[0].label = "onSuccess";
      fields.push(successFields);

      let errorValue;
      if (errorArg && errorArg.length > 0) {
        errorValue = errorArg[1] !== "{}" ? `{{${errorArg[1]}}}` : ""; //errorArg[1] + errorArg[2];
      }
      const errorFields = getFieldFromValue(
        errorValue,
        (changeValue: string) => {
          const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
          const args = [...matches[0][2].matchAll(ACTION_ANONYMOUS_FUNC_REGEX)];
          const successArg = args[0] ? args[0][0] : "() => {}";
          let errorArg = args[1] ? args[1][0] : "() => {}";
          errorArg = changeValue.endsWith(")")
            ? `() => ${changeValue}`
            : `() => ${changeValue}()`;
          return value.replace(
            ACTION_TRIGGER_REGEX,
            `{{$1(${successArg}, ${errorArg})}}`,
          );
        },
      );
      errorFields[0].label = "onError";
      fields.push(errorFields);
    }
    return fields;
  }
  if (value.indexOf("navigateTo") !== -1) {
    fields.push({
      field: FieldType.URL_FIELD,
    });
    fields.push({
      field: FieldType.QUERY_PARAMS_FIELD,
    });
    fields.push({
      field: FieldType.NAVIGATION_TARGET_FIELD,
    });
  }

  if (value.indexOf("showModal") !== -1) {
    fields.push({
      field: FieldType.SHOW_MODAL_FIELD,
    });
  }
  if (value.indexOf("closeModal") !== -1) {
    fields.push({
      field: FieldType.CLOSE_MODAL_FIELD,
    });
  }
  if (value.indexOf("showAlert") !== -1) {
    fields.push(
      {
        field: FieldType.ALERT_TEXT_FIELD,
      },
      {
        field: FieldType.ALERT_TYPE_SELECTOR_FIELD,
      },
    );
  }
  if (value.indexOf("storeValue") !== -1) {
    fields.push(
      {
        field: FieldType.KEY_TEXT_FIELD,
      },
      {
        field: FieldType.VALUE_TEXT_FIELD,
      },
    );
  }
  if (value.indexOf("resetWidget") !== -1) {
    fields.push(
      {
        field: FieldType.WIDGET_NAME_FIELD,
      },
      {
        field: FieldType.RESET_CHILDREN_FIELD,
      },
    );
  }
  if (value.indexOf("download") !== -1) {
    fields.push(
      {
        field: FieldType.DOWNLOAD_DATA_FIELD,
      },
      {
        field: FieldType.DOWNLOAD_FILE_NAME_FIELD,
      },
      {
        field: FieldType.DOWNLOAD_FILE_TYPE_FIELD,
      },
    );
  }
  if (value.indexOf("copyToClipboard") !== -1) {
    fields.push({
      field: FieldType.COPY_TEXT_FIELD,
    });
  }
  return fields;
}

function getPageDropdownOptions(state: AppState) {
  return state.entities.pageList.pages.map((page) => ({
    label: page.pageName,
    id: page.pageId,
    value: `'${page.pageName}'`,
  }));
}

function renderField(props: {
  onValueChange: Function;
  value: string;
  field: any;
  label?: string;
  isValid: boolean;
  validationMessage?: string;
  apiOptionTree: TreeDropdownOption[];
  widgetOptionTree: TreeDropdownOption[];
  queryOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  depth: number;
  maxDepth: number;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
}) {
  const { field } = props;
  const fieldType = field.field;
  const fieldConfig = fieldConfigs[fieldType];
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
      let options = props.apiOptionTree;
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
        selectedLabelModifier = (
          option: TreeDropdownOption,
          displayValue?: string,
        ) => {
          if (
            option.type === ActionType.api ||
            option.type === ActionType.query
          ) {
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
        defaultText = "false";
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
        defaultText = "Navigation target";
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
    case FieldType.KEY_VALUE_FIELD:
      viewElement = (view as (props: SelectorViewProps) => JSX.Element)({
        options: props.apiOptionTree,
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
      let fieldLabel = "";
      if (fieldType === FieldType.ALERT_TEXT_FIELD) {
        fieldLabel = "Message";
      } else if (fieldType === FieldType.URL_FIELD) {
        fieldLabel = "Page Name";
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
      }
      viewElement = (view as (props: TextViewProps) => JSX.Element)({
        label: fieldLabel,
        get: fieldConfig.getter,
        set: (value: string | DropdownOption) => {
          const finalValueToSet = fieldConfig.setter(value, props.value);
          props.onValueChange(finalValueToSet);
        },
        value: props.value,
        isValid: props.isValid,
        validationMessage: props.validationMessage,
        additionalAutoComplete: props.additionalAutoComplete,
      });
      break;
    default:
      break;
  }

  return <div key={fieldType}>{viewElement}</div>;
}

function Fields(props: {
  onValueChange: Function;
  value: string;
  fields: any;
  label?: string;
  isValid: boolean;
  validationMessage?: string;
  apiOptionTree: TreeDropdownOption[];
  widgetOptionTree: TreeDropdownOption[];
  queryOptionTree: TreeDropdownOption[];
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
      <React.Fragment>
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
                    value={selectorField.value}
                    fields={field}
                    label={selectorField.label}
                    isValid={props.isValid}
                    validationMessage={props.validationMessage}
                    apiOptionTree={props.apiOptionTree}
                    widgetOptionTree={props.widgetOptionTree}
                    queryOptionTree={props.queryOptionTree}
                    modalDropdownList={props.modalDropdownList}
                    pageDropdownOptions={props.pageDropdownOptions}
                    depth={props.depth + 1}
                    maxDepth={props.maxDepth}
                    onValueChange={(value: any) => {
                      const parentValue = selectorField.getParentValue(
                        value.substring(2, value.length - 2),
                      );
                      props.onValueChange(parentValue);
                    }}
                    additionalAutoComplete={props.additionalAutoComplete}
                  />
                </li>
              );
            } else {
              return (
                <li key={field.field}>
                  {renderField({
                    field: field,
                    ...otherProps,
                  })}
                </li>
              );
            }
          })}
        </ul>
      </React.Fragment>
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
            key={index}
            value={selectorField.value}
            fields={field}
            label={selectorField.label}
            isValid={props.isValid}
            validationMessage={props.validationMessage}
            apiOptionTree={props.apiOptionTree}
            widgetOptionTree={props.widgetOptionTree}
            queryOptionTree={props.queryOptionTree}
            modalDropdownList={props.modalDropdownList}
            pageDropdownOptions={props.pageDropdownOptions}
            depth={props.depth + 1}
            maxDepth={props.maxDepth}
            onValueChange={(value: any) => {
              const parentValue = selectorField.getParentValue(
                value.substring(2, value.length - 2),
              );
              props.onValueChange(parentValue);
            }}
          />
        );
      } else {
        return renderField({
          field: field,
          ...otherProps,
        });
      }
    });
    return <>{ui}</>;
  }
}

function useModalDropdownList() {
  const dispatch = useDispatch();
  const nextModalName = useSelector(getNextModalName);

  let finalList: TreeDropdownOption[] = [
    {
      label: "New Modal",
      value: "Modal",
      id: "create",
      className: "t--create-modal-btn",
      onSelect: (option: TreeDropdownOption, setter?: Function) => {
        const modalName = nextModalName;
        if (setter) {
          setter({
            value: `${modalName}`,
          });
          dispatch(createModalAction(nextModalName));
        }
      },
    },
  ];

  finalList = finalList.concat(
    (useSelector(getModalDropdownList) || []) as TreeDropdownOption[],
  );

  return finalList;
}

function useApiOptionTree() {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId) || "";

  const actions = useSelector(getActionsForCurrentPage).filter(
    (action) => action.config.pluginType === "API",
  );
  let filteredBaseOptions = baseOptions;

  // For onboarding
  const filterOptions = useSelector((state: AppState) =>
    checkCurrentStep(state, OnboardingStep.ADD_INPUT_WIDGET),
  );
  if (filterOptions) {
    filteredBaseOptions = baseOptions.filter(
      (item: any) => item.value === ActionType.query,
    );
  }

  const apiOptionTree = getOptionsWithChildren(filteredBaseOptions, actions, {
    label: "Create API",
    value: "api",
    id: "create",
    className: "t--create-api-btn",
    icon: "plus",
    onSelect: (option: TreeDropdownOption, setter?: Function) => {
      const apiName = createNewApiName(actions, pageId);
      if (setter) {
        setter({
          value: `${apiName}`,
          type: ActionType.api,
        });
        dispatch(createNewApiAction(pageId, "API_PANE"));
      }
    },
  });
  return apiOptionTree;
}

function useWidgetOptionTree() {
  const widgets = useSelector(getWidgets) || {};
  return Object.values(widgets)
    .filter((w) => w.type !== "CANVAS_WIDGET" && w.type !== "BUTTON_WIDGET")
    .map((w) => {
      return {
        label: w.widgetName,
        id: w.widgetName,
        value: `"${w.widgetName}"`,
      };
    });
}
function getQueryOptionsWithChildren(
  options: TreeDropdownOption[],
  queries: ActionDataState,
  createQueryOption: TreeDropdownOption,
) {
  const option = options.find((option) => option.value === ActionType.query);
  if (option) {
    option.children = [createQueryOption];
    queries.forEach((query) => {
      (option.children as TreeDropdownOption[]).push({
        label: query.config.name,
        id: query.config.id,
        value: query.config.name,
        type: option.value,
      } as TreeDropdownOption);
    });
  }
  return options;
}

function useQueryOptionTree() {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId) || "";

  const queries = useSelector(getActionsForCurrentPage).filter(
    (action) => action.config.pluginType === "DB",
  );
  const queryOptionTree = getQueryOptionsWithChildren(baseOptions, queries, {
    label: "Create Query",
    value: "query",
    id: "create",
    icon: "plus",
    className: "t--create-query-btn",
    onSelect: (option: TreeDropdownOption, setter?: Function) => {
      const queryName = createNewQueryName(queries, pageId);
      if (setter) {
        setter({
          value: `${queryName}`,
          type: ActionType.query,
        });
        dispatch(createNewQueryAction(pageId, "QUERY_PANE"));
      }
    },
  });
  return queryOptionTree;
}

export function ActionCreator(props: ActionCreatorProps) {
  const apiOptionTree = useApiOptionTree();
  const widgetOptionTree = useWidgetOptionTree();
  const queryOptionTree = useQueryOptionTree();
  const modalDropdownList = useModalDropdownList();
  const pageDropdownOptions = useSelector(getPageDropdownOptions);
  const fields = getFieldFromValue(props.value);
  return (
    <TreeStructure>
      <Fields
        value={props.value}
        fields={fields}
        isValid={props.isValid}
        validationMessage={props.validationMessage}
        apiOptionTree={apiOptionTree}
        widgetOptionTree={widgetOptionTree}
        queryOptionTree={queryOptionTree}
        modalDropdownList={modalDropdownList}
        pageDropdownOptions={pageDropdownOptions}
        onValueChange={props.onValueChange}
        depth={1}
        maxDepth={1}
        additionalAutoComplete={props.additionalAutoComplete}
      />
    </TreeStructure>
  );
}
