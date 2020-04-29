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
import { useSelector, useDispatch } from "react-redux";
import TreeDropdown, { TreeDropdownOption } from "./TreeDropdown";
import { ControlWrapper } from "components/propertyControls/StyledControls";
import { KeyValueComponent } from "components/propertyControls/KeyValueComponent";
import { InputText } from "components/propertyControls/InputTextControl";
import { createModalAction } from "actions/widgetActions";
import { createActionRequest } from "actions/actionActions";
import { DEFAULT_API_ACTION } from "constants/ApiEditorConstants";
import { createNewApiName } from "utils/AppsmithUtils";
import { isDynamicValue } from "utils/DynamicBindingUtils";

const ALERT_STYLE_OPTIONS = [
  { label: "Info", value: "'info'", id: "info" },
  { label: "Success", value: "'success'", id: "success" },
  { label: "Error", value: "'error'", id: "error" },
  { label: "Warning", value: "'warning'", id: "warning" },
];
const ACTION_TRIGGER_REGEX = /^{{([\s\S]*?)\(([\s\S]*?)\)}}$/g;
const ACTION_ANONYMOUS_FUNC_REGEX = /\(\) => ([\s\S]*?)(\([\s\S]*?\))/g;
const IS_URL_OR_MODAL = /^'.*'$/;
const modalSetter = (changeValue: any, currentValue: string) => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",");
  if (isDynamicValue(changeValue)) {
    args[0] = `${changeValue.substring(2, changeValue.length - 2)}`;
  } else {
    args[0] = `'${changeValue}'`;
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

// const urlSetter = (changeValue: any, currentValue: string): string => {
//   return currentValue.replace(ACTION_TRIGGER_REGEX, `{{$1('${changeValue}')}}`);
// };

// export const textGetter = (value: string) => {
//   const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
//   if (matches.length) {
//     const stringValue = matches[0][2];
//     return stringValue.substring(1, stringValue.length - 1);
//   }
//   return "";
// };

const alertTextSetter = (changeValue: any, currentValue: string): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",");
  args[0] = `'${changeValue}'`;
  const result = currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
  return result;
};

const alertTextGetter = (value: string) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const funcArgs = matches[0][2];
    const arg = funcArgs.split(",")[0];
    return arg.substring(1, arg.length - 1);
  }
  return "";
};

const alertTypeSetter = (changeValue: any, currentValue: string): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",");
  args[1] = changeValue as string;
  return currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
};

const alertTypeGetter = (value: string) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const funcArgs = matches[0][2];
    const arg = funcArgs.split(",")[1];
    return arg ? arg.trim() : "'primary'";
  }
  return "";
};

type ActionCreatorProps = {
  value: string;
  isValid: boolean;
  validationMessage?: string;
  onValueChange: (newValue: string) => void;
};

const ActionType = {
  none: "none",
  api: "api",
  showModal: "showModal",
  closeModal: "closeModal",
  navigateTo: "navigateTo",
  showAlert: "showAlert",
};
type ActionType = typeof ActionType[keyof typeof ActionType];

const ViewTypes = {
  SELECTOR_VIEW: "SELECTOR_VIEW",
  KEY_VALUE_VIEW: "KEY_VALUE_VIEW",
  TEXT_VIEW: "TEXT_VIEW",
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
  getDefaults?: Function;
  selectedLabelModifier?: (option: TreeDropdownOption) => string;
};

type KeyValueViewProps = ViewProps;
type TextViewProps = ViewProps & {
  isValid: boolean;
  validationMessage?: string;
};

const views = {
  [ViewTypes.SELECTOR_VIEW]: function SelectorView(props: SelectorViewProps) {
    return (
      <ControlWrapper key={props.label}>
        <label>{props.label}</label>
        <TreeDropdown
          optionTree={props.options}
          selectedValue={props.get(props.value, false) as string}
          defaultText={props.defaultText}
          onSelect={(value, defaultValue?: string) => {
            props.set(value, defaultValue);
          }}
          getDefaults={props.getDefaults}
          selectedLabelModifier={props.selectedLabelModifier}
        />
      </ControlWrapper>
    );
  },
  [ViewTypes.KEY_VALUE_VIEW]: function KeyValueView(props: KeyValueViewProps) {
    return (
      <ControlWrapper key={props.label}>
        <KeyValueComponent
          pairs={props.get(props.value, false) as DropdownOption[]}
          addLabel={"QueryParam"}
          updatePairs={(pageParams: DropdownOption[]) => props.set(pageParams)}
        />
      </ControlWrapper>
    );
  },
  [ViewTypes.TEXT_VIEW]: function TextView(props: TextViewProps) {
    return (
      <ControlWrapper key={props.label}>
        <label>{props.label}</label>
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
          isValid={props.isValid}
          validationMessage={props.validationMessage}
        />
      </ControlWrapper>
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
    setter: (
      option: TreeDropdownOption,
      currentValue: string,
      defaultValue?: string,
    ) => {
      const type: ActionType = option.type || option.value;
      let value = option.value;
      switch (type) {
        case ActionType.api:
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
      return modalGetter(value);
    },
    setter: (option: any, currentValue: string) => {
      return modalSetter(option.value, currentValue);
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
      return modalGetter(value);
    },
    setter: (value: string, currentValue: string) => {
      return modalSetter(value, currentValue);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.ALERT_TEXT_FIELD]: {
    getter: (value: string) => {
      return alertTextGetter(value);
    },
    setter: (value: string, currentValue: string) => {
      return alertTextSetter(value, currentValue);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.ALERT_TYPE_SELECTOR_FIELD]: {
    getter: (value: any) => {
      return alertTypeGetter(value);
    },
    setter: (option: any, currentValue: string) => {
      return alertTypeSetter(option.value, currentValue);
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
    label: "Call API",
    value: ActionType.api,
  },
  {
    label: "Show Modal",
    value: ActionType.showModal,
  },
  {
    label: "Close Modal",
    value: ActionType.closeModal,
  },
  {
    label: "Navigate To",
    value: ActionType.navigateTo,
  },
  {
    label: "Show Alert",
    value: ActionType.showAlert,
  },
];
function getOptionsWithChildren(
  options: TreeDropdownOption[],
  actions: ActionDataState,
  createActionOption: TreeDropdownOption,
) {
  const option = options.find(option => option.value === ActionType.api);
  if (option) {
    option.children = [createActionOption];
    actions.forEach(action => {
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
      getParentValue: getParentValue,
      value: value,
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
        sucesssValue = successArg[1] + successArg[2];
      }
      const successFields = getFieldFromValue(
        `{{${sucesssValue}}}`,
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
        errorValue = errorArg[1] + errorArg[2];
      }
      const errorFields = getFieldFromValue(
        `{{${errorValue}}}`,
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
  return fields;
}

function getPageDropdownOptions(state: AppState) {
  return state.entities.pageList.pages.map(page => ({
    label: page.pageName,
    id: page.pageId,
    value: `'${page.pageName}'`,
  }));
}

function Fields(props: {
  onValueChange: Function;
  value: string;
  fields: any;
  label?: string;
  isValid: boolean;
  validationMessage?: string;
  apiOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
}) {
  const ui = props.fields.map((field: any) => {
    if (Array.isArray(field)) {
      const selectorField = field[0];
      return (
        <Fields
          value={selectorField.value}
          fields={field}
          label={selectorField.label}
          isValid={props.isValid}
          validationMessage={props.validationMessage}
          apiOptionTree={props.apiOptionTree}
          modalDropdownList={props.modalDropdownList}
          pageDropdownOptions={props.pageDropdownOptions}
          onValueChange={(value: any) => {
            props.onValueChange(
              selectorField.getParentValue(
                value.substring(2, value.length - 2),
              ),
            );
          }}
        />
      );
    }
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
        let label = "";
        let defaultText = "Select Action";
        let options = props.apiOptionTree;
        let selectedLabelModifier = undefined;
        let getDefaults = undefined;
        if (fieldType === FieldType.ACTION_SELECTOR_FIELD) {
          label = props.label || "";
          selectedLabelModifier = (option: TreeDropdownOption) => {
            if (option.type === ActionType.api) {
              return `Call ${option.label}`;
            }
            return option.label;
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
        if (fieldType === FieldType.PAGE_SELECTOR_FIELD) {
          label = "Page Name";
          options = props.pageDropdownOptions;
          defaultText = "Select Page";
        }
        if (fieldType === FieldType.ALERT_TYPE_SELECTOR_FIELD) {
          label = "type";
          options = ALERT_STYLE_OPTIONS;
          defaultText = "Select type";
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
        viewElement = (view as (props: TextViewProps) => JSX.Element)({
          label: "",
          get: fieldConfig.getter,
          set: (value: string | DropdownOption) => {
            const finalValueToSet = fieldConfig.setter(value, props.value);
            props.onValueChange(finalValueToSet);
          },
          value: props.value,
          isValid: props.isValid,
          validationMessage: props.validationMessage,
        });
        break;
      default:
        break;
    }

    return <div key={fieldType}>{viewElement}</div>;
  });

  return <>{ui}</>;
}

function useModalDropdownList() {
  const dispatch = useDispatch();
  const nextModalName = useSelector(getNextModalName);

  let finalList: TreeDropdownOption[] = [
    {
      label: "Create Modal",
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

  const actions = useSelector(getActionsForCurrentPage);
  const apiOptionTree = getOptionsWithChildren(baseOptions, actions, {
    label: "Create Api",
    value: "api",
    id: "create",
    className: "t--create-api-btn",
    onSelect: (option: TreeDropdownOption, setter?: Function) => {
      const apiName = createNewApiName(actions, pageId);
      if (setter) {
        setter({
          value: `${apiName}.run`,
          type: ActionType.api,
        });
        dispatch(
          createActionRequest({
            ...DEFAULT_API_ACTION,
            name: apiName,
            pageId: pageId,
          }),
        );
      }
    },
  });
  return apiOptionTree;
}

export function ActionCreator(props: ActionCreatorProps) {
  const apiOptionTree = useApiOptionTree();
  const modalDropdownList = useModalDropdownList();
  const pageDropdownOptions = useSelector(getPageDropdownOptions);
  const fields = getFieldFromValue(props.value);

  return (
    <Fields
      value={props.value}
      fields={fields}
      isValid={props.isValid}
      validationMessage={props.validationMessage}
      apiOptionTree={apiOptionTree}
      modalDropdownList={modalDropdownList}
      pageDropdownOptions={pageDropdownOptions}
      onValueChange={props.onValueChange}
    />
  );
}
