import { createSelector } from "reselect";

import { AppState } from "reducers";
import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import { WidgetProps, WidgetSkeleton } from "widgets/BaseWidget";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { PageListReduxState } from "reducers/entityReducers/pageListReducer";

import { OccupiedSpace } from "constants/editorConstants";
import { getActions } from "selectors/entitiesSelector";
import {
  MAIN_CONTAINER_WIDGET_ID,
  RenderMode,
  RenderModes,
} from "constants/WidgetConstants";
import { findKey } from "lodash";
import produce from "immer";
import { getAppMode } from "./applicationSelectors";
import { APP_MODE } from "reducers/entityReducers/appReducer";

const getWidgetConfigs = (state: AppState) => state.entities.widgetConfig;
const getPageListState = (state: AppState) => state.entities.pageList;

export const getProviderCategories = (state: AppState) =>
  state.ui.providers.providerCategories;

const getWidgets = (state: AppState): CanvasWidgetsReduxState =>
  state.entities.canvasWidgets;

export const getIsEditorInitialized = (state: AppState) =>
  state.ui.editor.initialized;

export const getIsEditorLoading = (state: AppState) =>
  state.ui.editor.loadingStates.loading;

export const getIsFetchingPage = (state: AppState) =>
  state.ui.editor.loadingStates.isPageSwitching;

export const getLoadingError = (state: AppState) =>
  state.ui.editor.loadingStates.loadingError;

export const getIsPageSaving = (state: AppState) => {
  let areApisSaving = false;

  const savingApis = state.ui.apiPane.isSaving;

  Object.keys(savingApis).forEach((apiId) => {
    areApisSaving = savingApis[apiId] || areApisSaving;
  });

  return state.ui.editor.loadingStates.saving || areApisSaving;
};

export const getPageSavingError = (state: AppState) => {
  return state.ui.editor.loadingStates.savingError;
};

export const getLayoutOnLoadActions = (state: AppState) =>
  state.ui.editor.pageActions || [];

export const getIsPublishingApplication = (state: AppState) =>
  state.ui.editor.loadingStates.publishing;

export const getPublishingError = (state: AppState) =>
  state.ui.editor.loadingStates.publishingError;

export const getCurrentLayoutId = (state: AppState) =>
  state.ui.editor.currentLayoutId;

export const getPageList = (state: AppState) => state.entities.pageList.pages;

export const getCurrentPageId = (state: AppState) =>
  state.entities.pageList.currentPageId;

export const getCurrentApplicationId = (state: AppState) =>
  state.entities.pageList.applicationId;

export const getViewModePageList = createSelector(
  getPageList,
  getCurrentPageId,
  (pageList: PageListReduxState["pages"], currentPageId?: string) => {
    if (currentPageId) {
      const currentPage = pageList.find(
        (page) => page.pageId === currentPageId,
      );
      if (!!currentPage?.isHidden) {
        return [currentPage];
      }

      const visiblePages = pageList.filter((page) => !page.isHidden);
      return visiblePages;
    }

    return [];
  },
);

export const getCurrentApplicationLayout = (state: AppState) =>
  state.ui.applications.currentApplication?.appLayout;

export const getCurrentPageName = createSelector(
  getPageListState,
  (pageList: PageListReduxState) =>
    pageList.pages.find((page) => page.pageId === pageList.currentPageId)
      ?.pageName,
);

export const getCanvasWidth = (state: AppState) =>
  state.entities.canvasWidgets[MAIN_CONTAINER_WIDGET_ID].rightColumn;

export const getWidgetFromDataTree = (
  state: AppState,
  ownProps: { widgetId: string },
) => {
  if (!ownProps.widgetId) return;
  const widgetName = findKey(state.evaluations.tree, {
    widgetId: ownProps.widgetId,
  });
  if (widgetName) {
    const props: WidgetProps = state.evaluations.tree[
      widgetName
    ] as WidgetProps;
    return produce(props, (draft) => {
      for (const [key, value] of Object.entries(ownProps)) {
        if (draft && draft.hasOwnProperty(key) && draft[key] !== value)
          draft[key] = value;
      }
    });
  }
  return;
};

export const getWidgetFromCanvasWidgets = (
  state: AppState,
  ownProps: { widgetId: string },
): WidgetProps => {
  const props = state.entities.canvasWidgets[ownProps.widgetId];
  return produce(props, (draft) => {
    for (const [key, value] of Object.entries(ownProps)) {
      if (draft && draft.hasOwnProperty(key) && draft[key] !== value)
        draft[key] = value;
    }
  });
};

export const makeGetWidgetProps = () => {
  return createSelector(
    getCanvasWidth,
    getWidgetFromCanvasWidgets,
    getWidgetFromDataTree,
    (
      canvasWidth: number,
      canvasWidget: WidgetProps,
      dataTreeWidget?: WidgetProps,
    ): WidgetProps => {
      console.log("Connected Widgets, Widget Props selector", {
        widget: dataTreeWidget || canvasWidget,
      });
      const props: WidgetProps = dataTreeWidget || canvasWidget;
      // TODO(abhinav): Get static props from canvas widget and others from dataTree widget
      return { ...props, canvasWidth: canvasWidth };
    },
  );
};

export const getWidgetCards = createSelector(
  getWidgetConfigs,
  (widgetConfigs: WidgetConfigReducerState) => {
    const cards = Object.values(widgetConfigs.config).filter(
      (config) => !config.hideCard,
    );

    return cards
      .map((config) => {
        const {
          columns,
          detachFromLayout = false,
          displayName,
          iconSVG,
          key,
          rows,
          type,
        } = config;
        return {
          key,
          type,
          rows,
          columns,
          detachFromLayout,
          displayName,
          icon: iconSVG,
        };
      })
      .sort(
        ({ displayName: widgetACardName }, { displayName: widgetBCardName }) =>
          widgetACardName.localeCompare(widgetBCardName),
      );
  },
);

function getChildren(
  widgets: CanvasWidgetsReduxState,
  renderMode: RenderMode,
  children?: string[],
): WidgetSkeleton[] | undefined {
  if (!children) return undefined;
  return children.map((child: string) => {
    const childProps: FlattenedWidgetProps = widgets[child];
    return {
      widgetId: child,
      type: childProps.type,
      parentId: childProps.parentId,
      children: getChildren(widgets, renderMode, childProps.children),
      renderMode,
      detachFromLayout: !!childProps.detachFromLayout,
      isVisible: childProps.isVisible,
    };
  });
}
export const getCanvasWidgetDsl = createSelector(
  getWidgets,
  getAppMode,
  (widgets: CanvasWidgetsReduxState, mode?: APP_MODE): WidgetSkeleton => {
    const renderMode: RenderMode =
      mode === undefined || mode === APP_MODE.EDIT
        ? RenderModes.CANVAS
        : RenderModes.PAGE;
    const maincanvas: FlattenedWidgetProps = widgets["0"];
    console.log("Connected Widgets Widget Tree", { maincanvas });
    //TODO(abhinav): Move to a redux reducer or useReducer in Canvas
    const tree = {
      widgetId: maincanvas.widgetId,
      type: maincanvas.type,
      children: getChildren(widgets, renderMode, maincanvas.children),
      renderMode,
      detachFromLayout: true,
      isVisible: true,
    };
    console.log("Connected Widgets Widget Tree", { tree });
    return tree;
  },
);

const getOccupiedSpacesForContainer = (
  containerWidgetId: string,
  widgets: FlattenedWidgetProps[],
): OccupiedSpace[] => {
  return widgets.map((widget) => {
    const occupiedSpace: OccupiedSpace = {
      id: widget.widgetId,
      parentId: containerWidgetId,
      left: widget.leftColumn,
      top: widget.topRow,
      bottom: widget.bottomRow,
      right: widget.rightColumn,
    };
    return occupiedSpace;
  });
};

export const getOccupiedSpaces = createSelector(
  getWidgets,
  (
    widgets: CanvasWidgetsReduxState,
  ): { [containerWidgetId: string]: OccupiedSpace[] } | undefined => {
    const occupiedSpaces: {
      [containerWidgetId: string]: OccupiedSpace[];
    } = {};
    // Get all widgets with type "CONTAINER_WIDGET" and has children
    const containerWidgets: FlattenedWidgetProps[] = Object.values(
      widgets,
    ).filter((widget) => widget.children && widget.children.length > 0);

    // If we have any container widgets
    if (containerWidgets) {
      containerWidgets.forEach((containerWidget: FlattenedWidgetProps) => {
        const containerWidgetId = containerWidget.widgetId;
        // Get child widgets for the container
        const childWidgets = Object.keys(widgets).filter(
          (widgetId) =>
            containerWidget.children &&
            containerWidget.children.indexOf(widgetId) > -1 &&
            !widgets[widgetId].detachFromLayout,
        );
        // Get the occupied spaces in this container
        // Assign it to the containerWidgetId key in occupiedSpaces
        occupiedSpaces[containerWidgetId] = getOccupiedSpacesForContainer(
          containerWidgetId,
          childWidgets.map((widgetId) => widgets[widgetId]),
        );
      });
    }
    // Return undefined if there are no occupiedSpaces.
    return Object.keys(occupiedSpaces).length > 0 ? occupiedSpaces : undefined;
  },
);

export const getActionById = createSelector(
  [getActions, (state: any, props: any) => props.match.params.apiId],
  (actions, id) => {
    const action = actions.find((action) => action.config.id === id);
    if (action) {
      return action.config;
    } else {
      return undefined;
    }
  },
);
/*const createCanvasWidget = (
  canvasWidget: FlattenedWidgetProps,
  evaluatedWidget: DataTreeWidget,
) => {
  const widgetStaticProps = _.pick(
    canvasWidget,
    Object.keys(WIDGET_STATIC_PROPS),
  );
  return {
    ...evaluatedWidget,
    ...widgetStaticProps,
  };
};

const createLoadingWidget = (
  canvasWidget: FlattenedWidgetProps,
): DataTreeWidget => {
  const widgetStaticProps = _.pick(
    canvasWidget,
    Object.keys(WIDGET_STATIC_PROPS),
  ) as WidgetProps;
  return {
    ...widgetStaticProps,
    type: WidgetTypes.SKELETON_WIDGET,
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    bindingPaths: {},
    triggerPaths: {},
    validationPaths: {},
    logBlackList: {},
    isLoading: true,
  };
};*/
