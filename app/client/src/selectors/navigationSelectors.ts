import type {
  DataTree,
  AppsmithEntity,
} from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { createSelector } from "reselect";
import {
  getActionsForCurrentPage,
  getJSCollections,
  getPlugins,
} from "selectors/entitiesSelector";
import { getWidgets } from "sagas/selectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { jsCollectionIdURL, widgetURL } from "RouteBuilder";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getActionChildrenNavData } from "utils/NavigationSelector/ActionChildren";
import { createNavData } from "utils/NavigationSelector/common";
import { getWidgetChildrenNavData } from "utils/NavigationSelector/WidgetChildren";
import { getJsChildrenNavData } from "utils/NavigationSelector/JsChildren";
import { getAppsmithNavData } from "utils/NavigationSelector/AppsmithNavData";
import { isJSAction } from "ce/workers/Evaluation/evaluationUtils";

export type NavigationData = {
  name: string;
  id: string;
  type: ENTITY_TYPE;
  url: string | undefined;
  navigable: boolean;
  children: EntityNavigationData;
  peekable: boolean;
  peekData?: unknown;
  key?: string;
};
export type EntityNavigationData = Record<string, NavigationData>;

export const getEntitiesForNavigation = createSelector(
  getActionsForCurrentPage,
  getPlugins,
  getJSCollections,
  getWidgets,
  getCurrentPageId,
  getDataTree,
  (_: any, entityName: string | undefined) => entityName,
  (
    actions,
    plugins,
    jsActions,
    widgets,
    pageId,
    dataTree: DataTree,
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
      const config = getActionConfig(action.config.pluginType);
      // dataTree used to get entityDefinitions and peekData
      const result = getActionChildrenNavData(action, dataTree);
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
        peekable: true,
        peekData: result?.peekData,
        children: result?.childNavData || {},
      });
    });

    jsActions.forEach((jsAction) => {
      // dataTree for null check and peekData
      const result = getJsChildrenNavData(jsAction, pageId, dataTree);
      navigationData[jsAction.config.name] = createNavData({
        id: jsAction.config.id,
        name: jsAction.config.name,
        type: ENTITY_TYPE.JSACTION,
        url: jsCollectionIdURL({ pageId, collectionId: jsAction.config.id }),
        peekable: true,
        peekData: result?.peekData,
        children: result?.childNavData || {},
      });
    });

    Object.values(widgets).forEach((widget) => {
      // dataTree to get entityDefinitions, for url (can use getWidgetByName?) and peekData
      const result = getWidgetChildrenNavData(widget, dataTree, pageId);
      navigationData[widget.widgetName] = createNavData({
        id: widget.widgetId,
        name: widget.widgetName,
        type: ENTITY_TYPE.WIDGET,
        url: widgetURL({ pageId, selectedWidgets: [widget.widgetId] }),
        peekable: true,
        peekData: result?.peekData,
        children: result?.childNavData || {},
      });
    });
    // dataTree to get entity definitions and peekData
    navigationData["appsmith"] = getAppsmithNavData(
      dataTree.appsmith as AppsmithEntity,
    );
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
