import { createModalAction } from "actions/widgetActions";
import { TreeDropdownOption } from "design-system";
import TreeStructure from "components/utils/TreeStructure";
import { PluginType } from "entities/Action";
import { isString, keyBy } from "lodash";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import {
  JsFileIconV2,
  jsFunctionIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { getWidgetOptionsTree } from "sagas/selectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
} from "selectors/entitiesSelector";
import {
  getModalDropdownList,
  getNextModalName,
} from "selectors/widgetSelectors";
import FieldGroup from "./FieldGroup";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getEntityNameAndPropertyPath } from "workers/Evaluation/evaluationUtils";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSCollection } from "actions/jsPaneActions";
import { JSAction, Variable } from "entities/JSCollection";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { filterCategories, SEARCH_CATEGORY_ID } from "../GlobalSearch/utils";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { connect } from "react-redux";
import { ACTION_TRIGGER_REGEX } from "./regex";
import {
  NAVIGATE_TO_TAB_OPTIONS,
  AppsmithFunction,
  FieldType,
  AppsmithFunctionsWithFields,
} from "./constants";
import { SwitchType, ActionCreatorProps, GenericFunction } from "./types";
import { FIELD_GROUP_CONFIG } from "./FieldGroup/FieldGroupConfig";
import { isValueValidURL } from "./utils";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import {
  getFuncExpressionAtPosition,
  getFunction,
  replaceActionInQuery,
} from "@shared/ast";

const actionList: {
  label: string;
  value: string;
  children?: TreeDropdownOption[];
}[] = Object.entries(FIELD_GROUP_CONFIG).map((action) => ({
  label: action[1].label,
  value: action[0],
  children: action[1].children,
}));

function getFieldFromValue(
  value: string | undefined,
  activeTabNavigateTo: SwitchType,
  getParentValue?: (changeValue: string) => string,
  dataTree?: DataTree,
): any[] {
  const fields: any[] = [];

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

  let entity;

  if (isString(value)) {
    const trimmedVal = value && value.replace(/(^{{)|(}}$)/g, "");
    const entityProps = getEntityNameAndPropertyPath(trimmedVal);
    entity = dataTree && dataTree[entityProps.entityName];
  }

  if (entity && "ENTITY_TYPE" in entity) {
    if (entity.ENTITY_TYPE === ENTITY_TYPE.ACTION) {
      // get fields for API action
      return getActionEntityFields(
        fields,
        getParentValue as (changeValue: string) => string,
        value,
        activeTabNavigateTo,
        dataTree as DataTree,
      );
    }

    if (entity.ENTITY_TYPE === ENTITY_TYPE.JSACTION) {
      // get fields for js action execution
      return getJsFunctionExecutionFields(
        fields,
        getParentValue as (changeValue: string) => string,
        value,
        entity,
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

function replaceAction(value: string, changeValue: string, argNum: number) {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(value).jsSnippets[0];

  // if no action("") then send empty arrow expression
  // else replace with arrow expression and action selected
  const reqChangeValue =
    changeValue === "" ? `() => {}` : `() => ${changeValue}`;

  return `{{${replaceActionInQuery(
    requiredValue,
    reqChangeValue,
    argNum,
    self.evaluationVersion,
  )}}}`;
}

function getActionEntityFields(
  fields: any[],
  getParentValue: (changeValue: string) => string,
  value: string,
  activeTabNavigateTo: SwitchType,
  dataTree: DataTree,
) {
  fields.push({
    field: FieldType.ACTION_SELECTOR_FIELD,
    getParentValue,
    value,
  });
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(value).jsSnippets[0];

  // get the fields for onSuccess
  const successFunction = getFuncExpressionAtPosition(
    requiredValue,
    0,
    self.evaluationVersion,
  );
  const successValue = getFunction(successFunction, self.evaluationVersion);
  const successFields = getFieldFromValue(
    successValue,
    activeTabNavigateTo,
    (changeValue: string) => replaceAction(value, changeValue, 0),
    dataTree,
  );
  successFields[0].label = "onSuccess";
  fields.push(successFields);

  // get the fields for onError
  const errorFunction = getFuncExpressionAtPosition(
    requiredValue,
    1,
    self.evaluationVersion,
  );
  const errorValue = getFunction(errorFunction, self.evaluationVersion);
  const errorFields = getFieldFromValue(
    errorValue,
    activeTabNavigateTo,
    (changeValue: string) => replaceAction(value, changeValue, 1),
    dataTree,
  );
  errorFields[0].label = "onError";
  fields.push(errorFields);

  return fields;
}

function getJsFunctionExecutionFields(
  fields: any[],
  getParentValue: (changeValue: string) => string,
  value: string,
  entity: any,
) {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length === 0) {
    // when format doesn't match, it is function from js object
    fields.push({
      field: FieldType.ACTION_SELECTOR_FIELD,
      getParentValue,
      value,
      args: [],
    });
  } else if (matches.length) {
    const entityPropertyPath = matches[0][1];
    const { propertyPath } = getEntityNameAndPropertyPath(entityPropertyPath);
    const path = propertyPath && propertyPath.replace("()", "");
    const argsProps =
      path && entity.meta && entity.meta[path] && entity.meta[path].arguments;
    fields.push({
      field: FieldType.ACTION_SELECTOR_FIELD,
      getParentValue,
      value,
      args: argsProps ? argsProps : [],
    });
    if (argsProps && argsProps.length > 0) {
      for (const index of argsProps) {
        fields.push({
          field: FieldType.ARGUMENT_KEY_VALUE_FIELD,
          getParentValue,
          value,
          label: argsProps[index].name,
          index: index,
        });
      }
    }
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

  const functionMatch = AppsmithFunctionsWithFields.filter((func) =>
    value.includes(func),
  );
  const requiredFunction = functionMatch[0];

  if (functionMatch.length > 0) {
    for (const field of FIELD_GROUP_CONFIG[requiredFunction].fields) {
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
      requiredFunction === "navigateTo" &&
      activeTabNavigateTo.id === NAVIGATE_TO_TAB_OPTIONS.URL
    ) {
      fields[2] = {
        field: FieldType.URL_FIELD,
      };
    }
    return fields;
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
      icon: "plus",
      className: "t--create-modal-btn",
      onSelect: (option: TreeDropdownOption, setter?: GenericFunction) => {
        const modalName = nextModalName;
        if (setter) {
          setter({
            value: `${modalName}`,
          });
          dispatch(createModalAction(modalName));
        }
      },
    },
  ];

  finalList = finalList.concat(
    (useSelector(getModalDropdownList) || []) as TreeDropdownOption[],
  );

  return finalList;
}

function getApiQueriesAndJsActionOptionsWithChildren(
  pageId: string,
  applicationId: string,
  plugins: any,
  actions: ActionDataState,
  jsActions: Array<JSCollectionData>,
  dispatch: any,
) {
  // this function gets a list of all the queries/apis and attaches it to actionList
  getApiAndQueryOptions(
    pageId,
    applicationId,
    plugins,
    actions,
    jsActions,
    dispatch,
  );

  // this function gets a list of all the JS objects and attaches it to actionList
  getJSOptions(pageId, applicationId, plugins, actions, jsActions, dispatch);

  return actionList;
}

function getApiAndQueryOptions(
  pageId: string,
  applicationId: string,
  plugins: any,
  actions: ActionDataState,
  jsActions: Array<JSCollectionData>,
  dispatch: any,
) {
  const createQueryObject: TreeDropdownOption = {
    label: "New Query",
    value: "datasources",
    id: "create",
    icon: "plus",
    className: "t--create-datasources-query-btn",
    onSelect: () => {
      dispatch(
        setGlobalSearchCategory(
          filterCategories[SEARCH_CATEGORY_ID.ACTION_OPERATION],
        ),
      );
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

  const queryAndApiOptions = actionList.find(
    (action) => action.value === AppsmithFunction.integration,
  );

  if (queryAndApiOptions) {
    queryAndApiOptions.children = [createQueryObject];

    apis.forEach((api) => {
      (queryAndApiOptions.children as TreeDropdownOption[]).push({
        label: api.config.name,
        id: api.config.id,
        value: api.config.name,
        type: queryAndApiOptions.value,
        icon: getActionConfig(api.config.pluginType)?.getIcon(
          api.config,
          plugins[(api as any).config.datasource.pluginId],
          api.config.pluginType === PluginType.API,
        ),
      } as TreeDropdownOption);
    });

    queries.forEach((query) => {
      (queryAndApiOptions.children as TreeDropdownOption[]).push({
        label: query.config.name,
        id: query.config.id,
        value: query.config.name,
        type: queryAndApiOptions.value,
        icon: getActionConfig(query.config.pluginType)?.getIcon(
          query.config,
          plugins[(query as any).config.datasource.pluginId],
        ),
      } as TreeDropdownOption);
    });
  }
}

function getJSOptions(
  pageId: string,
  applicationId: string,
  plugins: any,
  actions: ActionDataState,
  jsActions: Array<JSCollectionData>,
  dispatch: any,
) {
  const createJSObject: TreeDropdownOption = {
    label: "New JS Object",
    value: "JSObject",
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
        const jsObject = ({
          label: jsAction.config.name,
          id: jsAction.config.id,
          value: jsAction.config.name,
          type: jsOption.value,
          icon: JsFileIconV2,
        } as unknown) as TreeDropdownOption;

        ((jsOption.children as unknown) as TreeDropdownOption[]).push(jsObject);

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
              (jsFunction as unknown) as TreeDropdownOption,
            );
          });
        }
      }
    });
  }
}

function useApisQueriesAndJsActionOptions() {
  const pageId = useSelector(getCurrentPageId) || "";
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const dispatch = useDispatch();
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups: any = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const actions = useSelector(getActionsForCurrentPage);
  const jsActions = useSelector(getJSCollectionsForCurrentPage);

  // this function gets all the Queries/API's/JS objects and attaches it to actionList
  return getApiQueriesAndJsActionOptionsWithChildren(
    pageId,
    applicationId,
    pluginGroups,
    actions,
    jsActions,
    dispatch,
  );
}

const ActionCreator = React.forwardRef(
  (props: ActionCreatorProps, ref: any) => {
    const NAVIGATE_TO_TAB_SWITCHER: Array<SwitchType> = [
      {
        id: "page-name",
        text: "Page Name",
        action: () => {
          setActiveTabNavigateTo(NAVIGATE_TO_TAB_SWITCHER[0]);
        },
      },
      {
        id: "url",
        text: "URL",
        action: () => {
          setActiveTabNavigateTo(NAVIGATE_TO_TAB_SWITCHER[1]);
        },
      },
    ];

    const [activeTabNavigateTo, setActiveTabNavigateTo] = useState(
      NAVIGATE_TO_TAB_SWITCHER[isValueValidURL(props.value) ? 1 : 0],
    );
    const dataTree = useSelector(getDataTree);
    const integrationOptions = useApisQueriesAndJsActionOptions();
    const widgetOptionTree = useSelector(getWidgetOptionsTree);
    const modalDropdownList = useModalDropdownList();
    const fields = getFieldFromValue(
      props.value,
      activeTabNavigateTo,
      undefined,
      dataTree,
    );

    return (
      <TreeStructure ref={ref}>
        <FieldGroup
          activeNavigateToTab={activeTabNavigateTo}
          additionalAutoComplete={props.additionalAutoComplete}
          depth={1}
          fields={fields}
          integrationOptions={integrationOptions}
          maxDepth={1}
          modalDropdownList={modalDropdownList}
          navigateToSwitches={NAVIGATE_TO_TAB_SWITCHER}
          onValueChange={props.onValueChange}
          pageDropdownOptions={props.pageDropdownOptions}
          value={props.value}
          widgetOptionTree={widgetOptionTree}
        />
      </TreeStructure>
    );
  },
);

const getPageListAsOptions = (state: AppState) => {
  return state.entities.pageList.pages.map((page) => ({
    label: page.pageName,
    id: page.pageId,
    value: `'${page.pageName}'`,
  }));
};

const mapStateToProps = (state: AppState) => ({
  pageDropdownOptions: getPageListAsOptions(state),
});

export default connect(mapStateToProps)(ActionCreator);
