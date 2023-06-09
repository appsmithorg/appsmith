import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { createSelector } from "reselect";
import {
  getActionsForCurrentPage,
  getDatasources,
  getJSCollections,
  getPlugins,
} from "selectors/entitiesSelector";
import { getWidgets } from "sagas/selectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { jsCollectionIdURL, widgetURL } from "RouteBuilder";
import { getDataTree } from "selectors/dataTreeSelectors";
import { createNavData } from "utils/NavigationSelector/common";
import { getWidgetChildrenNavData } from "utils/NavigationSelector/WidgetChildren";
import { getJsChildrenNavData } from "utils/NavigationSelector/JsChildren";
import {
  getEntityNameAndPropertyPath,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { AppState } from "@appsmith/reducers";
import { PluginType } from "entities/Action";
import type { StoredDatasource } from "entities/Action";
import type { Datasource } from "entities/Datasource";

export type NavigationData = {
  name: string;
  id: string;
  type: ENTITY_TYPE;
  url: string | undefined;
  navigable: boolean;
  children: EntityNavigationData;
  key?: string;
  pluginName?: string;
  isMock?: boolean;
  datasourceId?: string;
  actionType?: string;
};
export type EntityNavigationData = Record<string, NavigationData>;

export const getEntitiesForNavigation = createSelector(
  getActionsForCurrentPage,
  getPlugins,
  getJSCollections,
  getWidgets,
  getCurrentPageId,
  getDataTree,
  getDatasources,
  (_: any, entityName: string | undefined) => entityName,
  (
    actions,
    plugins,
    jsActions,
    widgets,
    pageId,
    dataTree: DataTree,
    datasources: Datasource[],
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
          pageId,
          action.config.id,
          action.config.pluginType,
          plugin,
        ),
        children: {},
        // Adding below data as it is required for analytical events
        pluginName: plugin?.name,
        datasourceId: datasource?.id,
        isMock: datasource?.isMock,
        actionType:
          action.config.pluginType === PluginType.DB ? "Query" : "API",
      });
    });

    jsActions.forEach((jsAction) => {
      // dataTree for null check
      const result = getJsChildrenNavData(jsAction, pageId, dataTree);
      navigationData[jsAction.config.name] = createNavData({
        id: jsAction.config.id,
        name: jsAction.config.name,
        type: ENTITY_TYPE.JSACTION,
        url: jsCollectionIdURL({ pageId, collectionId: jsAction.config.id }),
        children: result?.childNavData || {},
      });
    });

    Object.values(widgets).forEach((widget) => {
      // dataTree to get entityDefinitions, for url (can use getWidgetByName?)
      const result = getWidgetChildrenNavData(
        widget.widgetName,
        widget.type,
        dataTree,
        pageId,
      );
      navigationData[widget.widgetName] = createNavData({
        id: widget.widgetId,
        name: widget.widgetName,
        type: ENTITY_TYPE.WIDGET,
        url: widgetURL({ pageId, selectedWidgets: [widget.widgetId] }),
        children: result?.childNavData || {},
      });
    });
    if (
      entityName &&
      isJSAction(dataTree[entityName]) &&
      entityName in navigationData
    ) {
      return {
        ...navigationData,
        this: navigationData[entityName],
      };
    }
    return navigationData;
  },
);

export const getJSFunctionNavigationUrl = createSelector(
  [
    (state: AppState, entityName: string) =>
      getEntitiesForNavigation(state, entityName),
    (_, __, jsFunctionFullName: string | undefined) => jsFunctionFullName,
  ],
  (entitiesForNavigation, jsFunctionFullName) => {
    if (!jsFunctionFullName) return undefined;
    const { entityName: jsObjectName, propertyPath: jsFunctionName } =
      getEntityNameAndPropertyPath(jsFunctionFullName);
    const jsObjectNavigationData = entitiesForNavigation[jsObjectName];
    const jsFuncNavigationData =
      jsObjectNavigationData && jsObjectNavigationData.children[jsFunctionName];
    return jsFuncNavigationData?.url;
  },
);
