import {
  DataTree,
  DataTreeWidget,
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
import { keyBy } from "lodash";
import { getDataTree } from "selectors/dataTreeSelectors";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";

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
  getDataTree,
  (actions, plugins, jsActions, widgets, pageId, dataTree: DataTree) => {
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
        children: getJsObjectChildren(jsAction, pageId),
      };
    });

    Object.values(widgets).forEach((widget) => {
      navigationData[widget.widgetName] = {
        name: widget.widgetName,
        id: widget.widgetId,
        type: ENTITY_TYPE.WIDGET,
        url: builderURL({ pageId, hash: widget.widgetId }),
        navigable: true,
        children: getWidgetChildren(widget, dataTree, pageId),
      };
    });
    return navigationData;
  },
);

const getJsObjectChildren = (jsAction: JSCollectionData, pageId: string) => {
  const children = [
    ...jsAction.config.actions,
    ...jsAction.config.variables,
  ].map((jsChild) => ({
    name: `${jsAction.config.name}.${jsChild.name}`,
    key: jsChild.name,
    id: `${jsAction.config.name}.${jsChild.name}`,
    type: ENTITY_TYPE.JSACTION,
    url: jsCollectionIdURL({
      pageId,
      collectionId: jsAction.config.id,
      functionName: jsChild.name,
    }),
    navigable: true,
    children: {},
  }));

  return keyBy(children, (data) => data.key);
};

const getWidgetChildren = (
  widget: FlattenedWidgetProps,
  dataTree: DataTree,
  pageId: string,
) => {
  if (widget.type === "FORM_WIDGET") {
    const children: EntityNavigationData = {};
    const dataTreeWidget: DataTreeWidget = dataTree[
      widget.widgetName
    ] as DataTreeWidget;
    const formChildren: EntityNavigationData = {};
    if (dataTreeWidget) {
      Object.keys(dataTreeWidget.data || {}).forEach((widgetName) => {
        const childWidgetId = (dataTree[widgetName] as DataTreeWidget).widgetId;
        formChildren[widgetName] = {
          name: widgetName,
          id: `${widget.widgetName}.data.${widgetName}`,
          type: ENTITY_TYPE.WIDGET,
          navigable: true,
          children: {},
          url: builderURL({ pageId, hash: childWidgetId }),
        };
      });
    }
    children.data = {
      name: "data",
      id: `${widget.widgetName}.data`,
      type: ENTITY_TYPE.WIDGET,
      navigable: false,
      children: formChildren,
      url: undefined,
    };

    return children;
  }
  return {};
};
