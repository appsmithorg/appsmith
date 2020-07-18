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
  MethodTag,
} from "./ExplorerIcons";
import ActionEntityContextMenu from "./ContextMenus/ActionEntityContextMenu";
import DataSourceContextMenu from "./ContextMenus/DataSourceContextMenu";
import { PluginType, Action, RestAction } from "entities/Action";
import { generateReactKey } from "utils/generators";
import { noop, groupBy } from "lodash";
import history from "utils/history";
import {
  EXPLORER_URL,
  DATA_SOURCES_EDITOR_ID_URL,
  QUERIES_EDITOR_URL,
  API_EDITOR_URL,
} from "constants/routes";
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
import { saveActionName } from "actions/actionActions";
import { ReduxAction } from "constants/ReduxActionConstants";
import { flashElement } from "utils/helpers";
import { Datasource } from "api/DatasourcesApi";
import { Plugin } from "api/PluginApi";
import PageContextMenu from "./ContextMenus/PageContextMenu";
import EntityPlaceholder from "./Entity/Placeholder";
import { updatePage } from "actions/pageActions";

type GroupConfig = {
  groupName: string;
  type: PluginType;
  icon: JSX.Element;
  key: string;
  getURL: (applicationId: string, pageId: string, id: string) => string;
  dispatchableCreateAction: (pageId: string) => ReduxAction<{ pageId: string }>;
  generateCreatePageURL: (
    applicationId: string,
    pageId: string,
    selectedPageId: string,
  ) => string;
  getIcon: (method?: string) => ReactNode;
  isGroupActive: (params: ExplorerURLParams) => boolean;
};

export type ExplorerURLParams = {
  applicationId: string;
  pageId: string;
  apiId?: string;
  queryId?: string;
  datasourceId?: string;
};

const getUpdateActionNameReduxAction = (id: string, name: string) => {
  return saveActionName({ id, name });
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
        groupName: "APIs",
        type,
        icon: apiIcon,
        key: generateReactKey(),
        getURL: (applicationId: string, pageId: string, id: string) => {
          return `${API_EDITOR_ID_URL(applicationId, pageId, id)}`;
        },
        getIcon: (method?: string) => {
          if (!method) return apiIcon;
          return <MethodTag type={method} />;
        },
        dispatchableCreateAction: createNewApiAction,
        generateCreatePageURL: API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
        isGroupActive: (params: ExplorerURLParams) =>
          window.location.href.indexOf(
            API_EDITOR_URL(params.applicationId, params.pageId),
          ) > -1,
      };
    case PluginType.DB:
      return {
        groupName: "Queries",
        type,
        icon: queryIcon,
        key: generateReactKey(),
        getURL: (applicationId: string, pageId: string, id: string) =>
          `${QUERIES_EDITOR_ID_URL(applicationId, pageId, id)}`,
        getIcon: (method?: string) => {
          return queryIcon;
        },
        dispatchableCreateAction: createNewQueryAction,
        generateCreatePageURL: QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
        isGroupActive: (params: ExplorerURLParams) =>
          window.location.href.indexOf(
            QUERIES_EDITOR_URL(params.applicationId, params.pageId),
          ) > -1,
      };
    default:
      return undefined;
  }
});

const getEntityProperties = (entity: any, step: number) => {
  let config: any;
  let name: string;
  let data: any;
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
    data = entity.data && entity.data.body ? entity.data.body : entity.data;
    name = entity.config.name;
  } else if (entity.type === WidgetTypes.TABLE_WIDGET) {
    config = entityDefinitions[WidgetTypes.TABLE_WIDGET](entity);
    data = entity.data;
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
        if (entityProperty === "data") {
          value = data;
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
            step={step}
          />
        );
      })
  );
};

const getEntityChildren = (entity: any, step: number) => {
  // If this is widget with children
  // Get the widget entities for the children
  // This assumes that actions cannot have the `children` property
  const childEntities =
    entity.children &&
    entity.children.length > 0 &&
    entity.children.map((child: any) => getWidgetEntity(child, step));
  if (childEntities) return childEntities;

  // Gets the properties (ReactNodes) for the entity
  return getEntityProperties(entity, step + 1);
  // return getEntityProperties(entity);
};

// A single widget entity entry in the entity explorer
const getWidgetEntity = (entity: any, step: number) => {
  if (!entity) return <React.Fragment />;
  // If this is a canvas widget, simply render
  // child widget entries.
  // This prevents the Canvas widget from showing up
  // in the entity explrorer
  if (entity.type === WidgetTypes.CANVAS_WIDGET) {
    return getEntityChildren(entity, step + 1);
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
      entityId={entity.widgetId}
      step={step}
    >
      {getEntityChildren({ ...entity, ENTITY_TYPE: ENTITY_TYPE.WIDGET }, step)}
    </Entity>
  );
};

// A single entry of an action entity
// Agnostic of the type of action.
const getActionEntity = (
  entity: any,
  name: string,
  isCurrentAction: boolean,
  entityURL?: string,
  icon?: ReactNode,
  step?: number,
) => {
  return (
    <Entity
      key={entity.config.id}
      icon={icon}
      name={name}
      action={entityURL ? () => history.push(entityURL) : noop}
      isDefaultExpanded={isCurrentAction}
      active={isCurrentAction}
      entityId={entity.config.id}
      step={step || 0}
      updateEntityName={getUpdateActionNameReduxAction}
      contextMenu={
        <ActionEntityContextMenu
          id={entity.config.id}
          name={entity.config.name}
          className={EntityClassNames.ACTION_CONTEXT_MENU}
        />
      }
    >
      {getEntityChildren(entity, (step || 0) + 1)}
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
  step: number,
  isFiltered: boolean,
) => {
  return ACTION_PLUGIN_MAP?.map((config?: GroupConfig) => {
    const entries = group.entries.filter(
      (entry: { config: Action }) => entry.config.pluginType === config?.type,
    );

    let childNode = entries.map((action: { config: RestAction }) =>
      getActionEntity(
        action,
        action.config.name,
        params?.apiId === action.config.id ||
          params?.queryId === action.config.id,
        config?.getURL(params.applicationId, page.id, action.config.id),
        config?.getIcon(
          action.config.actionConfiguration.httpMethod || undefined,
        ),
        step + 1,
      ),
    );

    if (!isFiltered && (!childNode || !entries.length)) {
      childNode = (
        <EntityPlaceholder step={step + 1}>
          No {config?.groupName || "Actions"} yet. Please click the{" "}
          <strong>+</strong> icon on
          <strong> {config?.groupName || "Actions"}</strong> to create.
        </EntityPlaceholder>
      );
    }
    return (
      <Entity
        key={page.id + "_" + config?.type}
        icon={config?.icon}
        name={config?.groupName || "Actions"}
        action={noop}
        entityId={page.id + "_" + config?.type}
        step={step}
        disabled={isFiltered && (!childNode || !entries.length)}
        createFn={() => {
          const path = config?.generateCreatePageURL(
            params?.applicationId,
            params?.pageId,
            params?.pageId,
          );
          history.push(path);
        }}
        isDefaultExpanded={config?.isGroupActive(params)}
        active={config?.isGroupActive(params)}
      >
        {childNode}
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
  step: number,
  isFiltered: boolean,
) => {
  let childNode = getWidgetEntity(group.entries, step);
  if (!childNode && !isFiltered) {
    childNode = (
      <EntityPlaceholder step={step + 1}>
        No widgets yet. Please click the <strong>Widgets</strong> navigation
        menu icon on the left to drag and drop widgets
      </EntityPlaceholder>
    );
  }
  return (
    <Entity
      key={page.id + "_widgets"}
      icon={widgetIcon}
      step={step}
      name="Widgets"
      action={noop}
      disabled={!group.entries && isFiltered}
      entityId={page.id + "_widgets"}
    >
      {childNode}
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
  step: number,
) => {
  return (
    <Entity
      key={page.id}
      icon={pageIcon}
      name={page.name}
      step={step}
      action={() =>
        !isCurrentPage &&
        params.applicationId &&
        history.push(EXPLORER_URL(params.applicationId, page.id))
      }
      entityId={page.id}
      active={isCurrentPage}
      disabled={!isCurrentPage}
      isDefaultExpanded={isCurrentPage}
      updateEntityName={updatePage}
      contextMenu={
        <PageContextMenu
          applicationId={params.applicationId}
          pageId={page.id}
          name={page.name}
          className={EntityClassNames.ACTION_CONTEXT_MENU}
        />
      }
    >
      {groups}
    </Entity>
  );
};

// Gets the groups of entities in a page
export const getPageEntityGroups = (
  page: { name: string; id: string },
  entityGroups: Array<{ type: ENTITY_TYPE; entries: any }>,
  isCurrentPage: boolean,
  params: ExplorerURLParams,
  step: number,
  isFiltered: boolean,
) => {
  const groups = entityGroups.map(group => {
    switch (group.type) {
      case ENTITY_TYPE.ACTION:
        return getActionGroups(page, group, params, step + 1, isFiltered);
      case ENTITY_TYPE.WIDGET:
        return getWidgetsGroup(page, group, step + 1, isFiltered);
      default:
        return null;
    }
  });
  return getPageEntity(page, groups, isCurrentPage, params, step);
};

export const getDatasourceEntities = (
  datasources: Datasource[],
  plugins: Plugin[],
  params: ExplorerURLParams,
  step: number,
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
        entityId="Plugin"
        key={plugin?.name || "Unknown Plugin"}
        icon={pluginIcon}
        name={plugin?.name || "Unknown Plugin"}
        active={currentGroup}
        action={noop}
        step={step}
      >
        {datasources.map((datasource: Datasource) => {
          return (
            <Entity
              entityId={datasource.id}
              key={datasource.id}
              icon={queryIcon}
              name={datasource.name}
              active={params?.datasourceId === datasource.id}
              step={step + 1}
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
