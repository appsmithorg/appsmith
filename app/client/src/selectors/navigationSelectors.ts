import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
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

export type EntityNavigationData = Record<
  string,
  { name: string; id: string; type: ENTITY_TYPE; url: string }
>;

export const getEntitiesForNavigation = createSelector(
  getActionsForCurrentPage,
  getPlugins,
  getJSCollectionsForCurrentPage,
  getWidgets,
  getCurrentPageId,
  (actions, plugins, jsActions, widgets, pageId) => {
    const navigationData: EntityNavigationData = {};

    actions.forEach((action) => {
      const plugin = plugins.find(
        (plugin) => plugin.id === action.config.pluginId,
      );
      const config = getActionConfig(action.config.pluginType);
      if (!config) return;
      navigationData[action.config.name] = {
        name: action.config.name,
        id: action.config.id,
        type: ENTITY_TYPE.ACTION,
        url: config.getURL(
          pageId,
          action.config.id,
          action.config.pluginType,
          plugin,
        ),
      };
    });

    jsActions.forEach((jsAction) => {
      navigationData[jsAction.config.name] = {
        name: jsAction.config.name,
        id: jsAction.config.id,
        type: ENTITY_TYPE.JSACTION,
        url: jsCollectionIdURL({ pageId, collectionId: jsAction.config.id }),
      };
    });

    Object.values(widgets).forEach((widget) => {
      navigationData[widget.widgetName] = {
        name: widget.widgetName,
        id: widget.widgetId,
        type: ENTITY_TYPE.WIDGET,
        url: builderURL({ pageId, hash: widget.widgetId }),
      };
    });

    return navigationData;
  },
);
