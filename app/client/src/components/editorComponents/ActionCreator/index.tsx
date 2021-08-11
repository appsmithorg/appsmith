import React, { useMemo } from "react";
import { AppState } from "reducers";
import {
  getActionsForCurrentPage,
  getDBDatasources,
  getJSActionsForCurrentPage,
} from "selectors/entitiesSelector";
import { createActionRequest } from "actions/actionActions";
import {
  getModalDropdownList,
  getNextModalName,
} from "selectors/widgetSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { Datasource } from "entities/Datasource";
import Fields, {
  ACTION_TRIGGER_REGEX,
  ACTION_ANONYMOUS_FUNC_REGEX,
  ActionType,
  FieldType,
} from "./Fields";
import { TreeDropdownOption } from "components/ads/TreeDropdown";
import { useDispatch, useSelector } from "react-redux";
import { createModalAction } from "actions/widgetActions";
import { createNewQueryName } from "utils/AppsmithUtils";
import TreeStructure from "components/utils/TreeStructure";
import { getWidgets } from "sagas/selectors";
import { PluginType } from "entities/Action";
import { getDataTree } from "selectors/dataTreeSelectors";
import {
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
  JS_COLLECTION_ID_URL,
} from "constants/routes";
import history from "utils/history";
import { keyBy } from "lodash";
import {
  getPluginIcon,
  apiIcon,
  jsFileIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { getCurrentStep, getCurrentSubStep } from "sagas/OnboardingSagas";
import { OnboardingStep } from "constants/OnboardingConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import _ from "lodash";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSAction } from "actions/jsPaneActions";
/* eslint-disable @typescript-eslint/ban-types */
/* TODO: Function and object types need to be updated to enable the lint rule */

const baseOptions: any = [
  {
    label: "No Action",
    value: ActionType.none,
  },
  {
    label: "Execute a Query",
    value: ActionType.integration,
  },
  {
    label: "Execute JS Function",
    value: ActionType.jsFunction,
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

function getFieldFromValue(
  value: string | undefined,
  getParentValue?: Function,
  dataTree?: DataTree,
): any[] {
  const fields: any[] = [];
  if (!value) {
    return [
      {
        field: FieldType.ACTION_SELECTOR_FIELD,
        getParentValue,
        value,
      },
    ];
  }
  let entity;
  if (_.isString(value)) {
    const trimmedVal = value && value.replace(/(^{{)|(}}$)/g, "");
    const entityProps = getEntityNameAndPropertyPath(trimmedVal);
    entity = dataTree && dataTree[entityProps.entityName];
  }
  if (entity && "ENTITY_TYPE" in entity) {
    if (entity.ENTITY_TYPE === ENTITY_TYPE.ACTION) {
      fields.push({
        field: FieldType.ACTION_SELECTOR_FIELD,
        getParentValue,
        value,
      });
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
            const args = [
              ...matches[0][2].matchAll(ACTION_ANONYMOUS_FUNC_REGEX),
            ];
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
          dataTree,
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
            const args = [
              ...matches[0][2].matchAll(ACTION_ANONYMOUS_FUNC_REGEX),
            ];
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
          dataTree,
        );
        errorFields[0].label = "onError";
        fields.push(errorFields);
      }
      return fields;
    }
    if (entity.ENTITY_TYPE === ENTITY_TYPE.JSACTION) {
      const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
      if (!!matches) {
        const entityPropertyPath = matches[0][1];
        const { propertyPath } = getEntityNameAndPropertyPath(
          entityPropertyPath,
        );
        const path = propertyPath && propertyPath.replace("()", "");
        const argsProps =
          path &&
          entity.meta &&
          entity.meta[path] &&
          entity.meta[path].arguments;
        fields.push({
          field: FieldType.ACTION_SELECTOR_FIELD,
          getParentValue,
          value,
          args: argsProps ? argsProps : [],
        });
        if (argsProps && argsProps.length > 0) {
          for (let i = 0; i < argsProps.length; i++) {
            fields.push({
              field: FieldType.ARGUMENT_KEY_VALUE_FIELD,
              getParentValue,
              value,
              label: argsProps[i].name,
              index: i,
            });
          }
        }
      }
      return fields;
    }
  }
  fields.push({
    field: FieldType.ACTION_SELECTOR_FIELD,
    getParentValue,
    value,
  });
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

function useModalDropdownList() {
  const dispatch = useDispatch();
  const nextModalName = useSelector(getNextModalName);

  let finalList: TreeDropdownOption[] = [
    {
      label: "New Modal",
      value: "Modal",
      id: "create",
      icon: "plus",
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

function getIntegrationOptionsWithChildren(
  pageId: string,
  applicationId: string,
  plugins: any,
  options: TreeDropdownOption[],
  actions: any[],
  jsActions: Array<JSActionData>,
  datasources: Datasource[],
  createIntegrationOption: TreeDropdownOption,
  dispatch: any,
) {
  const createJSObject: TreeDropdownOption = {
    label: "Create New JS Object",
    value: "JSObject",
    id: "create",
    icon: "plus",
    className: "t--create-js-object-btn",
    onSelect: () => {
      dispatch(createNewJSAction(pageId));
    },
  };

  const queries = actions.filter(
    (action) => action.config.pluginType === PluginType.DB,
  );
  const apis = actions.filter(
    (action) =>
      action.config.pluginType === PluginType.API ||
      action.config.pluginType === PluginType.SAAS,
  );
  const option = options.find(
    (option) => option.value === ActionType.integration,
  );

  const jsOption = options.find(
    (option) => option.value === ActionType.jsFunction,
  );

  if (option) {
    option.children = [createIntegrationOption];
    apis.forEach((api) => {
      (option.children as TreeDropdownOption[]).push({
        label: api.config.name,
        id: api.config.id,
        value: api.config.name,
        type: option.value,
        icon:
          api.config.pluginType === PluginType.API
            ? apiIcon
            : getActionConfig(api.config.pluginType)?.getIcon(
                api.config,
                plugins[(api as any).config.datasource.pluginId],
              ),
      } as TreeDropdownOption);
    });
    queries.forEach((query) => {
      (option.children as TreeDropdownOption[]).push({
        label: query.config.name,
        id: query.config.id,
        value: query.config.name,
        type: option.value,
        icon: getActionConfig(query.config.pluginType)?.getIcon(
          query.config,
          plugins[(query as any).config.datasource.pluginId],
        ),
      } as TreeDropdownOption);
    });
    datasources.forEach((dataSource: Datasource) => {
      (option.children as TreeDropdownOption[]).push({
        label: dataSource.name,
        id: dataSource.id,
        value: dataSource.name,
        type: option.value,
        icon: getPluginIcon(plugins[dataSource.pluginId]) as React.ReactNode,
        onSelect: () => {
          const newQueryName = createNewQueryName(actions, pageId);
          dispatch(
            createActionRequest({
              name: newQueryName,
              pageId,
              datasource: {
                id: dataSource.id,
              },
              eventData: {
                actionType: "Query",
                from: "home-screen",
                dataSource: dataSource.name,
              },
              pluginId: dataSource.pluginId,
              actionConfiguration: {},
            }),
          );
        },
      } as TreeDropdownOption);
    });
  }
  if (jsOption) {
    jsOption.children = [createJSObject];
    jsActions.forEach((jsAction) => {
      if (jsAction.config.actions && jsAction.config.actions.length > 0) {
        const jsObject: TreeDropdownOption = {
          label: jsAction.config.name,
          id: jsAction.config.id,
          value: jsAction.config.name,
          type: jsOption.value,
        };
        (jsOption.children as TreeDropdownOption[]).push(
          jsObject as TreeDropdownOption,
        );
        if (jsObject) {
          const createJSFunction: TreeDropdownOption = {
            label: "Create New JS Function",
            value: "JSFunction",
            id: "create",
            icon: "plus",
            className: "t--create-js-function-btn",
            onSelect: () => {
              history.push(
                JS_COLLECTION_ID_URL(applicationId, pageId, jsAction.config.id),
              );
            },
          };
          jsObject.children = [createJSFunction];
          jsAction.config.actions.forEach((js: any) => {
            const jsArguments = js.actionConfiguration.jsArguments;
            const argValue: Array<any> = [];
            if (jsArguments && jsArguments.length) {
              jsArguments.forEach((arg: any) => {
                argValue.push(arg.value);
              });
            }
            const jsFunction = {
              label: js.name,
              id: js.id,
              value: jsAction.config.name + "." + js.name,
              type: jsOption.value,
              icon: jsFileIcon,
              args: argValue,
            };
            (jsObject.children as TreeDropdownOption[]).push(
              jsFunction as TreeDropdownOption,
            );
          });
        }
      }
    });
  }
  return options;
}

function useIntegrationsOptionTree() {
  const pageId = useSelector(getCurrentPageId) || "";
  const applicationId = useSelector(getCurrentApplicationId) || "";
  const datasources: Datasource[] = useSelector(getDBDatasources);
  const dispatch = useDispatch();
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups: any = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const actions = useSelector(getActionsForCurrentPage);
  // For onboarding
  const currentStep = useSelector(getCurrentStep);
  const currentSubStep = useSelector(getCurrentSubStep);
  const jsActions = useSelector(getJSActionsForCurrentPage);

  const integrationOptionTree = getIntegrationOptionsWithChildren(
    pageId,
    applicationId,
    pluginGroups,
    baseOptions,
    actions,
    jsActions,
    datasources,
    {
      label: "Create New Query",
      value: "datasources",
      id: "create",
      icon: "plus",
      className: "t--create-datasources-query-btn",
      onSelect: () => {
        // For onboarding
        if (currentStep === OnboardingStep.ADD_INPUT_WIDGET) {
          if (currentSubStep === 2) {
            dispatch({
              type: ReduxActionTypes.ONBOARDING_ADD_ONSUBMIT_BINDING,
            });
          }
        } else {
          history.push(
            INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
          );
        }
      },
    },
    dispatch,
  );
  return integrationOptionTree;
}

type ActionCreatorProps = {
  value: string;
  onValueChange: (newValue: string) => void;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
};

export function ActionCreator(props: ActionCreatorProps) {
  const dataTree = useSelector(getDataTree);
  const integrationOptionTree = useIntegrationsOptionTree();
  const widgetOptionTree = useWidgetOptionTree();
  const modalDropdownList = useModalDropdownList();
  const pageDropdownOptions = useSelector(getPageDropdownOptions);
  const fields = getFieldFromValue(props.value, undefined, dataTree);
  return (
    <TreeStructure>
      <Fields
        additionalAutoComplete={props.additionalAutoComplete}
        depth={1}
        fields={fields}
        integrationOptionTree={integrationOptionTree}
        maxDepth={1}
        modalDropdownList={modalDropdownList}
        onValueChange={props.onValueChange}
        pageDropdownOptions={pageDropdownOptions}
        value={props.value}
        widgetOptionTree={widgetOptionTree}
      />
    </TreeStructure>
  );
}
