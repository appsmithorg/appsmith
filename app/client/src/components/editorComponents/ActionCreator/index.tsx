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
import FieldGroup from "./FieldGroup/FieldGroup";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getEntityNameAndPropertyPath } from "workers/Evaluation/evaluationUtils";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSCollection } from "actions/jsPaneActions";
import { JSAction, Variable } from "entities/JSCollection";
import {
  CLEAR_INTERVAL,
  CLEAR_STORE,
  CLOSE_MODAL,
  COPY_TO_CLIPBOARD,
  createMessage,
  DOWNLOAD,
  EXECUTE_A_QUERY,
  EXECUTE_JS_FUNCTION,
  GET_GEO_LOCATION,
  NAVIGATE_TO,
  NO_ACTION,
  OPEN_MODAL,
  POST_MESSAGE,
  REMOVE_VALUE,
  RESET_WIDGET,
  SET_INTERVAL,
  SHOW_MESSAGE,
  STOP_WATCH_GEO_LOCATION,
  STORE_VALUE,
  WATCH_GEO_LOCATION,
} from "@appsmith/constants/messages";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { filterCategories, SEARCH_CATEGORY_ID } from "../GlobalSearch/utils";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { connect } from "react-redux";
import { isValidURL } from "utils/URLUtils";
import { ACTION_ANONYMOUS_FUNC_REGEX, ACTION_TRIGGER_REGEX } from "./regex";
import {
  NAVIGATE_TO_TAB_OPTIONS,
  AppsmithFunction,
  FieldType,
  AppsmithFunctionsWithFields,
} from "./constants";
import { SwitchType, ActionCreatorProps, GenericFunction } from "./types";
import { FIELD_GROUP_CONFIG } from "./FieldGroup/FieldGroupConfig";

const baseOptions: {
  label: string;
  value: string;
  children?: TreeDropdownOption[];
}[] = [
  {
    label: createMessage(NO_ACTION),
    value: AppsmithFunction.none,
  },
  {
    label: createMessage(EXECUTE_A_QUERY),
    value: AppsmithFunction.integration,
    children: [],
  },
  {
    label: createMessage(EXECUTE_JS_FUNCTION),
    value: AppsmithFunction.jsFunction,
    children: [],
  },
  {
    label: createMessage(NAVIGATE_TO),
    value: AppsmithFunction.navigateTo,
  },
  {
    label: createMessage(SHOW_MESSAGE),
    value: AppsmithFunction.showAlert,
  },
  {
    label: createMessage(OPEN_MODAL),
    value: AppsmithFunction.showModal,
  },
  {
    label: createMessage(CLOSE_MODAL),
    value: AppsmithFunction.closeModal,
  },
  {
    label: createMessage(STORE_VALUE),
    value: AppsmithFunction.storeValue,
  },
  {
    label: createMessage(REMOVE_VALUE),
    value: AppsmithFunction.removeValue,
  },
  {
    label: createMessage(CLEAR_STORE),
    value: AppsmithFunction.clearStore,
  },
  {
    label: createMessage(DOWNLOAD),
    value: AppsmithFunction.download,
  },
  {
    label: createMessage(COPY_TO_CLIPBOARD),
    value: AppsmithFunction.copyToClipboard,
  },
  {
    label: createMessage(RESET_WIDGET),
    value: AppsmithFunction.resetWidget,
  },
  {
    label: createMessage(SET_INTERVAL),
    value: AppsmithFunction.setInterval,
  },
  {
    label: createMessage(CLEAR_INTERVAL),
    value: AppsmithFunction.clearInterval,
  },
  {
    label: createMessage(GET_GEO_LOCATION),
    value: AppsmithFunction.getGeolocation,
  },
  {
    label: createMessage(WATCH_GEO_LOCATION),
    value: AppsmithFunction.watchGeolocation,
  },
  {
    label: createMessage(STOP_WATCH_GEO_LOCATION),
    value: AppsmithFunction.stopWatchGeolocation,
  },
  {
    label: createMessage(POST_MESSAGE),
    value: AppsmithFunction.postMessage,
  },
];

function getFieldFromValue(
  value: string | undefined,
  activeTabNavigateTo: SwitchType,
  getParentValue?: (changeValue: string) => string,
  dataTree?: DataTree,
): any[] {
  // TODO - replace any
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

  if (isString(value)) {
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
        let successValue;
        if (successArg && successArg.length > 0) {
          successValue = successArg[1] !== "{}" ? `{{${successArg[1]}}}` : ""; //successArg[1] + successArg[2];
        }
        const successFields = getFieldFromValue(
          successValue,
          activeTabNavigateTo,
          (changeValue: string) => {
            const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
            const args = [
              ...matches[0][2].matchAll(ACTION_ANONYMOUS_FUNC_REGEX),
            ];
            const errorArg = args[1] ? args[1][0] : "() => {}";
            const successArg = changeValue.endsWith(")")
              ? `() => ${changeValue}`
              : `() => {}`;

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
          activeTabNavigateTo,
          (changeValue: string) => {
            const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
            const args = [
              ...matches[0][2].matchAll(ACTION_ANONYMOUS_FUNC_REGEX),
            ];
            const successArg = args[0] ? args[0][0] : "() => {}";
            const errorArg = changeValue.endsWith(")")
              ? `() => ${changeValue}`
              : `() => {}`;

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

function getIntegrationOptionsWithChildren(
  pageId: string,
  applicationId: string,
  plugins: any,
  actions: ActionDataState,
  jsActions: Array<JSCollectionData>,
  createIntegrationOption: TreeDropdownOption,
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
  const queries = actions.filter(
    (action) => action.config.pluginType === PluginType.DB,
  );
  const apis = actions.filter(
    (action) =>
      action.config.pluginType === PluginType.API ||
      action.config.pluginType === PluginType.SAAS ||
      action.config.pluginType === PluginType.REMOTE,
  );
  const option = baseOptions.find(
    (option) => option.value === AppsmithFunction.integration,
  );

  const jsOption = baseOptions.find(
    (option) => option.value === AppsmithFunction.jsFunction,
  );

  if (option) {
    option.children = [createIntegrationOption];
    apis.forEach((api) => {
      (option.children as TreeDropdownOption[]).push({
        label: api.config.name,
        id: api.config.id,
        value: api.config.name,
        type: option.value,
        icon: getActionConfig(api.config.pluginType)?.getIcon(
          api.config,
          plugins[(api as any).config.datasource.pluginId],
          api.config.pluginType === PluginType.API,
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
  }
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
  return baseOptions;
}

function useIntegrationsOptionTree() {
  const pageId = useSelector(getCurrentPageId) || "";
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const dispatch = useDispatch();
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups: any = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const actions = useSelector(getActionsForCurrentPage);
  const jsActions = useSelector(getJSCollectionsForCurrentPage);

  return getIntegrationOptionsWithChildren(
    pageId,
    applicationId,
    pluginGroups,
    actions,
    jsActions,
    {
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
    },
    dispatch,
  );
}

// TODO - move to utils file
const isValueValidURL = (value: string) => {
  if (value) {
    const indices = [];
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "'") {
        indices.push(i);
      }
    }
    const str = value.substring(indices[0], indices[1] + 1);
    return isValidURL(str);
  }
};

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
    const integrationOptionTree = useIntegrationsOptionTree();
    console.log(integrationOptionTree);
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
          integrationOptionTree={integrationOptionTree}
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
