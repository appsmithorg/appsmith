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
import {
  FieldWrapper,
  ControlWrapper,
  TreeStructureHorizontalWrapper,
  TreeStructureVerticalWrapper,
} from "components/propertyControls/StyledControls";
import { KeyValueComponent } from "components/propertyControls/KeyValueComponent";
import { InputText } from "components/propertyControls/InputTextControl";
import { createModalAction } from "actions/widgetActions";
import { createNewApiName, createNewQueryName } from "utils/AppsmithUtils";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import HightlightedCode from "components/editorComponents/HighlightedCode";
import {
  createNewApiAction,
  createNewQueryAction,
} from "actions/apiPaneActions";

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
  query: "query",
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
  level: number;
  levelSeparator?: string;
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
  level: number;
  levelSeparator?: string;
};

const views = {
  [ViewTypes.SELECTOR_VIEW]: function SelectorView(props: SelectorViewProps) {
    return (
      <FieldWrapper>
        <ControlWrapper key={props.label} level={props.level}>
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
        {props.level ? (
          <TreeStructureHorizontalWrapper
            label={props.label}
            level={props.level}
          />
        ) : null}
        {(() => {
          if (
            props.level &&
            props.levelSeparator &&
            props.levelSeparator === "odd"
          ) {
            const treeStructureVerticalWrappers = new Array(props.level)
              .fill("")
              .map((i, index) => {
                return (
                  <TreeStructureVerticalWrapper
                    key={index}
                    label={props.label}
                    level={index + 1}
                  />
                );
              });
            return treeStructureVerticalWrappers;
          } else if (props.level) {
            return (
              <TreeStructureVerticalWrapper
                label={props.label}
                level={props.level}
              />
            );
          } else {
            return [];
          }
        })()}
      </FieldWrapper>
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
      <FieldWrapper>
        <ControlWrapper key={props.label} level={props.level}>
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
            isValid={props.isValid}
            errorMessage={props.validationMessage}
          />
        </ControlWrapper>
        {props.level ? (
          <TreeStructureHorizontalWrapper
            label={props.label}
            level={props.level}
          />
        ) : null}
        {(() => {
          if (
            props.level &&
            props.levelSeparator &&
            props.levelSeparator === "odd"
          ) {
            const treeStructureVerticalWrappers = new Array(props.level)
              .fill("")
              .map((i, index) => {
                return (
                  <TreeStructureVerticalWrapper
                    key={index}
                    label={props.label}
                    level={index + 1}
                  />
                );
              });
            return treeStructureVerticalWrappers;
          } else if (props.level) {
            return (
              <TreeStructureVerticalWrapper
                label={props.label}
                level={props.level}
              />
            );
          } else {
            return [];
          }
        })()}
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
    label: "Open Popup",
    value: ActionType.showModal,
  },
  {
    label: "Close Popup",
    value: ActionType.closeModal,
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
  level: number,
  levelSeparator?: string,
  getParentValue?: Function,
): any[] {
  const fields: any[] = [
    {
      field: FieldType.ACTION_SELECTOR_FIELD,
      getParentValue,
      value,
      level,
      levelSeparator,
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
        level + 1,
        "odd",
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
      successFields[0].level = level + 1;
      fields.push(successFields);

      let errorValue;
      if (errorArg && errorArg.length > 0) {
        errorValue = errorArg[1] + errorArg[2];
      }
      const errorFields = getFieldFromValue(
        `{{${errorValue}}}`,
        level + 1,
        "even",
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
      errorFields[0].level = level + 1;
      fields.push(errorFields);
    }
    return fields;
  }

  if (value.indexOf("navigateTo") !== -1) {
    fields.push({
      field: FieldType.URL_FIELD,
      level: level + 1,
      levelSeparator,
    });
  }

  if (value.indexOf("showModal") !== -1) {
    fields.push({
      field: FieldType.SHOW_MODAL_FIELD,
      level: level + 1,
      levelSeparator,
    });
  }
  if (value.indexOf("closeModal") !== -1) {
    fields.push({
      field: FieldType.CLOSE_MODAL_FIELD,
      level: level + 1,
      levelSeparator,
    });
  }
  if (value.indexOf("showAlert") !== -1) {
    fields.push(
      {
        field: FieldType.ALERT_TEXT_FIELD,
        level: level + 1,
        levelSeparator,
      },
      {
        field: FieldType.ALERT_TYPE_SELECTOR_FIELD,
        level: level + 1,
        levelSeparator,
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
  queryOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  depth: number;
  maxDepth: number;
}) {
  const ui = props.fields.map((field: any) => {
    if (Array.isArray(field)) {
      if (props.depth > props.maxDepth) {
        return null;
      }
      const selectorField = field[0];
      return (
        <Fields
          value={selectorField.value}
          fields={field}
          label={selectorField.label}
          isValid={props.isValid}
          validationMessage={props.validationMessage}
          apiOptionTree={props.apiOptionTree}
          queryOptionTree={props.queryOptionTree}
          modalDropdownList={props.modalDropdownList}
          pageDropdownOptions={props.pageDropdownOptions}
          depth={props.depth + 1}
          maxDepth={props.maxDepth}
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
        let displayValue = undefined;
        let getDefaults = undefined;
        if (fieldType === FieldType.ACTION_SELECTOR_FIELD) {
          label = props.label || "";
          displayValue =
            field.value !== "{{undefined}}" && field.value !== "{{()}}"
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
                <HightlightedCode codeText={`{{${option.label}.run()}}`} />
              );
            } else if (displayValue) {
              return <HightlightedCode codeText={displayValue} />;
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
          displayValue: displayValue ? displayValue : "",
          level: field.level,
          levelSeparator: field.levelSeparator,
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
          level: field.level,
          levelSeparator: field.levelSeparator,
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
          level: field.level,
          levelSeparator: field.levelSeparator,
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
      label: "Open Popup",
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
    action => action.config.pluginType === "API",
  );
  const apiOptionTree = getOptionsWithChildren(baseOptions, actions, {
    label: "Create API",
    value: "api",
    id: "create",
    className: "t--create-api-btn",
    onSelect: (option: TreeDropdownOption, setter?: Function) => {
      const apiName = createNewApiName(actions, pageId);
      if (setter) {
        setter({
          value: `${apiName}`,
          type: ActionType.api,
        });
        dispatch(createNewApiAction(pageId));
      }
    },
  });
  return apiOptionTree;
}

function getQueryOptionsWithChildren(
  options: TreeDropdownOption[],
  queries: ActionDataState,
  createQueryOption: TreeDropdownOption,
) {
  const option = options.find(option => option.value === ActionType.query);
  if (option) {
    option.children = [createQueryOption];
    queries.forEach(query => {
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
    action => action.config.pluginType === "DB",
  );
  const queryOptionTree = getQueryOptionsWithChildren(baseOptions, queries, {
    label: "Create Query",
    value: "query",
    id: "create",
    className: "t--create-query-btn",
    onSelect: (option: TreeDropdownOption, setter?: Function) => {
      const queryName = createNewQueryName(queries, pageId);
      if (setter) {
        setter({
          value: `${queryName}`,
          type: ActionType.query,
        });
        dispatch(createNewQueryAction(pageId));
      }
    },
  });
  return queryOptionTree;
}

export function ActionCreator(props: ActionCreatorProps) {
  const apiOptionTree = useApiOptionTree();
  const queryOptionTree = useQueryOptionTree();
  const modalDropdownList = useModalDropdownList();
  const pageDropdownOptions = useSelector(getPageDropdownOptions);
  const fields = getFieldFromValue(props.value, 0);
  return (
    <Fields
      value={props.value}
      fields={fields}
      isValid={props.isValid}
      validationMessage={props.validationMessage}
      apiOptionTree={apiOptionTree}
      queryOptionTree={queryOptionTree}
      modalDropdownList={modalDropdownList}
      pageDropdownOptions={pageDropdownOptions}
      onValueChange={props.onValueChange}
      depth={1}
      maxDepth={1}
    />
  );
}
