import React from "react";
import {
  getFunctionNameFromJsObjectExpression,
  getFuncExpressionAtPosition,
  getThenCatchBlocksFromQuery,
  setThenBlockInQuery,
  setCatchBlockInQuery,
} from "@shared/ast";
import { createModalAction } from "actions/widgetActions";
import type { DefaultRootState } from "react-redux";
import {
  getEntityNameAndPropertyPath,
  isEntityAction,
} from "ee/workers/Evaluation/evaluationUtils";
import type { TreeDropdownOption } from "@appsmith/ads-old";
import { Icon } from "@appsmith/ads";
import { type Plugin, PluginType } from "entities/Plugin";
import type { JSAction, Variable } from "entities/JSCollection";
import keyBy from "lodash/keyBy";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { useDispatch, useSelector } from "react-redux";
import type {
  ActionData,
  ActionDataState,
} from "ee/reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  getCurrentActions,
  getJSCollectionFromName,
  getCurrentJSCollections,
  getQueryModuleInstances,
  getJSModuleInstancesData,
  getPluginImages,
} from "ee/selectors/entitiesSelector";
import {
  getModalDropdownList,
  getNextModalName,
} from "selectors/widgetSelectors";
import {
  APPSMITH_GLOBAL_FUNCTIONS,
  APPSMITH_INTEGRATIONS,
  AppsmithFunction,
  AppsmithFunctionsWithFields,
  FieldType,
  NAVIGATE_TO_TAB_OPTIONS,
  NEW_MODAL_LABEL,
} from "./constants";
import { FIELD_GROUP_CONFIG } from "./FieldGroup/FieldGroupConfig";
import type {
  DataTreeForActionCreator,
  GenericFunction,
  SelectorField,
  SwitchType,
} from "./types";
import {
  callBackFieldGetter,
  callBackFieldSetter,
  getCodeFromMoustache,
  getEvaluationVersion,
} from "./utils";
import store from "store";
import { selectEvaluationVersion } from "ee/selectors/applicationSelectors";
import { isJSAction } from "ee/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { ModuleInstanceDataState } from "ee/constants/ModuleInstanceConstants";
import { getModuleIcon } from "pages/Editor/utils";
import { getAllModules } from "ee/selectors/modulesSelector";
import type { Module } from "ee/constants/ModuleConstants";
import {
  createNewJSCollectionFromActionCreator,
  createNewQueryFromActionCreator,
} from "actions/propertyPaneActions";

const actionList: {
  label: string;
  value: string;
  children?: TreeDropdownOption[];
}[] = Object.entries(FIELD_GROUP_CONFIG)
  .filter((action) => {
    return action[0] !== AppsmithFunction.none;
  })
  .map((action) => ({
    label: action[1].label,
    value: action[0],
    children: action[1].children,
    icon: <Icon name={action[1].icon || "no-action"} size="md" />,
  }));

export function getFieldFromValue(
  value: string,
  activeTabApiAndQueryCallback: SwitchType,
  activeTabNavigateTo: SwitchType,
  getParentValue?: (changeValue: string) => string,
  dataTree?: DataTreeForActionCreator,
  isChainedAction = false,
): SelectorField[] {
  const fields: SelectorField[] = [];

  // No value case - no action has been selected, show the action selector field
  if (!value) {
    return [
      {
        field: FieldType.ACTION_SELECTOR_FIELD,
        getParentValue,
        value,
      },
    ];
  }

  const trimmedVal = value?.replace(/(^{{)|(}}$)/g, "") || "";
  const entityProps = getEntityNameAndPropertyPath(trimmedVal);
  const entity = dataTree && dataTree[entityProps.entityName];

  if (entity && "ENTITY_TYPE" in entity) {
    if (isEntityAction(entity as DataTreeEntity)) {
      // get fields for API action
      return getActionEntityFields(
        fields,
        getParentValue as (changeValue: string) => string,
        value,
        activeTabNavigateTo,
        activeTabApiAndQueryCallback,
        dataTree as DataTreeForActionCreator,
        isChainedAction,
      );
    }

    if (isJSAction(entity as DataTreeEntity)) {
      // get fields for js action execution
      return getJSFunctionExecutionFields(
        fields,
        getParentValue as (changeValue: string) => string,
        value,
        entityProps.entityName,
      );
    }
  }

  getFieldsForSelectedAction(
    fields,
    getParentValue as (changeValue: string) => string,
    value,
    activeTabNavigateTo,
  );

  return fields;
}

function getActionEntityFields(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[],
  getParentValue: (changeValue: string) => string,
  value: string,
  activeTabNavigateTo: SwitchType,
  activeTabApiAndQueryCallback: SwitchType,
  dataTree: DataTreeForActionCreator,
  isChainedAction = false,
) {
  const evaluationVersion = getEvaluationVersion();
  const requiredValue = getCodeFromMoustache(value);
  const successFunction = getFuncExpressionAtPosition(
    requiredValue,
    0,
    evaluationVersion,
  );
  const errorFunction = getFuncExpressionAtPosition(
    requiredValue,
    1,
    evaluationVersion,
  );
  const isCallbackStyle = successFunction || errorFunction;

  fields.push({
    field: FieldType.ACTION_SELECTOR_FIELD,
    getParentValue,
    value,
  });
  fields.push({
    field: FieldType.PARAMS_FIELD,
    getParentValue,
    value,
    position: isCallbackStyle ? 2 : 0,
  });

  if (isChainedAction) {
    function getter(value: string) {
      value = getCodeFromMoustache(value);

      if (isCallbackStyle) {
        if (activeTabApiAndQueryCallback.id === "onSuccess") {
          return callBackFieldGetter(value, 0);
        } else {
          return callBackFieldGetter(value, 1);
        }
      } else {
        const { catch: catchBlock, then: thenBlock } =
          getThenCatchBlocksFromQuery(value, 2);

        if (activeTabApiAndQueryCallback.id === "onSuccess") {
          return `{{${thenBlock ?? "() => {\n  // showAlert('success');\n}"}}}`;
        } else {
          return `{{${
            catchBlock ?? "() => {\n  // showAlert('failure');\n}"
          }}}`;
        }
      }
    }

    function setter(changeValue: string, currentValue: string) {
      changeValue = getCodeFromMoustache(changeValue);
      currentValue = getCodeFromMoustache(currentValue);

      if (isCallbackStyle) {
        if (activeTabApiAndQueryCallback.id === "onSuccess") {
          return callBackFieldSetter(changeValue, currentValue, 0);
        } else {
          return callBackFieldSetter(changeValue, currentValue, 1);
        }
      } else {
        if (activeTabApiAndQueryCallback.id === "onSuccess") {
          const modified = setThenBlockInQuery(
            currentValue,
            changeValue,
            evaluationVersion,
          );

          if (modified) {
            return `{{${modified}}}`;
          } else {
            return currentValue;
          }
        } else {
          const modified = setCatchBlockInQuery(
            currentValue,
            changeValue,
            evaluationVersion,
          );

          if (modified) {
            return `{{${modified}}}`;
          } else {
            return currentValue;
          }
        }
      }
    }

    fields.push({
      field: FieldType.API_AND_QUERY_SUCCESS_FAILURE_TAB_FIELD,
      getParentValue,
      value,
    });
    fields.push({
      field: FieldType.CALLBACK_FUNCTION_API_AND_QUERY,
      getParentValue,
      value,
      getter,
      setter,
    });
  }

  return fields;
}

function getJSFunctionExecutionFields(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[],
  getParentValue: (changeValue: string) => string,
  value: string,
  collectionName: string,
) {
  const state = store.getState();
  const jsCollection = getJSCollectionFromName(state, collectionName);
  const evaluationVersion = selectEvaluationVersion(state);

  const functionName = getFunctionNameFromJsObjectExpression(
    value,
    evaluationVersion,
  );

  fields.push({
    field: FieldType.ACTION_SELECTOR_FIELD,
    getParentValue,
    value,
  });

  const action = jsCollection?.config.actions?.find(
    (action) => action.name === functionName,
  );
  const args = action?.actionConfiguration?.jsArguments || [];

  if (args && args.length > 0) {
    args.forEach((arg: { name: string }, index: number) => {
      fields.push({
        field: FieldType.ARGUMENT_KEY_VALUE_FIELD,
        getParentValue,
        value,
        label: arg.name,
        index: index,
      });
    });
  }

  return fields;
}

function getFieldsForSelectedAction(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[],
  getParentValue: (changeValue: string) => string,
  value: string,
  activeTabNavigateTo: SwitchType,
) {
  /*
   * if an action is present, push actions selector field
   * then push all fields specific to the action selected
   */
  fields.push({
    field: FieldType.ACTION_SELECTOR_FIELD,
    getParentValue,
    value,
  });

  /**
   *  We need to find out if there are more than one function in the value
   *  If yes, we need to find out the first position position-wise
   *  this is done to get rid of other functions fields being shown in the selector
   *  See - https://github.com/appsmithorg/appsmith/issues/15895
   **/
  const matches = AppsmithFunctionsWithFields.filter((func) =>
    value.includes(func),
  );

  const functionMatchesWithPositions: Array<{
    position: number;
    func: string;
  }> = [];

  matches.forEach((match) => {
    functionMatchesWithPositions.push({
      position: value.indexOf(match),
      func: match,
    });
  });
  functionMatchesWithPositions.sort((a, b) => a.position - b.position);

  const functionMatch =
    functionMatchesWithPositions.length && functionMatchesWithPositions[0].func;

  if (functionMatch && functionMatch.length > 0) {
    for (const field of FIELD_GROUP_CONFIG[functionMatch].fields) {
      fields.push({
        field: field,
      });
    }

    /**
     * The second field for navigateTo is dependent on activeTabNavigateTo value
     * if PAGE_NAME then this field will be PAGE_SELECTOR_FIELD (default)
     * if URL then this field will be URL_FIELD
     **/
    if (
      functionMatch === APPSMITH_GLOBAL_FUNCTIONS.navigateTo &&
      activeTabNavigateTo.id === NAVIGATE_TO_TAB_OPTIONS.URL
    ) {
      fields[2] = {
        field: FieldType.URL_FIELD,
      };
    }

    return fields;
  }
}

export function useModalDropdownList(handleClose: () => void) {
  const dispatch = useDispatch();
  const nextModalName = useSelector(getNextModalName);

  let finalList: TreeDropdownOption[] = [
    {
      label: NEW_MODAL_LABEL,
      value: "Modal",
      id: "create",
      icon: "plus",
      className: "t--create-modal-btn",
      onSelect: (option: TreeDropdownOption, setter?: GenericFunction) => {
        const modalName = nextModalName;

        if (setter) {
          setter({
            value: `${modalName}.name`,
          });
          dispatch(createModalAction(modalName));
          handleClose();
        }
      },
    },
  ];

  finalList = finalList.concat(
    (useSelector(getModalDropdownList) || []) as TreeDropdownOption[],
  );

  return finalList;
}

export function getApiQueriesAndJSActionOptionsWithChildren(
  pageId: string,
  plugins: Plugin[],
  actions: ActionDataState,
  jsActions: Array<JSCollectionData>,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  handleClose: () => void,
  queryModuleInstances: ModuleInstanceDataState,
  jsModuleInstances: ReturnType<typeof getJSModuleInstancesData>,
  modules: Record<string, Module>,
  pluginImages: Record<string, string>,
) {
  // this function gets a list of all the queries/apis and attaches it to actionList
  getApiAndQueryOptions(
    plugins,
    actions,
    dispatch,
    handleClose,
    queryModuleInstances,
    modules,
    pluginImages,
  );

  // this function gets a list of all the JS Objects and attaches it to actionList
  getJSOptions(pageId, jsActions, dispatch, jsModuleInstances);

  return actionList;
}

function getApiAndQueryOptions(
  plugins: Plugin[],
  actions: ActionDataState,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  handleClose: () => void,
  queryModuleInstances: ModuleInstanceDataState,
  modules: Record<string, Module>,
  pluginImages: Record<string, string>,
) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginGroups: any = keyBy(plugins, "id");

  const createQueryObject: TreeDropdownOption = {
    label: "New query",
    value: "datasources",
    id: "create",
    icon: "plus",
    className: "t--create-datasources-query-btn",
    onSelect: (value, setterMethod) => {
      if (setterMethod && queryOptions) {
        const createQueryCallback = (name: string) => {
          setterMethod({
            label: name,
            id: name,
            value: name,
            type: queryOptions.value,
          });
        };

        dispatch(createNewQueryFromActionCreator(createQueryCallback));
      }
    },
  };

  const queries: ActionDataState = actions.filter(
    (action: ActionData) => action.config.pluginType === PluginType.DB,
  );

  const apis: ActionDataState = actions.filter(
    (action: ActionData) =>
      action.config.pluginType === PluginType.API ||
      action.config.pluginType === PluginType.SAAS ||
      action.config.pluginType === PluginType.REMOTE ||
      action.config.pluginType === PluginType.INTERNAL ||
      action.config.pluginType === PluginType.AI ||
      action.config.pluginType === PluginType.EXTERNAL_SAAS,
  );

  const queryOptions = actionList.find(
    (action) => action.value === AppsmithFunction.integration,
  );

  if (queryOptions) {
    queryOptions.children = [createQueryObject];

    apis.forEach((api) => {
      (queryOptions.children as TreeDropdownOption[]).push({
        label: api.config.name,
        id: api.config.id,
        value: api.config.name,
        type: queryOptions.value,
        icon: getActionConfig(api.config.pluginType)?.getIcon(
          api.config,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pluginGroups[(api as any).config.datasource.pluginId],
          api.config.pluginType === PluginType.API,
        ),
      } as TreeDropdownOption);
    });

    queries.forEach((query) => {
      (queryOptions.children as TreeDropdownOption[]).push({
        label: query.config.name,
        id: query.config.id,
        value: query.config.name,
        type: queryOptions.value,
        icon: getActionConfig(query.config.pluginType)?.getIcon(
          query.config,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pluginGroups[(query as any).config.datasource.pluginId],
        ),
      } as TreeDropdownOption);
    });
    queryModuleInstances.forEach((instance) => {
      const module = modules[instance.config.sourceModuleId];

      (queryOptions.children as TreeDropdownOption[]).push({
        label: instance.config.name,
        id: instance.config.id,
        value: instance.config.name,
        type: queryOptions.value,
        icon: getModuleIcon(module, pluginImages),
      } as TreeDropdownOption);
    });
  }
}

export function getJSOptions(
  pageId: string,
  jsActions: Array<JSCollectionData>,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  jsModuleInstances: ReturnType<typeof getJSModuleInstancesData>,
) {
  const jsOption = actionList.find(
    (action) => action.value === AppsmithFunction.jsFunction,
  );

  const createJSObject: TreeDropdownOption = {
    label: "New JS Object",
    value: AppsmithFunction.jsFunction,
    id: "create",
    icon: "plus",
    className: "t--create-js-object-btn",
    onSelect: (value, setterMethod) => {
      if (setterMethod) {
        const callback = (bindingValue: string) => {
          setterMethod({
            label: bindingValue,
            id: bindingValue,
            value: bindingValue,
            type: APPSMITH_INTEGRATIONS.jsFunction,
          });
        };

        dispatch(createNewJSCollectionFromActionCreator(callback));
      }
    },
  };

  if (jsOption) {
    jsOption.children = [createJSObject];

    jsActions.forEach((jsAction) => {
      if (jsAction.config.actions && jsAction.config.actions.length > 0) {
        const jsObject = {
          label: jsAction.config.name,
          id: jsAction.config.id,
          value: jsAction.config.name,
          type: jsOption.value,
          icon: JsFileIconV2(),
        } as unknown as TreeDropdownOption;

        (jsOption.children as unknown as TreeDropdownOption[]).push(jsObject);

        if (jsObject) {
          jsObject.children = [];

          jsAction.config.actions.forEach((js: JSAction) => {
            const jsArguments = js.actionConfiguration?.jsArguments;
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              icon: <Icon name="js-function" size="md" />,
              args: argValue,
            };

            (jsObject.children as TreeDropdownOption[]).push(
              jsFunction as unknown as TreeDropdownOption,
            );
          });
          jsObject.children.sort((a, b) => a.label?.localeCompare(b.label));
        }
      }
    });

    jsModuleInstances.forEach((jsModuleInstance) => {
      if (!jsModuleInstance) return;

      if (
        jsModuleInstance.config.actions &&
        jsModuleInstance.config.actions.length > 0
      ) {
        const jsObject = {
          label: jsModuleInstance.name,
          id: jsModuleInstance.config.id,
          value: jsModuleInstance.name,
          type: jsOption.value,
          icon: JsFileIconV2(),
        } as unknown as TreeDropdownOption;

        (jsOption.children as unknown as TreeDropdownOption[]).push(jsObject);

        if (jsObject) {
          jsObject.children = [];

          jsModuleInstance.config.actions.forEach((js: JSAction) => {
            const jsArguments = js.actionConfiguration?.jsArguments;
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const argValue: Array<any> = [];

            if (jsArguments && jsArguments.length) {
              jsArguments.forEach((arg: Variable) => {
                argValue.push(arg.value);
              });
            }

            const jsFunction = {
              label: js.name,
              id: js.id,
              value: jsModuleInstance.name + "." + js.name,
              type: jsOption.value,
              icon: <Icon name="js-function" size="md" />,
              args: argValue,
            };

            (jsObject.children as TreeDropdownOption[]).push(
              jsFunction as unknown as TreeDropdownOption,
            );
          });
          jsObject.children.sort((a, b) => a.label?.localeCompare(b.label));
        }
      }
    });
  }
}

export function useApisQueriesAndJsActionOptions(handleClose: () => void) {
  const pageId = useSelector(getCurrentPageId) || "";
  const dispatch = useDispatch();
  const plugins = useSelector((state: DefaultRootState) => {
    return state.entities.plugins.list;
  });
  const actions = useSelector(getCurrentActions);
  const jsActions = useSelector(getCurrentJSCollections);
  const queryModuleInstances = useSelector(
    getQueryModuleInstances,
  ) as unknown as ModuleInstanceDataState;
  const jsModuleInstancesData = useSelector(getJSModuleInstancesData);
  const modules = useSelector(getAllModules);
  const pluginImages = useSelector(getPluginImages);

  // this function gets all the Queries/API's/JS Objects and attaches it to actionList
  return getApiQueriesAndJSActionOptionsWithChildren(
    pageId,
    plugins,
    actions,
    jsActions,
    dispatch,
    handleClose,
    queryModuleInstances,
    jsModuleInstancesData,
    modules,
    pluginImages,
  );
}
