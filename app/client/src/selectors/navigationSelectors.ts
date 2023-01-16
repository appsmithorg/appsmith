import {
  DataTree,
  DataTreeAction,
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
import { entityDefinitions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import { ActionData } from "reducers/entityReducers/actionsReducer";

export type NavigationData = {
  name: string;
  id: string;
  type: ENTITY_TYPE;
  url: string | undefined;
  navigable: boolean;
  children: Record<string, NavigationData>;
  peekable: boolean;
  peekData?: unknown;
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
      const definitions = entityDefinitions.ACTION(
        dataTree[action.config.name] as DataTreeAction,
        {},
      );
      console.log(
        "entitiesForNav",
        config,
        action.config,
        dataTree[action.config.name],
        definitions,
      );
      const { childNavData, peekData } = getActionPeekData(
        action,
        entityDefinitions.ACTION(
          dataTree[action.config.name] as DataTreeAction,
          {},
        ),
        dataTree[action.config.name] as DataTreeAction,
      );
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
        children: childNavData,
        peekable: true,
        peekData,
      };
      console.log("--- entitiesForNav", navigationData[action.config.name]);
    });

    jsActions.forEach((jsAction) => {
      navigationData[jsAction.config.name] = {
        name: jsAction.config.name,
        id: jsAction.config.id,
        type: ENTITY_TYPE.JSACTION,
        url: jsCollectionIdURL({ pageId, collectionId: jsAction.config.id }),
        navigable: true,
        children: getJsObjectChildren(jsAction, pageId),
        peekable: false,
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
        peekable: false,
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
    peekable: false,
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
          peekable: false,
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
      peekable: false,
    };

    return children;
  }
  return {};
};

const getActionPeekData = (
  action: ActionData,
  definitions: Record<string, unknown>,
  dataTree: DataTreeAction,
) => {
  const peekData: Record<string, unknown> = {};
  const childNavData: Record<string, NavigationData> = {};
  Object.keys(definitions).forEach((key) => {
    if (key.indexOf("!") === -1) {
      if (key === "data" || key === "isLoading" || key === "responseMeta") {
        peekData[key] = dataTree[key];
        childNavData[key] = {
          id: `${action.config.name}.${key}`,
          name: key,
          type: ENTITY_TYPE.ACTION,
          navigable: false,
          url: undefined,
          children: {},
          peekable: true,
          peekData: dataTree[key],
        };
      }
    }
  });

  return { peekData, childNavData };
};
