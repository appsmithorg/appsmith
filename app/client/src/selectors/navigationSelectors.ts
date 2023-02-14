import {
  DataTree,
  DataTreeAppsmith,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { createSelector } from "reselect";
import {
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
  getPlugins,
} from "selectors/entitiesSelector";
import { getWidgets } from "sagas/selectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { builderURL, jsCollectionIdURL } from "RouteBuilder";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getActionChildrenNavData } from "utils/NavigationSelector/ActionChildren";
import { createNavData } from "utils/NavigationSelector/common";
import { getWidgetChildrenNavData } from "utils/NavigationSelector/WidgetChildren";
import { getJsChildrenNavData } from "utils/NavigationSelector/JsChildren";
import { getAppsmithNavData } from "utils/NavigationSelector/AppsmithNavData";

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
  getJSCollectionsForCurrentPage,
  getWidgets,
  getCurrentPageId,
  getDataTree,
  (actions, plugins, jsActions, widgets, pageId, dataTree: DataTree) => {
    const navigationData: EntityNavigationData = {};

    actions.forEach((action) => {
      const plugin = plugins.find(
        (plugin) => plugin.id === action.config.pluginId,
      );
      const config = getActionConfig(action.config.pluginType);
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
      const result = getWidgetChildrenNavData(widget, dataTree, pageId);
      navigationData[widget.widgetName] = createNavData({
        id: widget.widgetId,
        name: widget.widgetName,
        type: ENTITY_TYPE.WIDGET,
        url: builderURL({ pageId, hash: widget.widgetId }),
        peekable: true,
        peekData: result?.peekData,
        children: result?.childNavData || {},
      });
    });
    navigationData["appsmith"] = getAppsmithNavData(
      dataTree.appsmith as DataTreeAppsmith,
    );
    return navigationData;
  },
);
