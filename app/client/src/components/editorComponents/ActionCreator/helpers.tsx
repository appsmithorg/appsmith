import type { ReactNode } from "react";
import React from "react";
import {
  getFunctionNameFromJsObjectExpression,
  getFuncExpressionAtPosition,
  getThenCatchBlocksFromQuery,
  setThenBlockInQuery,
  setCatchBlockInQuery,
} from "@shared/ast";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { createNewJSCollection } from "actions/jsPaneActions";
import { createModalAction } from "actions/widgetActions";
import type { AppState } from "@appsmith/reducers";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { TreeDropdownOption } from "design-system-old";
import { Icon } from "design-system";
import { PluginType } from "entities/Action";
import type { JSAction, Variable } from "entities/JSCollection";
import keyBy from "lodash/keyBy";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { EntityIcon, JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type {
  ActionData,
  ActionDataState,
} from "@appsmith/reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  getCurrentActions,
  getJSCollectionFromName,
  getCurrentJSCollections,
  getQueryModuleInstances,
} from "@appsmith/selectors/entitiesSelector";
import {
  getModalDropdownList,
  getNextModalName,
} from "selectors/widgetSelectors";
import { filterCategories, SEARCH_CATEGORY_ID } from "../GlobalSearch/utils";
import {
  APPSMITH_GLOBAL_FUNCTIONS,
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
import { selectEvaluationVersion } from "@appsmith/selectors/applicationSelectors";
import {
  isAction,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { ModuleInstanceDataState } from "@appsmith/constants/ModuleInstanceConstants";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

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
    if (isAction(entity)) {
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
            value: `${modalName}`,
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

export const getQueryInstanceIcon = (type: MODULE_TYPE): ReactNode => {
  if (type === MODULE_TYPE.QUERY) {
    return (
      <EntityIcon>
        <Icon name="module" />
      </EntityIcon>
    );
  }
};

export function getApiQueriesAndJSActionOptionsWithChildren(
  pageId: string,
  plugins: any,
  actions: ActionDataState,
  jsActions: Array<JSCollectionData>,
  dispatch: any,
  handleClose: () => void,
  queryModuleInstances: ModuleInstanceDataState,
) {
  // this function gets a list of all the queries/apis and attaches it to actionList
  getApiAndQueryOptions(
    plugins,
    actions,
    dispatch,
    handleClose,
    queryModuleInstances,
  );

  // this function gets a list of all the JS Objects and attaches it to actionList
  getJSOptions(pageId, jsActions, dispatch);

  return actionList;
}

function getApiAndQueryOptions(
  plugins: any,
  actions: ActionDataState,
  dispatch: any,
  handleClose: () => void,
  queryModuleInstances: ModuleInstanceDataState,
) {
  const createQueryObject: TreeDropdownOption = {
    label: "New query",
    value: "datasources",
    id: "create",
    icon: "plus",
    className: "t--create-datasources-query-btn",
    onSelect: () => {
      handleClose();
      dispatch(
        setGlobalSearchCategory(
          filterCategories[SEARCH_CATEGORY_ID.ACTION_OPERATION],
        ),
      );
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
      action.config.pluginType === PluginType.AI,
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
          plugins[(api as any).config.datasource.pluginId],
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
          plugins[(query as any).config.datasource.pluginId],
        ),
      } as TreeDropdownOption);
    });
    queryModuleInstances.forEach((instance) => {
      (queryOptions.children as TreeDropdownOption[]).push({
        label: instance.config.name,
        id: instance.config.id,
        value: instance.config.name,
        type: queryOptions.value,
        icon: getQueryInstanceIcon(instance.config.type),
      } as TreeDropdownOption);
    });
  }
}

export function getJSOptions(
  pageId: string,
  jsActions: Array<JSCollectionData>,
  dispatch: any,
) {
  const createJSObject: TreeDropdownOption = {
    label: "New JS Object",
    value: AppsmithFunction.jsFunction,
    id: "create",
    icon: "plus",
    className: "t--create-js-object-btn",
    onSelect: () => {
      dispatch(createNewJSCollection(pageId, "ACTION_SELECTOR"));
    },
  };

  const jsOption = actionList.find(
    (action) => action.value === AppsmithFunction.jsFunction,
  );

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
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups: any = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const actions = useSelector(getCurrentActions);
  const jsActions = useSelector(getCurrentJSCollections);
  const queryModuleInstances = useSelector(
    getQueryModuleInstances,
  ) as unknown as ModuleInstanceDataState;

  // this function gets all the Queries/API's/JS Objects and attaches it to actionList
  return getApiQueriesAndJSActionOptionsWithChildren(
    pageId,
    pluginGroups,
    actions,
    jsActions,
    dispatch,
    handleClose,
    queryModuleInstances,
  );
}
