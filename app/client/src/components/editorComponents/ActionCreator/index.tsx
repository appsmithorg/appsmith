import { createActionRequest } from "actions/pluginActionActions";
import { createModalAction } from "actions/widgetActions";
import { TreeDropdownOption } from "components/ads/TreeDropdown";
import TreeStructure from "components/utils/TreeStructure";
import { OnboardingStep } from "constants/OnboardingConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import { PluginType } from "entities/Action";
import { Datasource } from "entities/Datasource";
import { keyBy } from "lodash";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import {
  apiIcon,
  getPluginIcon,
  jsFunctionIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getCurrentStep, getCurrentSubStep } from "sagas/OnboardingSagas";
import { getWidgetOptionsTree } from "sagas/selectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getActionsForCurrentPage,
  getDBDatasources,
  getJSCollectionsForCurrentPage,
  getPageListAsOptions,
} from "selectors/entitiesSelector";
import {
  getModalDropdownList,
  getNextModalName,
} from "selectors/widgetSelectors";
import { createNewQueryName } from "utils/AppsmithUtils";
import history from "utils/history";
import Fields, {
  ActionType,
  ACTION_ANONYMOUS_FUNC_REGEX,
  ACTION_TRIGGER_REGEX,
  FieldType,
} from "./Fields";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import _ from "lodash";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSCollection } from "actions/jsPaneActions";
import getFeatureFlags from "utils/featureFlags";
import { JSAction, Variable } from "entities/JSCollection";
import {
  createMessage,
  EXECUTE_JS_FUNCTION,
  RESET_WIDGET,
  COPY_TO_CLIPBOARD,
  DOWNLOAD,
  STORE_VALUE,
  CLOSE_MODAL,
  OPEN_MODAL,
  SHOW_MESSAGE,
  NAVIGATE_TO,
  EXECUTE_A_QUERY,
  NO_ACTION,
} from "constants/messages";
/* eslint-disable @typescript-eslint/ban-types */
/* TODO: Function and object types need to be updated to enable the lint rule */
const isJSEditorEnabled = getFeatureFlags().JS_EDITOR;
const baseOptions: any = [
  {
    label: createMessage(NO_ACTION),
    value: ActionType.none,
  },
  {
    label: createMessage(EXECUTE_A_QUERY),
    value: ActionType.integration,
  },
  {
    label: createMessage(NAVIGATE_TO),
    value: ActionType.navigateTo,
  },
  {
    label: createMessage(SHOW_MESSAGE),
    value: ActionType.showAlert,
  },
  {
    label: createMessage(OPEN_MODAL),
    value: ActionType.showModal,
  },
  {
    label: createMessage(CLOSE_MODAL),
    value: ActionType.closeModal,
  },
  {
    label: createMessage(STORE_VALUE),
    value: ActionType.storeValue,
  },
  {
    label: createMessage(DOWNLOAD),
    value: ActionType.download,
  },
  {
    label: createMessage(COPY_TO_CLIPBOARD),
    value: ActionType.copyToClipboard,
  },
  {
    label: createMessage(RESET_WIDGET),
    value: ActionType.resetWidget,
  },
];

const getBaseOptions = () => {
  if (isJSEditorEnabled) {
    const jsoption = baseOptions.find(
      (option: any) => option.value === ActionType.jsFunction,
    );
    if (!jsoption) {
      baseOptions.splice(2, 0, {
        label: createMessage(EXECUTE_JS_FUNCTION),
        value: ActionType.jsFunction,
      });
    }
  }
  return baseOptions;
};

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
      if (matches.length === 0) {
        //when format doesn't match but it is function from js object
        fields.push({
          field: FieldType.ACTION_SELECTOR_FIELD,
          getParentValue,
          value,
          args: [],
        });
      } else if (matches.length) {
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

function getIntegrationOptionsWithChildren(
  pageId: string,
  applicationId: string,
  plugins: any,
  options: TreeDropdownOption[],
  actions: any[],
  jsActions: Array<JSCollectionData>,
  datasources: Datasource[],
  createIntegrationOption: TreeDropdownOption,
  dispatch: any,
) {
  const isJSEditorEnabled = getFeatureFlags().JS_EDITOR;
  const createJSObject: TreeDropdownOption = {
    label: "Create New JS Object",
    value: "JSObject",
    id: "create",
    icon: "plus",
    className: "t--create-js-object-btn",
    onSelect: () => {
      dispatch(createNewJSCollection(pageId));
    },
  };
  const queries = actions.filter(
    (action) => action.config.pluginType === PluginType.DB,
  );
  const apis = actions.filter(
    (action) =>
      action.config.pluginType === PluginType.API ||
      action.config.pluginType === PluginType.SAAS ||
      action.config.pluginType === PluginType.REMOTE,
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
  if (isJSEditorEnabled && jsOption) {
    jsOption.children = [createJSObject];
    jsActions.forEach((jsAction) => {
      if (jsAction.config.actions && jsAction.config.actions.length > 0) {
        const jsObject: TreeDropdownOption = {
          label: jsAction.config.name,
          id: jsAction.config.id,
          value: jsAction.config.name,
          type: jsOption.value,
        };
        (jsOption.children as TreeDropdownOption[]).push(jsObject);
        if (jsObject) {
          //don't remove this will be used soon
          // const createJSFunction: TreeDropdownOption = {
          //   label: "Create New JS Function",
          //   value: "JSFunction",
          //   id: "create",
          //   icon: "plus",
          //   className: "t--create-js-function-btn",
          //   onSelect: () => {
          //     history.push(
          //       JS_COLLECTION_ID_URL(applicationId, pageId, jsAction.config.id),
          //     );
          //   },
          // };
          jsObject.children = [];
          jsAction.config.actions.forEach((js: JSAction) => {
            const jsArguments = js.actionConfiguration.jsArguments;
            const argValue: Array<any> = [];
            if (jsArguments && jsArguments.length) {
              jsArguments.forEach((arg: Variable) => {
                argValue.push(arg.value);
              });
            }
            const jsFunction = {
              label: js.name,
              id: js.id,
              value: jsAction.config.name + "." + js.name,
              type: jsOption.value,
              icon: jsFunctionIcon,
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
  const jsActions = useSelector(getJSCollectionsForCurrentPage);

  const integrationOptionTree = getIntegrationOptionsWithChildren(
    pageId,
    applicationId,
    pluginGroups,
    getBaseOptions(),
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
  const widgetOptionTree = useSelector(getWidgetOptionsTree);
  const modalDropdownList = useModalDropdownList();
  const pageDropdownOptions = useSelector(getPageListAsOptions);
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
