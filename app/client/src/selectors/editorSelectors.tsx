import { createSelector } from "reselect";

import { AppState } from "@appsmith/reducers";
import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import { WidgetCardProps, WidgetProps } from "widgets/BaseWidget";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { PageListReduxState } from "reducers/entityReducers/pageListReducer";

import { OccupiedSpace, WidgetSpace } from "constants/CanvasEditorConstants";
import {
  getActions,
  getCanvasWidgets,
  getJSCollections,
} from "selectors/entitiesSelector";
import {
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
  WidgetType,
} from "constants/WidgetConstants";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { find, sortBy } from "lodash";
import { APP_MODE } from "entities/App";
import { getDataTree, getLoadingEntities } from "selectors/dataTreeSelectors";
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { PLACEHOLDER_APP_SLUG, PLACEHOLDER_PAGE_SLUG } from "constants/routes";
import { ApplicationVersion } from "actions/applicationActions";
import { MainCanvasReduxState } from "reducers/uiReducers/mainCanvasReducer";
import {
  buildChildWidgetTree,
  createCanvasWidget,
  createLoadingWidget,
} from "utils/widgetRenderUtils";
import WidgetFactory, {
  NonSerialisableWidgetConfigs,
} from "utils/WidgetFactory";
import { LOCAL_STORAGE_KEYS } from "utils/localStorage";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";

const getIsDraggingOrResizing = (state: AppState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

const getIsResizing = (state: AppState) => state.ui.widgetDragResize.isResizing;

export const getWidgetConfigs = (state: AppState) =>
  state.entities.widgetConfig;
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
  let areJsObjectsSaving = false;

  const savingApis = state.ui.apiPane.isSaving;
  const savingJSObjects = state.ui.jsPane.isSaving;
  const isSavingAppTheme = state.ui.appTheming.isSaving;

  Object.keys(savingApis).forEach((apiId) => {
    areApisSaving = savingApis[apiId] || areApisSaving;
  });

  Object.keys(savingJSObjects).forEach((collectionId) => {
    areJsObjectsSaving = savingJSObjects[collectionId] || areJsObjectsSaving;
  });

  return (
    state.ui.editor.loadingStates.saving ||
    areApisSaving ||
    areJsObjectsSaving ||
    isSavingAppTheme ||
    state.ui.editor.loadingStates.savingEntity
  );
};

export const snipingModeSelector = (state: AppState) =>
  state.ui.editor.isSnipingMode;

export const snipingModeBindToSelector = (state: AppState) =>
  state.ui.editor.snipModeBindTo;

export const getPageSavingError = (state: AppState) => {
  return state.ui.editor.loadingStates.savingError;
};

export const getLayoutOnLoadActions = (state: AppState) =>
  state.ui.editor.pageActions || [];

export const getLayoutOnLoadIssues = (state: AppState) => {
  return state.ui.editor.layoutOnLoadActionErrors || [];
};

export const getIsPublishingApplication = (state: AppState) =>
  state.ui.editor.loadingStates.publishing;

export const getPublishingError = (state: AppState) =>
  state.ui.editor.loadingStates.publishingError;

export const getCurrentLayoutId = (state: AppState) =>
  state.ui.editor.currentLayoutId;

export const getPageList = (state: AppState) => state.entities.pageList.pages;

export const getPageById = (pageId: string) =>
  createSelector(getPageList, (pages: Page[]) =>
    pages.find((page) => page.pageId === pageId),
  );

export const getCurrentPageId = (state: AppState) =>
  state.entities.pageList.currentPageId;

export const getCurrentPagePermissions = createSelector(
  getCurrentPageId,
  getPageList,
  (pageId, pages) => {
    pages.find((page) => page.pageId === pageId);
  },
);

export const getPagePermissions = (state: AppState) => {
  const pageId = getCurrentPageId(state);
  const page = find(state.entities.pageList.pages, { pageId });

  return page?.userPermissions || [];
};

export const selectCurrentPageSlug = createSelector(
  getCurrentPageId,
  getPageList,
  (pageId, pages) =>
    pages.find((page) => page.pageId === pageId)?.slug || PLACEHOLDER_PAGE_SLUG,
);

export const selectPageSlugToIdMap = createSelector(getPageList, (pages) =>
  pages.reduce((acc, page: Page) => {
    // Comeback
    acc[page.pageId] = page.slug || "";
    return acc;
  }, {} as Record<string, string>),
);

export const getCurrentApplication = (state: AppState) =>
  state.ui.applications.currentApplication;

export const getCurrentApplicationId = (state: AppState) =>
  state.entities.pageList.applicationId ||
  ""; /** this is set during init can assume it to be defined */

export const selectCurrentApplicationSlug = (state: AppState) =>
  state.ui.applications.currentApplication?.slug || PLACEHOLDER_APP_SLUG;

export const selectApplicationVersion = (state: AppState) =>
  state.ui.applications.currentApplication?.applicationVersion ||
  ApplicationVersion.DEFAULT;

export const selectPageSlugById = (pageId: string) =>
  createSelector(getPageList, (pages) => {
    const page = pages.find((page) => page.pageId === pageId);
    return page?.slug || PLACEHOLDER_PAGE_SLUG;
  });

export const selectURLSlugs = createSelector(
  getCurrentApplication,
  getPageList,
  getCurrentPageId,
  (application, pages, pageId) => {
    const applicationSlug = application?.slug || PLACEHOLDER_APP_SLUG;
    const currentPage = pages.find((page) => page.pageId === pageId);
    const pageSlug = currentPage?.slug || PLACEHOLDER_PAGE_SLUG;
    const customSlug = currentPage?.customSlug;
    return { applicationSlug, pageSlug, customSlug };
  },
);

export const getRenderMode = (state: AppState) => {
  return state.entities.app.mode === APP_MODE.EDIT
    ? RenderModes.CANVAS
    : RenderModes.PAGE;
};

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

export const getCanvasWidth = (state: AppState) => state.ui.mainCanvas.width;

export const getMainCanvasProps = (state: AppState) => state.ui.mainCanvas;

export const getCurrentPageName = createSelector(
  getPageListState,
  (pageList: PageListReduxState) =>
    pageList.pages.find((page) => page.pageId === pageList.currentPageId)
      ?.pageName,
);

/**
 * This returns the number of rows which is not occupied by a Canvas Widget within
 * a parent container like widget of type widgetType
 * For example, the Tabs Widget takes 4 rows for the tabs
 * @param widgetType Type of widget
 * @param props Widget properties
 * @returns the offset in rows
 */
export const getCanvasHeightOffset = (
  widgetType: WidgetType,
  props: WidgetProps,
) => {
  // Get the non serialisable configs for the widget type
  const config:
    | Record<NonSerialisableWidgetConfigs, unknown>
    | undefined = WidgetFactory.nonSerialisableWidgetConfigMap.get(widgetType);
  let offset = 0;
  // If this widget has a registered canvasHeightOffset function
  if (config?.canvasHeightOffset) {
    // Run the function to get the offset value
    offset = (config.canvasHeightOffset as (props: WidgetProps) => number)(
      props,
    );
  }
  return offset;
};

export const getWidgetCards = createSelector(
  getWidgetConfigs,
  (widgetConfigs: WidgetConfigReducerState) => {
    const cards = Object.values(widgetConfigs.config).filter(
      (config) => !config.hideCard,
    );

    const _cards: WidgetCardProps[] = cards.map((config) => {
      const {
        columns,
        detachFromLayout = false,
        displayName,
        iconSVG,
        key,
        rows,
        searchTags,
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
        searchTags,
      };
    });
    const sortedCards = sortBy(_cards, ["displayName"]);
    return sortedCards;
  },
);

export const computeMainContainerWidget = (
  widget: FlattenedWidgetProps,
  mainCanvasProps: MainCanvasReduxState,
) => ({
  ...widget,
  rightColumn: mainCanvasProps.width,
  minHeight: mainCanvasProps.height,
});

export const getMainContainer = (
  canvasWidgets: CanvasWidgetsReduxState,
  evaluatedDataTree: DataTree,
  mainCanvasProps: MainCanvasReduxState,
) => {
  const canvasWidget = computeMainContainerWidget(
    canvasWidgets[MAIN_CONTAINER_WIDGET_ID],
    mainCanvasProps,
  );

  //TODO: Need to verify why `evaluatedDataTree` is required here.
  const evaluatedWidget = find(evaluatedDataTree, {
    widgetId: MAIN_CONTAINER_WIDGET_ID,
  }) as DataTreeWidget;
  return createCanvasWidget(canvasWidget, evaluatedWidget);
};

export const getCanvasWidgetDsl = createSelector(
  getCanvasWidgets,
  getDataTree,
  getLoadingEntities,
  getMainCanvasProps,
  (
    canvasWidgets: CanvasWidgetsReduxState,
    evaluatedDataTree,
    loadingEntities,
    mainCanvasProps,
  ): ContainerWidgetProps<WidgetProps> => {
    const widgets: Record<string, DataTreeWidget> = {
      [MAIN_CONTAINER_WIDGET_ID]: getMainContainer(
        canvasWidgets,
        evaluatedDataTree,
        mainCanvasProps,
      ),
    };
    Object.keys(canvasWidgets)
      .filter((each) => each !== MAIN_CONTAINER_WIDGET_ID)
      .forEach((widgetKey) => {
        const canvasWidget = canvasWidgets[widgetKey];
        const evaluatedWidget = find(evaluatedDataTree, {
          widgetId: widgetKey,
        }) as DataTreeWidget;
        if (evaluatedWidget) {
          widgets[widgetKey] = createCanvasWidget(
            canvasWidget,
            evaluatedWidget,
          );
        } else {
          widgets[widgetKey] = createLoadingWidget(canvasWidget);
        }
        widgets[widgetKey].isLoading = loadingEntities.has(
          canvasWidget.widgetName,
        );
      });

    return CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets: widgets,
    });
  },
);

export const getChildWidgets = createSelector(
  [
    getCanvasWidgets,
    getDataTree,
    getLoadingEntities,
    (_state: AppState, widgetId: string) => widgetId,
  ],
  buildChildWidgetTree,
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

const getWidgetSpacesForContainer = (
  containerWidgetId: string,
  widgets: FlattenedWidgetProps[],
): WidgetSpace[] => {
  return widgets.map((widget) => {
    const hasAutoHeight = isAutoHeightEnabledForWidget(widget);
    const fixedHeight = hasAutoHeight
      ? widget.bottomRow - widget.topRow
      : undefined;
    const occupiedSpace: WidgetSpace = {
      id: widget.widgetId,
      parentId: containerWidgetId,
      left: widget.leftColumn,
      top: widget.topRow,
      bottom: widget.bottomRow,
      right: widget.rightColumn,
      type: widget.type,
      fixedHeight,
    };
    return occupiedSpace;
  });
};

/**
 * Method to build occupied spaces
 *
 * @param widgets canvas Widgets
 * @param fetchNow would return undefined if false
 * @returns An array of occupied spaces
 */
const generateOccupiedSpacesMap = (
  widgets: CanvasWidgetsReduxState,
  fetchNow = true,
): { [containerWidgetId: string]: OccupiedSpace[] } | undefined => {
  const occupiedSpaces: {
    [containerWidgetId: string]: OccupiedSpace[];
  } = {};
  if (!fetchNow) return;
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
};

// returns occupied spaces
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
        // TODO: PERF_FIX (abhinav): This is iterating over all widgets for every widget which has children
        // We can optimise this by iterating through the children for each widget which has children
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

export const getOccupiedSpacesGroupedByParentCanvas = createSelector(
  getWidgets,
  (
    widgets: CanvasWidgetsReduxState,
  ): {
    occupiedSpaces: {
      [parentCanvasWidgetId: string]: Array<
        OccupiedSpace & { originalTop: number; originalBottom: number }
      >;
    };
    canvasLevelMap: Record<string, number>;
  } => {
    const occupiedSpaces: {
      [parentCanvasWidgetId: string]: Array<
        OccupiedSpace & { originalTop: number; originalBottom: number }
      >;
    } = {};
    // Get all widgets with type "CANVAS_WIDGET" and has children
    // What we're really doing is getting all widgets inside a drop target
    const canvasWidgets: FlattenedWidgetProps[] = Object.values(widgets).filter(
      (widget) => widget.type === "CANVAS_WIDGET",
    );

    // Levels signify how deeply nested a canvas is.
    // For example, the main canvas is always at level 0, if a container exists on the canvas
    // Then the canvas within this container will be level 1, and so on.
    const canvasLevelMap: Record<string, number> = {};

    // If we have any canvas widgets
    if (canvasWidgets) {
      // Iterate through the list of canvas widgets
      canvasWidgets.forEach((canvasWidget: FlattenedWidgetProps) => {
        // Set the canvas widget id
        const canvasWidgetId = canvasWidget.widgetId;

        // Get the nesting level of this Canvas:
        let parentId = canvasWidget.parentId;
        let level = 0;
        while (parentId) {
          const parent = widgets[parentId];
          if (parent.type === "CANVAS_WIDGET") level++;
          parentId = parent.parentId;
        }
        canvasLevelMap[canvasWidget.widgetId] = level;
        // Initialise the occupied spaces with an empty array
        occupiedSpaces[canvasWidgetId] = [];
        // If this canvas widget has children
        if (canvasWidget.children && canvasWidget.children.length > 0) {
          // Iterate through all children
          canvasWidget.children.forEach((childWidgetId: string) => {
            // Get the widget props
            const widget = widgets[childWidgetId];
            // If the widget is not detached from layout, which means
            // They actually exist by being displayed within the canvas
            // (unlike a modal widget or another canvas widget)
            if (!widget.detachFromLayout) {
              // Add the occupied space co-ordinates to the initialised array
              occupiedSpaces[canvasWidgetId].push({
                id: widget.widgetId,
                parentId: canvasWidgetId,
                left: widget.leftColumn,
                top: widget.topRow,
                bottom: widget.bottomRow,
                right: widget.rightColumn,
                originalTop: widget.originalTopRow,
                originalBottom: widget.originalBottomRow,
              });
            }
          });
        }
      });
    }

    // Return the occupied spaces and the canvas levels.
    // In an empty canvas occupied spaces will be like so: { "0": [] }
    return { occupiedSpaces, canvasLevelMap };
  },
);

// returns occupied spaces only while dragging or moving
export const getOccupiedSpacesWhileMoving = createSelector(
  getWidgets,
  getIsDraggingOrResizing,
  generateOccupiedSpacesMap,
);

/**
 *
 * @param widgets
 * @param fetchNow returns undined if false
 * @param containerId id of container whose occupied spaces we are fetching
 * @returns
 */
const generateOccupiedSpacesForContainer = (
  widgets: CanvasWidgetsReduxState,
  fetchNow: boolean,
  containerId: string | undefined,
): OccupiedSpace[] | undefined => {
  if (containerId === null || containerId === undefined || !fetchNow)
    return undefined;

  const containerWidget: FlattenedWidgetProps = widgets[containerId];

  if (!containerWidget || !containerWidget.children) return undefined;

  // Get child widgets for the container
  const childWidgets = Object.keys(widgets).filter(
    (widgetId) =>
      containerWidget.children &&
      containerWidget.children.indexOf(widgetId) > -1 &&
      !widgets[widgetId].detachFromLayout,
  );

  const occupiedSpaces = getOccupiedSpacesForContainer(
    containerId,
    childWidgets.map((widgetId) => widgets[widgetId]),
  );
  return occupiedSpaces;
};

// same as getOccupiedSpaces but gets only the container specific ocupied Spaces
export function getOccupiedSpacesSelectorForContainer(
  containerId: string | undefined,
) {
  return createSelector(getWidgets, (widgets: CanvasWidgetsReduxState) => {
    return generateOccupiedSpacesForContainer(widgets, true, containerId);
  });
}

/**
 *
 * @param widgets
 * @param fetchNow returns undined if false
 * @param containerId id of container whose occupied spaces we are fetching
 * @returns
 */
const generateWidgetSpacesForContainer = (
  widgets: CanvasWidgetsReduxState,
  fetchNow: boolean,
  containerId: string | undefined,
): WidgetSpace[] | undefined => {
  if (containerId === null || containerId === undefined || !fetchNow)
    return undefined;

  const containerWidget: FlattenedWidgetProps = widgets[containerId];

  if (!containerWidget || !containerWidget.children) return undefined;

  // Get child widgets for the container
  const childWidgets = Object.keys(widgets).filter(
    (widgetId) =>
      containerWidget.children &&
      containerWidget.children.indexOf(widgetId) > -1 &&
      !widgets[widgetId].detachFromLayout,
  );

  const occupiedSpaces = getWidgetSpacesForContainer(
    containerId,
    childWidgets.map((widgetId) => widgets[widgetId]),
  );
  return occupiedSpaces;
};

// same as getOccupiedSpaces but gets only the container specific ocupied Spaces only while resizing
export function getContainerOccupiedSpacesSelectorWhileResizing(
  containerId: string | undefined,
) {
  return createSelector(
    getWidgets,
    getIsResizing,
    (widgets: CanvasWidgetsReduxState, isResizing: boolean) => {
      return generateOccupiedSpacesForContainer(
        widgets,
        isResizing,
        containerId,
      );
    },
  );
}

// same as getOccupiedSpaces but gets only the container specific occupied Spaces
export function getContainerWidgetSpacesSelector(
  containerId: string | undefined,
) {
  return createSelector(getWidgets, (widgets: CanvasWidgetsReduxState) => {
    return generateWidgetSpacesForContainer(widgets, true, containerId);
  });
}

// same as getOccupiedSpaces but gets only the container specific occupied Spaces
export function getContainerWidgetSpacesSelectorWhileMoving(
  containerId: string | undefined,
) {
  return createSelector(
    getWidgets,
    getIsDraggingOrResizing,
    (widgets: CanvasWidgetsReduxState, isDraggingOrResizing: boolean) => {
      return generateWidgetSpacesForContainer(
        widgets,
        isDraggingOrResizing,
        containerId,
      );
    },
  );
}
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

export const getJSCollectionById = createSelector(
  [
    getJSCollections,
    (state: any, props: any) => props.match.params.collectionId,
  ],
  (jsActions, id) => {
    const action = jsActions.find((action) => action.config.id === id);
    if (action) {
      return action.config;
    } else {
      return undefined;
    }
  },
);

export const getApplicationLastDeployedAt = (state: AppState) =>
  state.ui.applications.currentApplication?.lastDeployedAt;

/**
 * returns the `state.ui.editor.isPreviewMode`
 *
 * @param state AppState
 * @returns boolean
 */
export const previewModeSelector = (state: AppState) => {
  return state.ui.editor.isPreviewMode;
};

/**
 * returns the `state.ui.editor.zoomLevel`
 *
 * @param state AppState
 * @returns number
 */
export const getZoomLevel = (state: AppState) => {
  return state.ui.editor.zoomLevel;
};

/**
 * returns the `state.ui.editor.savingEntity`
 *
 * @param state AppState
 * @returns boolean
 */
export const getIsSavingEntity = (state: AppState) =>
  state.ui.editor.loadingStates.savingEntity;

export const selectJSCollections = (state: AppState) =>
  state.entities.jsActions;

export const showCanvasTopSectionSelector = createSelector(
  getCanvasWidgets,
  previewModeSelector,
  getCurrentPageId,
  (canvasWidgets, inPreviewMode, pageId) => {
    const state = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEYS.CANVAS_CARDS_STATE) ?? "{}",
    );
    if (
      !state[pageId] ||
      Object.keys(canvasWidgets).length > 1 ||
      inPreviewMode
    )
      return false;

    return true;
  },
);
