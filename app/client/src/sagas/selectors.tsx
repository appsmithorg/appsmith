import type { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";
import memoize from "proxy-memoize";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetProps } from "widgets/BaseWidget";
import _, { defaults, omit } from "lodash";
import type { WidgetType } from "constants/WidgetConstants";
import { WIDGET_PROPS_TO_SKIP_FROM_EVAL } from "constants/WidgetConstants";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import type { Page } from "entities/Page";
import { getActions, getPlugins } from "ee/selectors/entitiesSelector";
import type { Plugin } from "entities/Plugin";
import type { DataTreeForActionCreator } from "components/editorComponents/ActionCreator/types";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";

export const getWidgets = (
  state: DefaultRootState,
): CanvasWidgetsReduxState => {
  return state.entities.canvasWidgets;
};

export const getWidgetsByName = createSelector(getWidgets, (widgets) => {
  return _.keyBy(widgets, "widgetName");
});

export const getWidgetsForEval = createSelector(getWidgets, (widgets) => {
  const widgetForEval: CanvasWidgetsReduxState = {};

  for (const key of Object.keys(widgets)) {
    widgetForEval[key] = omit(
      widgets[key],
      Object.keys(WIDGET_PROPS_TO_SKIP_FROM_EVAL),
    ) as FlattenedWidgetProps;
  }

  return widgetForEval;
});

export const getMetaWidgets = (
  state: DefaultRootState,
): MetaWidgetsReduxState => {
  return state.entities.metaWidgets;
};

export const getCanvasAndMetaWidgets = createSelector(
  getWidgets,
  getMetaWidgets,
  (canvasWidget, metaWidget) => defaults({}, canvasWidget, metaWidget),
);

export const getWidgetsMeta = (state: DefaultRootState) => state.entities.meta;

export const getIsMobileBreakPoint = (state: DefaultRootState) =>
  state.ui.mainCanvas.isMobile;

export const getWidgetMetaProps = createSelector(
  [getWidgetsMeta, (_state: DefaultRootState, widget: WidgetProps) => widget],
  (metaState, widget: WidgetProps) => {
    return metaState[widget.metaWidgetId || widget.widgetId];
  },
);

export const getWidgetByID = (widgetId: string) => {
  return createSelector(
    getWidgets,
    (canvasWidgets: { [widgetId: string]: FlattenedWidgetProps }) => {
      return canvasWidgets[widgetId];
    },
  );
};

export const getWidget = (
  state: DefaultRootState,
  widgetId: string,
): WidgetProps => {
  return state.entities.canvasWidgets[widgetId];
};

export const getWidgetIdsByType = createSelector(
  getWidgets,
  getMetaWidgets,
  (_state: DefaultRootState, widgetType: WidgetType) => widgetType,
  (canvasWidgets, metaWidgets, widgetType) => {
    const canvasWidgetIds = Object.values(canvasWidgets)
      .filter((widget: FlattenedWidgetProps) => widget.type === widgetType)
      .map((widget: FlattenedWidgetProps) => widget.widgetId);

    const metaWidgetIds = Object.values(metaWidgets)
      .filter((widget: FlattenedWidgetProps) => widget.type === widgetType)
      .map((widget: FlattenedWidgetProps) => widget.widgetId);

    return [...canvasWidgetIds, ...metaWidgetIds];
  },
);

export const getAllDetachedWidgetIds = memoize(
  (canvasWidgets: CanvasWidgetsReduxState) => {
    return Object.values(canvasWidgets)
      .filter((widget: FlattenedWidgetProps) => !!widget.detachFromLayout)
      .map((widget: FlattenedWidgetProps) => widget.widgetId);
  },
);

export const getWidgetOptionsTree = memoize((state: DefaultRootState) =>
  Object.values(state.entities.canvasWidgets)
    .filter((w) => w.type !== "CANVAS_WIDGET" && w.type !== "BUTTON_WIDGET")
    .map((w) => {
      return {
        label: w.widgetName,
        id: w.widgetName,
        value: `"${w.widgetName}"`,
        type: w.type,
      };
    }),
);

export const getDataTreeForActionCreator = memoize(
  (state: DefaultRootState) => {
    const dataTree: DataTreeForActionCreator = {};

    Object.keys(state.evaluations.tree).forEach((key) => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value: any = state.evaluations.tree[key];

      dataTree[key] = {
        meta: value?.meta || null,
        ENTITY_TYPE: value?.ENTITY_TYPE || null,
        type: value?.type || null,
      };
    });

    return dataTree;
  },
);

export const getEditorConfigs = (
  state: DefaultRootState,
): { applicationId: string; pageId: string; layoutId: string } | undefined => {
  const pageId = state.entities.pageList.currentPageId;
  const layoutId = state.ui.editor.currentLayoutId;
  const applicationId = state.ui.applications.currentApplication?.id;

  if (!pageId || !layoutId || !applicationId) return undefined;

  return { pageId, layoutId, applicationId };
};

export const getDefaultPageId = (state: DefaultRootState): string =>
  state.entities.pageList.defaultPageId;

export const getDefaultBasePageId = (state: DefaultRootState): string =>
  state.entities.pageList.defaultBasePageId;

export const getExistingWidgetNames = createSelector(
  getWidgets,
  (widgets: { [widgetId: string]: FlattenedWidgetProps }) => {
    return Object.values(widgets).map((widget) => widget.widgetName);
  },
);

export const currentPageId = (state: DefaultRootState) => {
  return state.entities.pageList.currentPageId;
};

export const getExistingActionNames = createSelector(
  getActions,
  currentPageId,
  (actions: ActionData[], pageId?: string) => {
    return _.compact(
      actions.map((action: ActionData) => {
        return action.config.pageId === pageId ? action.config.name : undefined;
      }),
    );
  },
);

/**
 * returns a objects of existing page name in data tree
 *
 * @param state
 */
export const getExistingPageNames = (state: DefaultRootState) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map: Record<string, any> = {};

  state.entities.pageList.pages.map((page: Page) => {
    map[page.pageName] = page.pageName;
  });

  return map;
};

export const getWidgetByName = createSelector(
  getWidgets,
  getMetaWidgets,
  (state: DefaultRootState, widgetName: string) => widgetName,
  (widgets, metaWidgets, widgetName) => {
    for (const widget of Object.values(widgets)) {
      if (widget.widgetName === widgetName) {
        return widget;
      }
    }

    for (const widget of Object.values(metaWidgets)) {
      if (widget.widgetName === widgetName) {
        return widget;
      }
    }

    return null;
  },
);

export const getAllPageIdentities = (state: DefaultRootState) => {
  return state.entities.pageList.pages.map((page) => ({
    pageId: page.pageId,
    basePageId: page.basePageId,
  }));
};

export const getPluginIdOfPackageName = (
  state: DefaultRootState,
  name: string,
): string | undefined => {
  const plugins = state.entities.plugins.list;
  const plugin = plugins.find((plugin) => plugin.packageName === name);

  if (plugin) return plugin.id;

  return undefined;
};

export const getDragDetails = (state: DefaultRootState) => {
  return state.ui.widgetDragResize.dragDetails;
};

export const getIsNewWidgetBeingDragged = (state: DefaultRootState) => {
  const { isDragging } = state.ui.widgetDragResize;

  if (!isDragging) return false;

  const dragDetails = getDragDetails(state);
  const { dragGroupActualParent: dragParent, newWidget } = dragDetails;

  return !!newWidget && !dragParent;
};

export const isCurrentCanvasDragging = createSelector(
  (state: DefaultRootState) => state.ui.widgetDragResize.isDragging,
  getDragDetails,
  (state: DefaultRootState, canvasId: string) => canvasId,
  (isDragging: boolean, dragDetails, canvasId: string) => {
    return dragDetails?.draggedOn === canvasId && isDragging;
  },
);

export const getSelectedWidget = (
  state: DefaultRootState,
): FlattenedWidgetProps | undefined => {
  const selectedWidgetId = state.ui.widgetDragResize.lastSelectedWidget;

  if (!selectedWidgetId) return;

  return state.entities.canvasWidgets[selectedWidgetId];
};

export const getFocusedWidget = (state: DefaultRootState) => {
  const focusedWidgetId = state.ui.widgetDragResize.focusedWidget;

  if (!focusedWidgetId) return;

  return state.entities.canvasWidgets[focusedWidgetId];
};

export const getWidgetImmediateChildren = createSelector(
  getWidget,
  (widget: WidgetProps) => {
    const childrenIds: string[] = [];

    if (widget === undefined) {
      return [];
    }

    const { children = [] } = widget;

    if (children && children.length) {
      for (const childIndex in children) {
        if (children.hasOwnProperty(childIndex)) {
          const child = children[childIndex];

          childrenIds.push(child);
        }
      }
    }

    return childrenIds;
  },
);

export const getPluginIdToPlugin = createSelector(getPlugins, (plugins) =>
  plugins.reduce((acc: Record<string, Plugin>, p: Plugin) => {
    acc[p.id] = p;

    return acc;
  }, {}),
);
