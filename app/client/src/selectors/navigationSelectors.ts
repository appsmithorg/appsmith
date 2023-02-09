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
      navigationData[action.config.name] = createNavData(
        action.config.name,
        action.config.id,
        ENTITY_TYPE.ACTION,
        true,
        config.getURL(
          pageId,
          action.config.id,
          action.config.pluginType,
          plugin,
        ),
        true,
        result?.peekData,
        result?.childNavData || {},
      );
    });

    jsActions.forEach((jsAction) => {
      const result = getJsChildrenNavData(jsAction, pageId, dataTree);
      navigationData[jsAction.config.name] = createNavData(
        jsAction.config.name,
        jsAction.config.id,
        ENTITY_TYPE.JSACTION,
        true,
        jsCollectionIdURL({ pageId, collectionId: jsAction.config.id }),
        true,
        result?.peekData,
        result?.childNavData || {},
      );
    });

    Object.values(widgets).forEach((widget) => {
      const result = getWidgetChildrenNavData(widget, dataTree, pageId);
      navigationData[widget.widgetName] = createNavData(
        widget.widgetName,
        widget.widgetId,
        ENTITY_TYPE.WIDGET,
        true,
        builderURL({ pageId, hash: widget.widgetId }),
        true,
        result?.peekData,
        result?.childNavData || {},
      );
    });
    navigationData["appsmith"] = getAppsmithNavData(
      dataTree.appsmith as DataTreeAppsmith,
    );
    return navigationData;
  },
);
