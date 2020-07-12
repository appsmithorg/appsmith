import React, { ReactNode } from "react";
import Entity, { EntityClassNames } from "./Entity";
import EntityProperty from "./EntityProperty";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { WidgetTypes, WidgetType } from "constants/WidgetConstants";
import {
  getWidgetIcon,
  pageIcon,
  apiIcon,
  widgetIcon,
  queryIcon,
  getPluginIcon,
} from "./ExplorerIcons";
import ActionEntityContextMenu from "./ActionEntityContextMenu";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { PluginType, Action, RestAction } from "entities/Action";
import { generateReactKey } from "utils/generators";
import { noop, groupBy } from "lodash";
import history from "utils/history";
import { EXPLORER_URL, DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import {
  API_EDITOR_ID_URL,
  QUERIES_EDITOR_ID_URL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
} from "constants/routes";
import {
  createNewApiAction,
  createNewQueryAction,
} from "actions/apiPaneActions";
import { ReduxAction } from "constants/ReduxActionConstants";
import { flashElement } from "utils/helpers";
import { Datasource } from "api/DatasourcesApi";
import { Plugin } from "api/PluginApi";
import Divider from "components/editorComponents/Divider";
import { MethodTag } from "./ExplorerStyledComponents";
type GroupConfig = {
  groupName: string;
  type: PluginType;
  icon: JSX.Element;
  key: string;
  getURL: (applicationId: string, pageId: string, id: string) => string;
  isExpanded: (params: ExplorerURLParams) => boolean;
  dispatchableCreateAction: (pageId: string) => ReduxAction<{ pageId: string }>;
  generateCreatePageURL: (
    applicationId: string,
    pageId: string,
    selectedPageId: string,
  ) => string;
  getNameNode: (name: string, method?: string) => ReactNode;
};

export type ExplorerURLParams = {
  applicationId: string;
  pageId: string;
  apiId?: string;
  queryId?: string;
  datasourceId?: string;
};

// When we have new action plugins, we can just add it to this map
// There should be no other place where we refer to the PluginType in entity explorer.
/*eslint-disable react/display-name */
export const ACTION_PLUGIN_MAP: Array<GroupConfig | undefined> = Object.keys(
  PluginType,
).map((type: string) => {
  switch (type) {
    case PluginType.API:
      return {
        groupName: "Apis",
        type,
        icon: apiIcon,
        key: generateReactKey(),
        getURL: (applicationId: string, pageId: string, id: string) => {
          return `${API_EDITOR_ID_URL(applicationId, pageId, id)}`;
        },
        isExpanded: (params: ExplorerURLParams) => {
          return !!params.apiId;
        },
        getNameNode: (name: string, method?: string) => {
          return (
            <React.Fragment>
              {method && <MethodTag type={method} />}
              <span>{name}</span>
            </React.Fragment>
          );
        },
        dispatchableCreateAction: createNewApiAction,
        generateCreatePageURL: API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
      };
    case PluginType.DB:
      return {
        groupName: "Queries",
        type,
        icon: queryIcon,
        key: generateReactKey(),
        getURL: (applicationId: string, pageId: string, id: string) =>
          `${QUERIES_EDITOR_ID_URL(applicationId, pageId, id)}`,
        isExpanded: (params: ExplorerURLParams) => {
          return !!params.queryId;
        },
        getNameNode: (name: string, method?: string) => {
          return <span>{name}</span>;
        },
        dispatchableCreateAction: createNewQueryAction,
        generateCreatePageURL: QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
      };
    default:
      return undefined;
  }
});

const getEntityProperties = (entity: any) => {
  let config: any;
  let name: string;
  if (
    entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET &&
    entity.type !== WidgetTypes.TABLE_WIDGET
  ) {
    config =
      entityDefinitions[
        entity.type as Exclude<
          Partial<WidgetType>,
          "CANVAS_WIDGET" | "ICON_WIDGET"
        >
      ];
    name = entity.widgetName;
  } else if (entity.ENTITY_TYPE === ENTITY_TYPE.ACTION) {
    config = entityDefinitions.ACTION(entity);
    name = entity.config.name;
  } else if (entity.type === WidgetTypes.TABLE_WIDGET) {
    config = entityDefinitions[WidgetTypes.TABLE_WIDGET](entity);
    name = entity.widgetName;
  }

  return (
    config &&
    Object.keys(config)
      .filter(k => k.indexOf("!") === -1)
      .map((entityProperty: string) => {
        let value = entity[entityProperty];
        if (entityProperty === "run") {
          value = "Function";
          entityProperty = entityProperty + "()";
        }
        if (entityProperty === "selectedRow") {
          try {
            const tableData = JSON.parse(entity.tableData);
            if (tableData && tableData[entity.selectedRowIndex])
              value = tableData[entity.selectedRowIndex];
          } catch (e) {
            noop();
          }
        }
        return (
          <EntityProperty
            key={entityProperty}
            propertyName={entityProperty}
            entityName={name}
            value={value}
          />
        );
      })
  );
};

const getEntityChildren = (entity: any) => {
  // If this is widget with children
  // Get the widget entities for the children
  // This assumes that actions cannot have the `children` property
  const childEntities =
    entity.children &&
    entity.children.length > 0 &&
    entity.children.map((child: any) => getWidgetEntity(child));
  if (childEntities) return childEntities;

  // Gets the properties (ReactNodes) for the entity
  return getEntityProperties(entity);
  // return getEntityProperties(entity);
};

// A single widget entity entry in the entity explorer
const getWidgetEntity = (entity: any) => {
  // If this is a canvas widget, simply render
  // child widget entries.
  // This prevents the Canvas widget from showing up
  // in the entity explrorer
  if (entity.type === WidgetTypes.CANVAS_WIDGET) {
    return getEntityChildren(entity);
  }
  // TODO(abhinav): Let it pass when the Icon widget is available.
  if (entity.type === WidgetTypes.ICON_WIDGET) {
    return null;
  }
  const navigateToWidget = () => {
    const el = document.getElementById(entity.widgetId);
    el?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    if (el) flashElement(el);
  };
  return (
    <Entity
      key={entity.widgetId}
      icon={getWidgetIcon(entity.type)}
      name={entity.widgetName}
      action={navigateToWidget}
    >
      {getEntityChildren({ ...entity, ENTITY_TYPE: ENTITY_TYPE.WIDGET })}
    </Entity>
  );
};

// A single entry of an action entity
// Agnostic of the type of action.
const getActionEntity = (
  entity: any,
  name: ReactNode,
  isCurrentAction: boolean,
  entityURL?: string,
  icon?: ReactNode,
) => {
  return (
    <Entity
      key={entity.config.id}
      icon={icon}
      name={name}
      action={entityURL ? () => history.push(entityURL) : noop}
      isDefaultExpanded={isCurrentAction}
      active={isCurrentAction}
      contextMenu={
        <ActionEntityContextMenu
          id={entity.config.id}
          name={entity.config.name}
          className={EntityClassNames.ACTION_CONTEXT_MENU}
        />
      }
    >
      {getEntityChildren(entity)}
    </Entity>
  );
};

// Gets the Actions groups in the entity explorer
// ACTION_PLUGIN_MAP specifies the number of groups
// APIs, Queries, etc.
const getActionGroups = (
  page: { name: string; id: string },
  group: { type: ENTITY_TYPE; entries: any },
  params: ExplorerURLParams,
  dispatch: any,
) => {
  return ACTION_PLUGIN_MAP?.map((config?: GroupConfig) => {
    const entries = group.entries.filter(
      (entry: { config: Action }) => entry.config.pluginType === config?.type,
    );
    return (
      <Entity
        key={page.id + "_" + config?.type}
        icon={config?.icon}
        name={config?.groupName || "Actions"}
        disabled={!entries.length}
        action={noop}
        createFn={() => {
          const path = config?.generateCreatePageURL(
            params?.applicationId,
            params?.pageId,
            params?.pageId,
          );
          history.push(path);
        }}
        isDefaultExpanded={config?.isExpanded(params)}
      >
        {entries.map((action: { config: RestAction }) =>
          getActionEntity(
            action,
            config?.getNameNode(
              action.config.name,
              action.config.actionConfiguration.httpMethod || undefined,
            ),
            params?.apiId === action.config.id ||
              params?.queryId === action.config.id,
            config?.getURL(params.applicationId, page.id, action.config.id),
            config?.icon,
          ),
        )}
      </Entity>
    );
  });
};

// Gets the Widgets group in the entity explorer
// This is the collapsible component which shows the list
// of widgets in the selected page.
const getWidgetsGroup = (
  page: { name: string; id: string },
  group: { entries: any },
) => {
  return (
    <Entity
      key={page.id + "_widgets"}
      icon={widgetIcon}
      name="Widgets"
      disabled={false}
      action={noop}
    >
      {getWidgetEntity(group.entries)}
    </Entity>
  );
};

// Gets the Page Entity Component.
// This is the collapsible page item in the entity explorer
const getPageEntity = (
  page: { name: string; id: string },
  groups: ReactNode,
  isCurrentPage: boolean,
  params: ExplorerURLParams,
) => {
  return (
    <Entity
      key={page.id}
      icon={pageIcon}
      name={page.name}
      action={() =>
        !isCurrentPage &&
        params.applicationId &&
        history.push(EXPLORER_URL(params.applicationId, page.id))
      }
      active={isCurrentPage}
      isDefaultExpanded={isCurrentPage}
    >
      {isCurrentPage && groups}
    </Entity>
  );
};

// Gets the groups of entities in a page
export const getPageEntityGroups = (
  page: { name: string; id: string },
  entityGroups: Array<{ type: ENTITY_TYPE; entries: any }>,
  isCurrentPage: boolean,
  params: ExplorerURLParams,
  dispatch: any,
) => {
  const groups = entityGroups.map(group => {
    switch (group.type) {
      case ENTITY_TYPE.ACTION:
        return getActionGroups(page, group, params, dispatch);
      case ENTITY_TYPE.WIDGET:
        return getWidgetsGroup(page, group);
      default:
        return null;
    }
  });
  return getPageEntity(page, groups, isCurrentPage, params);
};

export const getDatasourceEntities = (
  datasources: Datasource[],
  plugins: Plugin[],
  params: ExplorerURLParams,
) => {
  const pluginGroupNodes: ReactNode[] = [];
  const pluginGroups = groupBy(datasources, "pluginId");
  for (const [pluginId, datasources] of Object.entries(pluginGroups)) {
    const plugin = plugins.find((plugin: Plugin) => plugin.id === pluginId);
    const pluginIcon = getPluginIcon(plugin);
    const currentGroup =
      !!params.datasourceId &&
      datasources
        .map(datasource => datasource.id)
        .indexOf(params.datasourceId) > -1;
    pluginGroupNodes.push(
      <Entity
        key={plugin?.name || "Unknown Plugin"}
        icon={pluginIcon}
        name={plugin?.name || "Unknown Plugin"}
        active={currentGroup}
        action={noop}
      >
        {datasources.map((datasource: Datasource) => {
          return (
            <Entity
              key={datasource.id}
              icon={pluginIcon}
              name={<span>{datasource.name}</span>}
              active={params?.datasourceId === datasource.id}
              action={() =>
                history.push(
                  DATA_SOURCES_EDITOR_ID_URL(
                    params.applicationId,
                    params.pageId,
                    datasource.id,
                  ),
                )
              }
              contextMenu={
                <DataSourceContextMenu
                  datasourceId={datasource.id}
                  className={EntityClassNames.ACTION_CONTEXT_MENU}
                />
              }
            />
          );
        })}
      </Entity>,
    );
  }
  return pluginGroupNodes;
};
