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
import { JSAction } from "entities/JSCollection";
import { keyBy } from "lodash";

export type NavigationData = {
  name: string;
  id: string;
  type: ENTITY_TYPE;
  url: string | undefined;
  navigable: boolean;
  children: Record<string, NavigationData>;
};
export type EntityNavigationData = Record<string, NavigationData>;

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
        navigable: true,
        children: {},
      };
    });

    jsActions.forEach((jsAction) => {
      navigationData[jsAction.config.name] = {
        name: jsAction.config.name,
        id: jsAction.config.id,
        type: ENTITY_TYPE.JSACTION,
        url: jsCollectionIdURL({ pageId, collectionId: jsAction.config.id }),
        navigable: true,
        children: keyBy(
          jsAction.config.actions.map((func: JSAction) => ({
            name: `${jsAction.config.name}.${func.name}`,
            key: func.name,
            id: `${jsAction.config.name}.${func.name}`,
            type: ENTITY_TYPE.JSACTION,
            url: jsCollectionIdURL({
              pageId,
              collectionId: jsAction.config.id,
              functionName: func.name,
            }),
            navigable: true,
            children: {},
          })),
          (data) => data.key,
        ),
      };
    });

    Object.values(widgets).forEach((widget) => {
      navigationData[widget.widgetName] = {
        name: widget.widgetName,
        id: widget.widgetId,
        type: ENTITY_TYPE.WIDGET,
        url: builderURL({ pageId, hash: widget.widgetId }),
        navigable: true,
        children: {},
      };
    });

    return navigationData;
  },
);
