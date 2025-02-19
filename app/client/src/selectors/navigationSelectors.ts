import type { EntityTypeValue } from "ee/entities/DataTree/types";
import {
  ACTION_TYPE,
  JSACTION_TYPE,
  ENTITY_TYPE,
} from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { createSelector } from "reselect";
import {
  getCurrentActions,
  getDatasources,
  getJSCollections,
  getModuleInstanceEntities,
  getModuleInstances,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import { getWidgets } from "sagas/selectors";
import {
  getCurrentBasePageId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { jsCollectionIdURL, widgetURL } from "ee/RouteBuilder";
import { getDataTree } from "selectors/dataTreeSelectors";
import { createNavData } from "utils/NavigationSelector/common";
import { getWidgetChildrenNavData } from "utils/NavigationSelector/WidgetChildren";
import { getJsChildrenNavData } from "utils/NavigationSelector/JsChildren";
import {
  getEntityNameAndPropertyPath,
  isJSAction,
} from "ee/workers/Evaluation/evaluationUtils";
import type { AppState } from "ee/reducers";
import { PluginType } from "entities/Plugin";
import type { StoredDatasource } from "entities/Action";
import type { Datasource } from "entities/Datasource";
import { getModuleInstanceNavigationData } from "ee/utils/moduleInstanceNavigationData";

export interface NavigationData {
  name: string;
  id: string;
  type: EntityTypeValue;
  isfunction?: boolean;
  url: string | undefined;
  navigable: boolean;
  children: EntityNavigationData;
  key?: string;
  pluginName?: string;
  pluginId?: string;
  isMock?: boolean;
  datasourceId?: string;
  actionType?: string;
  widgetType?: string;
  value?: boolean | string;
}

export type EntityNavigationData = Record<string, NavigationData>;

export const getModulesData = createSelector(
  getModuleInstances,
  getModuleInstanceEntities,
  (moduleInstances, moduleInstanceEntities) => {
    return {
      moduleInstances,
      moduleInstanceEntities,
    };
  },
);

export const getEntitiesForNavigation = createSelector(
  getCurrentActions,
  getPlugins,
  getJSCollections,
  getWidgets,
  getCurrentPageId,
  getCurrentBasePageId,
  getDataTree,
  getDatasources,
  getModulesData,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (_: any, entityName: string | undefined) => entityName,
  (
    actions,
    plugins,
    jsActions,
    widgets,
    pageId,
    basePageId,
    dataTree: DataTree,
    datasources: Datasource[],
    modulesData,
    entityName: string | undefined,
  ) => {
    // data tree retriggers this
    jsActions = jsActions.filter((a) => a.config.pageId === pageId);
    const navigationData: EntityNavigationData = {};

    if (!dataTree) return navigationData;

    actions.forEach((action) => {
      const plugin = plugins.find(
        (plugin) => plugin.id === action.config.pluginId,
      );
      const datasourceId = (action.config?.datasource as StoredDatasource)?.id;
      const datasource = datasources.find(
        (datasource) => datasource.id === datasourceId,
      );
      const config = getActionConfig(action.config.pluginType);

      if (!config) return;

      navigationData[action.config.name] = createNavData({
        id: action.config.id,
        name: action.config.name,
        type: ENTITY_TYPE.ACTION,
        url: config.getURL(
          basePageId,
          action.config.baseId,
          action.config.pluginType,
          plugin,
        ),
        children: {},
        // Adding below data as it is required for analytical events
        pluginName: plugin?.name,
        pluginId: plugin?.id,
        datasourceId: datasource?.id,
        isMock: datasource?.isMock,
        actionType:
          action.config.pluginType === PluginType.DB ? "Query" : "API",
      });
    });

    jsActions.forEach((jsAction) => {
      // dataTree for null check
      const result = getJsChildrenNavData(jsAction, basePageId, dataTree);

      navigationData[jsAction.config.name] = createNavData({
        id: jsAction.config.id,
        name: jsAction.config.name,
        type: ENTITY_TYPE.JSACTION,
        url: jsCollectionIdURL({
          basePageId,
          baseCollectionId: jsAction.config.baseId,
        }),
        children: result?.childNavData || {},
      });
    });

    Object.values(widgets).forEach((widget) => {
      // dataTree to get entityDefinitions, for url (can use getWidgetByName?)
      const result = getWidgetChildrenNavData(
        widget.widgetName,
        widget.type,
        dataTree,
        basePageId,
      );

      navigationData[widget.widgetName] = createNavData({
        id: widget.widgetId,
        name: widget.widgetName,
        type: ENTITY_TYPE.WIDGET,
        url: widgetURL({ basePageId, selectedWidgets: [widget.widgetId] }),
        children: result?.childNavData || {},
        widgetType: widget.type,
      });
    });
    let moduleInstanceNavigationData: EntityNavigationData = {};

    if (!!modulesData.moduleInstances) {
      moduleInstanceNavigationData = getModuleInstanceNavigationData(
        modulesData.moduleInstances,
        modulesData.moduleInstanceEntities,
      );
    }

    if (
      entityName &&
      isJSAction(dataTree[entityName]) &&
      entityName in navigationData
    ) {
      return {
        ...navigationData,
        ...moduleInstanceNavigationData,
        this: navigationData[entityName],
      };
    }

    return {
      ...navigationData,
      ...moduleInstanceNavigationData,
    };
  },
);
export const getPathNavigationUrl = createSelector(
  [
    (state: AppState, entityName: string) =>
      getEntitiesForNavigation(state, entityName),
    (_, __, fullPath: string | undefined) => fullPath,
  ],
  (entitiesForNavigation, fullPath) => {
    if (!fullPath) return undefined;

    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    const navigationData = entitiesForNavigation[entityName];

    if (!navigationData) return undefined;

    switch (navigationData.type) {
      case JSACTION_TYPE: {
        const jsPropertyNavigationData = navigationData.children[propertyPath];

        return jsPropertyNavigationData.url;
      }
      case ACTION_TYPE: {
        return navigationData.url;
      }
      default:
        return undefined;
    }
  },
);
