import React, { useMemo } from "react";
import { AppState } from "reducers";
import {
  getActionsForCurrentPage,
  getDBDatasources,
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
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import { keyBy } from "lodash";
import { getPluginIcon, apiIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";

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
  plugins: any,
  options: TreeDropdownOption[],
  actions: any[],
  datasources: Datasource[],
  createIntegrationOption: TreeDropdownOption,
  dispatch: any,
) {
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
  return options;
}

function useIntegrationsOptionTree() {
  const pageId = useSelector(getCurrentPageId) || "";
  const applicationId = useSelector(getCurrentApplicationId);
  const datasources: Datasource[] = useSelector(getDBDatasources);
  const dispatch = useDispatch();
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups: any = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const actions = useSelector(getActionsForCurrentPage);

  const integrationOptionTree = getIntegrationOptionsWithChildren(
    pageId,
    pluginGroups,
    baseOptions,
    actions,
    datasources,
    {
      label: "Create New Query",
      value: "datasources",
      id: "create",
      icon: "plus",
      className: "t--create-datasources-query-btn",
      onSelect: () => {
        history.push(
          INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
        );
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
  const integrationOptionTree = useIntegrationsOptionTree();
  const widgetOptionTree = useWidgetOptionTree();
  const modalDropdownList = useModalDropdownList();
  const pageDropdownOptions = useSelector(getPageDropdownOptions);
  const fields = getFieldFromValue(props.value);
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
