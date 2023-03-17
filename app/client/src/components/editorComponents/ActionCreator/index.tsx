import { createModalAction } from "actions/widgetActions";
import type { TreeDropdownOption } from "design-system-old";
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
import type { AppState } from "@appsmith/reducers";
import {
  getDataTreeForActionCreator,
  getWidgetOptionsTree,
} from "sagas/selectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
  getPageListAsOptions,
} from "selectors/entitiesSelector";
import {
  getModalDropdownList,
  getNextModalName,
} from "selectors/widgetSelectors";
import Fields from "./Fields";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSCollection } from "actions/jsPaneActions";
import type { JSAction, Variable } from "entities/JSCollection";
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
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { selectFeatureFlags } from "selectors/usersSelectors";
import type FeatureFlags from "entities/FeatureFlags";
import { isValidURL } from "utils/URLUtils";
import { ACTION_ANONYMOUS_FUNC_REGEX, ACTION_TRIGGER_REGEX } from "./regex";
import {
  NAVIGATE_TO_TAB_OPTIONS,
  AppsmithFunction,
  FieldType,
} from "./constants";
import type {
  SwitchType,
  ActionCreatorProps,
  GenericFunction,
  DataTreeForActionCreator,
} from "./types";

const baseOptions: { label: string; value: string }[] = [
  {
    label: createMessage(NO_ACTION),
    value: AppsmithFunction.none,
  },
  {
    label: createMessage(EXECUTE_A_QUERY),
    value: AppsmithFunction.integration,
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

const getBaseOptions = (featureFlags: FeatureFlags) => {
  const { JS_EDITOR: isJSEditorEnabled } = featureFlags;
  if (isJSEditorEnabled) {
    const jsOption = baseOptions.find(
      (option: any) => option.value === AppsmithFunction.jsFunction,
    );
    if (!jsOption) {
      baseOptions.splice(2, 0, {
        label: createMessage(EXECUTE_JS_FUNCTION),
        value: AppsmithFunction.jsFunction,
      });
    }
  }
  return baseOptions;
};

function getFieldFromValue(
  value: string | undefined,
  activeTabNavigateTo: SwitchType,
  getParentValue?: (changeValue: string) => string,
  dataTree?: DataTreeForActionCreator,
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
        const { propertyPath } =
          getEntityNameAndPropertyPath(entityPropertyPath);
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
      field: FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD,
    });

    if (activeTabNavigateTo.id === NAVIGATE_TO_TAB_OPTIONS.PAGE_NAME) {
      fields.push({
        field: FieldType.PAGE_SELECTOR_FIELD,
      });
    } else {
      fields.push({
        field: FieldType.URL_FIELD,
      });
    }

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
  if (value.indexOf("removeValue") !== -1) {
    fields.push({
      field: FieldType.KEY_TEXT_FIELD,
    });
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
  if (value.indexOf("setInterval") !== -1) {
    fields.push(
      {
        field: FieldType.CALLBACK_FUNCTION_FIELD,
      },
      {
        field: FieldType.DELAY_FIELD,
      },
      {
        field: FieldType.ID_FIELD,
      },
    );
  }

  if (value.indexOf("clearInterval") !== -1) {
    fields.push({
      field: FieldType.CLEAR_INTERVAL_ID_FIELD,
    });
  }

  if (value.indexOf("getCurrentPosition") !== -1) {
    fields.push({
      field: FieldType.CALLBACK_FUNCTION_FIELD,
    });
  }

  if (value.indexOf("postWindowMessage") !== -1) {
    fields.push(
      {
        field: FieldType.MESSAGE_FIELD,
      },
      {
        field: FieldType.SOURCE_FIELD,
      },
      {
        field: FieldType.TARGET_ORIGIN_FIELD,
      },
    );
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
  options: TreeDropdownOption[],
  actions: ActionDataState,
  jsActions: Array<JSCollectionData>,
  createIntegrationOption: TreeDropdownOption,
  dispatch: any,
  featureFlags: FeatureFlags,
) {
  const { JS_EDITOR: isJSEditorEnabled } = featureFlags;
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
  const option = options.find(
    (option) => option.value === AppsmithFunction.integration,
  );

  const jsOption = options.find(
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
  if (isJSEditorEnabled && jsOption) {
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
              jsFunction as unknown as TreeDropdownOption,
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
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const featureFlags = useSelector(selectFeatureFlags);
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
    getBaseOptions(featureFlags),
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
    featureFlags,
  );
}

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
    const dataTree = useSelector(getDataTreeForActionCreator);
    const integrationOptionTree = useIntegrationsOptionTree();
    const widgetOptionTree = useSelector(getWidgetOptionsTree);
    const modalDropdownList = useModalDropdownList();
    const pageDropdownOptions = useSelector(getPageListAsOptions);
    const fields = getFieldFromValue(
      props.value,
      activeTabNavigateTo,
      undefined,
      dataTree,
    );

    return (
      <TreeStructure ref={ref}>
        <Fields
          activeNavigateToTab={activeTabNavigateTo}
          additionalAutoComplete={props.additionalAutoComplete}
          depth={1}
          fields={fields}
          integrationOptionTree={integrationOptionTree}
          maxDepth={1}
          modalDropdownList={modalDropdownList}
          navigateToSwitches={NAVIGATE_TO_TAB_SWITCHER}
          onValueChange={props.onValueChange}
          pageDropdownOptions={pageDropdownOptions}
          value={props.value}
          widgetOptionTree={widgetOptionTree}
        />
      </TreeStructure>
    );
  },
);

ActionCreator.displayName = "ActionCreator";

export default ActionCreator;
