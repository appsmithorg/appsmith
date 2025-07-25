import { createSelector } from "reselect";

import type { DefaultRootState } from "react-redux";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type {
  AppLayoutConfig,
  PageListReduxState,
} from "reducers/entityReducers/pageListReducer";
import type { WidgetCardProps, WidgetProps } from "widgets/BaseWidget";

import { ApplicationVersion } from "ee/actions/applicationActions";
import type {
  OccupiedSpace,
  WidgetSpace,
} from "constants/CanvasEditorConstants";
import { PLACEHOLDER_APP_SLUG, PLACEHOLDER_PAGE_SLUG } from "constants/routes";
import { DefaultDimensionMap, RenderModes } from "constants/WidgetConstants";
import { APP_MODE } from "entities/App";
import { find, sortBy } from "lodash";
import {
  getDataTree,
  getLoadingEntities,
  getConfigTree,
} from "selectors/dataTreeSelectors";
import type { MainCanvasReduxState } from "ee/reducers/uiReducers/mainCanvasReducer";

import { getActionEditorSavingMap } from "PluginActionEditor/store";
import {
  getCanvasWidgets,
  getAllJSCollectionActions,
  getJSCollections,
} from "ee/selectors/entitiesSelector";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import { buildChildWidgetTree } from "utils/widgetRenderUtils";
import { LOCAL_STORAGE_KEYS } from "utils/localStorage";
import type { CanvasWidgetStructure } from "WidgetProvider/types";
import { denormalize } from "utils/canvasStructureHelpers";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";
import WidgetFactory from "WidgetProvider/factory";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { getIsAnonymousDataPopupVisible } from "./onboardingSelectors";
import { WDS_V2_WIDGET_MAP } from "widgets/wds/constants";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "./layoutSystemSelectors";
import { protectedModeSelector } from "./gitSyncSelectors";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { Page } from "entities/Page";
import { objectKeys } from "@appsmith/utils";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import { ActionRunBehaviour } from "PluginActionEditor/types/PluginActionTypes";
import { getWidgetConfigsVersion } from "WidgetProvider/factory/widgetConfigVersion";

const getIsDraggingOrResizing = (state: DefaultRootState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

const getIsResizing = (state: DefaultRootState) =>
  state.ui.widgetDragResize.isResizing;

const getPageListState = (state: DefaultRootState) => state.entities.pageList;

const getWidgets = (state: DefaultRootState): CanvasWidgetsReduxState =>
  state.entities.canvasWidgets;

export const getIsEditorInitialized = (state: DefaultRootState) =>
  state.ui.editor.initialized;

export const getIsWidgetConfigBuilt = (state: DefaultRootState) =>
  state.ui.editor.widgetConfigBuilt;

export const getIsEditorLoading = (state: DefaultRootState) =>
  state.ui.editor.loadingStates.loading;

export const getIsFetchingPage = (state: DefaultRootState) =>
  state.ui.editor.loadingStates.isPageSwitching;

export const getLoadingError = (state: DefaultRootState) =>
  state.ui.editor.loadingStates.loadingError;

export const getIsPageSaving = createSelector(
  [
    getActionEditorSavingMap,
    (state: DefaultRootState) => state.ui.jsPane.isSaving,
    (state: DefaultRootState) => state.ui.appTheming.isSaving,
    (state: DefaultRootState) =>
      state.ui.applications.isSavingNavigationSetting,
    (state: DefaultRootState) => state.ui.editor.loadingStates.savingEntity,
    (state: DefaultRootState) => state.ui.editor.loadingStates.saving,
  ],
  (
    savingActions,
    savingJSObjects,
    isSavingAppTheme,
    isSavingNavigationSetting,
    isEditorSavingEntity,
    isEditorSaving,
  ) => {
    const areActionsSaving = objectKeys(savingActions).some(
      (actionId) => savingActions[actionId],
    );
    const areJsObjectsSaving = objectKeys(savingJSObjects).some(
      (collectionId) => savingJSObjects[collectionId],
    );

    return (
      isEditorSavingEntity ||
      areActionsSaving ||
      areJsObjectsSaving ||
      isSavingAppTheme ||
      isEditorSaving ||
      isSavingNavigationSetting
    );
  },
);

export const snipingModeSelector = (state: DefaultRootState) =>
  state.ui.editor.isSnipingMode;

export const snipingModeBindToSelector = (state: DefaultRootState) =>
  state.ui.editor.snipModeBindTo;

export const getPageSavingError = (state: DefaultRootState) => {
  return state.ui.editor.loadingStates.savingError;
};

export const getCurrentPageId = (state: DefaultRootState) =>
  state.entities.pageList.currentPageId;

export const getLayoutOnLoadActions = (state: DefaultRootState) =>
  state.ui.editor.pageActions || [];

export const getLayoutOnUnloadActions = createSelector(
  getCurrentPageId,
  getAllJSCollectionActions,
  (currentPageId, jsActions) =>
    jsActions.filter(
      (action) =>
        action.runBehaviour === ActionRunBehaviour.ON_PAGE_UNLOAD &&
        action.pageId === currentPageId,
    ),
);

export const getLayoutOnLoadIssues = (state: DefaultRootState) => {
  return state.ui.editor.layoutOnLoadActionErrors || [];
};

export const getOnLoadActionsWithExecutionStatus = (state: DefaultRootState) =>
  state.ui.editor.onLoadActionExecution;

export const getIsPublishingApplication = (state: DefaultRootState) =>
  state.ui.editor.loadingStates.publishing;

export const getPublishingError = (state: DefaultRootState) =>
  state.ui.editor.loadingStates.publishingError;

export const getCurrentLayoutId = (
  state: DefaultRootState,
): string | undefined => state.ui.editor.currentLayoutId;

export const getPageList = (state: DefaultRootState) =>
  state.entities.pageList.pages;

export const getPageById = (pageId: string) =>
  createSelector(getPageList, (pages: Page[]) =>
    pages.find((page) => page.pageId === pageId),
  );

export const getPageByBaseId = (basePageId: string) =>
  createSelector(getPageList, (pages: Page[]) =>
    pages.find((page) => page.basePageId === basePageId),
  );

export const getCurrentBasePageId = (state: DefaultRootState) =>
  state.entities.pageList.currentBasePageId;

export const getCurrentPagePermissions = createSelector(
  getCurrentPageId,
  getPageList,
  (pageId, pages) => {
    pages.find((page) => page.pageId === pageId);
  },
);

export const getPagePermissions = (state: DefaultRootState) => {
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

export const getCurrentPageDescription = createSelector(
  getCurrentPageId,
  getPageList,
  (pageId, pages) => pages.find((page) => page.pageId === pageId)?.description,
);

export const selectPageSlugToIdMap = createSelector(getPageList, (pages) =>
  pages.reduce(
    (acc, page: Page) => {
      // Comeback
      acc[page.pageId] = page.slug || "";

      return acc;
    },
    {} as Record<string, string>,
  ),
);

export const getCurrentApplicationId = (state: DefaultRootState) =>
  state.entities.pageList.applicationId || "";

export const getCurrentBaseApplicationId = (state: DefaultRootState) =>
  state.entities.pageList.baseApplicationId || "";

export const selectCurrentApplicationSlug = (state: DefaultRootState) =>
  state.ui.applications.currentApplication?.slug || PLACEHOLDER_APP_SLUG;

export const selectApplicationVersion = (state: DefaultRootState) =>
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
    const currentPage: Page | undefined = pages.find(
      (page) => page.pageId === pageId,
    );
    const pageSlug = currentPage?.slug || PLACEHOLDER_PAGE_SLUG;
    const customSlug = currentPage?.customSlug;

    return { applicationSlug, pageSlug, customSlug };
  },
);

export const getRenderMode = (state: DefaultRootState) => {
  return state.entities.app.mode === APP_MODE.EDIT
    ? RenderModes.CANVAS
    : RenderModes.PAGE;
};

export const getIsViewMode = (state: DefaultRootState) =>
  state.entities.app.mode === APP_MODE.PUBLISHED;

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

const defaultLayout: AppLayoutConfig = {
  type: "FLUID",
};

const getAppLayout = (state: DefaultRootState) =>
  state.ui.applications.currentApplication?.appLayout || defaultLayout;

export const getIsMobileCanvasLayout = createSelector(
  getAppLayout,
  (appLayout: AppLayoutConfig) => appLayout.type === "MOBILE",
);

export const getIsAutoLayout = createSelector(
  getLayoutSystemType,
  (layoutSystemType) => layoutSystemType === LayoutSystemTypes.AUTO,
);

export const getCurrentApplicationLayout = createSelector(
  getAppLayout,
  getLayoutSystemType,
  (appLayout: AppLayoutConfig, layoutSystemType) => {
    return layoutSystemType === LayoutSystemTypes.FIXED
      ? appLayout
      : defaultLayout;
  },
);

export const getCanvasWidth = (state: DefaultRootState) =>
  state.ui.mainCanvas.width;
export const getMainCanvasProps = (state: DefaultRootState) =>
  state.ui.mainCanvas;

export const getMetaWidgets = (state: DefaultRootState) =>
  state.entities.metaWidgets;

/**
 * What are template meta widgets?
 *
 * A template meta widget is as meta widget which can be used as a template widget.
 * At the time of writing this, the use of template widget is with the List widget, where
 * a template widget is any widget that is dropped inside the List widget first row canvas.
 *
 * Why do we need a template meta widget?
 *
 * A list widget take the template widgets and clones it multiple times and renders it as rows.
 * These template widgets in an app of a list widget reside in canvasWidget reducer and is part of the
 * DSL. But when a list widget is part of a UI module and this UI module is used in an app, all the widget
 * under this module widget are meta widget inlcuding the list widget itself. Since all the widget are meta
 * widgets and the list widget also genereates meta widgets, we need to have a way to identify these template
 * widgets and feed it to the List widget so that it can replicate and behave natively.
 *
 * How do we identify a template meta widget?
 *
 * A template meta widget is any meta widget which has the property `isTemplate` set to true.
 * The usage of this property is upon the widget to decide how to use it and currently only the List widget
 * uses this property.
 *
 */

export const getTemplateMetaWidgets = createSelector(
  getMetaWidgets,
  (metaWidgets) => {
    const templateMetaWidgets: MetaWidgetsReduxState = {};

    Object.values(metaWidgets).forEach((metaWidget) => {
      if (metaWidget.isTemplate) {
        templateMetaWidgets[metaWidget.widgetId] = metaWidget;
      }
    });

    return templateMetaWidgets;
  },
);

export const getMetaWidget = (metaWidgetId: string) =>
  createSelector(getMetaWidgets, (metaWidgets) => {
    return metaWidgets[metaWidgetId];
  });

export const getMetaWidgetChildrenStructure = (
  parentWidgetId: string,
  type: string,
  hasMetaWidgets = false,
) =>
  createSelector(getMetaWidgets, (metaWidgets) => {
    if (!hasMetaWidgets) return [];

    const structure: CanvasWidgetStructure[] = [];

    Object.values(metaWidgets).forEach((metaWidget) => {
      if (metaWidget.parentId === parentWidgetId) {
        structure.push(
          denormalize(metaWidget.widgetId, metaWidgets, {
            widgetTypeForHaltingRecursion: type,
          }),
        );
      }
    });

    return structure;
  });

export const getCurrentPageName = createSelector(
  getPageListState,
  (pageList: PageListReduxState) =>
    pageList.pages.find((page) => page.pageId === pageList.currentPageId)
      ?.pageName,
);

const isModuleWidget = (
  config: ReturnType<typeof WidgetFactory.getConfigs>[string],
) => config.type.startsWith("MODULE_WIDGET_");

export const getWidgetCards = createSelector(
  getIsAutoLayout,
  getIsAnvilLayout,
  getWidgetConfigsVersion, // Add dependency on widget configs version
  (isAutoLayout, isAnvilLayout) => {
    const widgetConfigs = WidgetFactory.getConfigs();
    const widgetConfigsArray = Object.values(widgetConfigs);
    const layoutSystemBasesWidgets = widgetConfigsArray.filter((config) => {
      const isAnvilWidget = Object.values(WDS_V2_WIDGET_MAP).includes(
        config.type,
      );

      if (isAnvilLayout) {
        return isAnvilWidget;
      }

      return !isAnvilWidget;
    });
    const cards = layoutSystemBasesWidgets.filter((config) => {
      if (isAirgapped()) {
        return config.widgetName !== "Map" && !config.hideCard;
      }

      return !config.hideCard && !isModuleWidget(config);
    });

    const _cards: WidgetCardProps[] = cards.map((config) => {
      const {
        detachFromLayout = false,
        displayName,
        displayOrder,
        iconSVG,
        isSearchWildcard,
        key,
        searchTags,
        tags,
        thumbnailSVG,
        type,
      } = config;
      let { columns, rows } = config;
      const autoLayoutConfig = WidgetFactory.getWidgetAutoLayoutConfig(type);

      if (isAutoLayout && autoLayoutConfig) {
        rows = autoLayoutConfig?.defaults?.rows ?? rows;
        columns = autoLayoutConfig?.defaults?.columns ?? columns;
      }

      const { IconCmp, ThumbnailCmp } = WidgetFactory.getWidgetMethods(
        config.type,
      );

      return {
        key,
        type,
        rows,
        columns,
        detachFromLayout,
        displayName,
        displayOrder,
        icon: iconSVG,
        thumbnail: thumbnailSVG,
        IconCmp,
        ThumbnailCmp,
        searchTags,
        tags,
        isDynamicHeight: isAutoHeightEnabledForWidget(config as WidgetProps),
        isSearchWildcard: isSearchWildcard,
      };
    });
    const sortedCards = sortBy(_cards, ["displayName"]);

    return sortedCards;
  },
);
const getIsMobileBreakPoint = (state: DefaultRootState) =>
  state.ui.mainCanvas.isMobile;

export const getIsAutoLayoutMobileBreakPoint = createSelector(
  getIsAutoLayout,
  getIsMobileBreakPoint,
  (isAutoLayout, isMobileBreakPoint) => {
    return isAutoLayout && isMobileBreakPoint;
  },
);

export const getDimensionMap = createSelector(
  getIsAutoLayoutMobileBreakPoint,
  (isAutoLayoutMobileBreakPoint: boolean) => {
    return isAutoLayoutMobileBreakPoint
      ? {
          leftColumn: "mobileLeftColumn",
          rightColumn: "mobileRightColumn",
          topRow: "mobileTopRow",
          bottomRow: "mobileBottomRow",
        }
      : DefaultDimensionMap;
  },
);
const addWidgetDimensionProxy = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dimensionMap: any,
  widgets: CanvasWidgetsReduxState,
) => {
  const dimensions = Object.keys(dimensionMap);
  const proxyHandler = {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(target: any, prop: any) {
      if (dimensions.includes(prop)) {
        const actualMap = dimensionMap[prop];

        if (!!target[actualMap]) {
          return target[actualMap];
        }
      }

      return Reflect.get(target, prop);
    },
  };

  return Object.keys(widgets).reduce((allWidgets, each) => {
    const widget = { ...allWidgets[each] };
    const proxyWidget = new Proxy(widget, proxyHandler);

    allWidgets = {
      ...allWidgets,
      [each]: proxyWidget,
    };

    return allWidgets;
  }, widgets);
};

export const getWidgetsForBreakpoint = createSelector(
  getDimensionMap,
  getIsAutoLayoutMobileBreakPoint,
  getWidgets,
  (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dimensionMap: any,
    isAutoLayoutMobileBreakPoint: boolean,
    widgets: CanvasWidgetsReduxState,
  ): CanvasWidgetsReduxState => {
    if (isAutoLayoutMobileBreakPoint) {
      return addWidgetDimensionProxy(dimensionMap, widgets);
    } else {
      return widgets;
    }
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

export const getChildWidgets = createSelector(
  [
    getCanvasWidgets,
    getMetaWidgets,
    getDataTree,
    getLoadingEntities,
    getConfigTree,
    (_state: DefaultRootState, widgetId: string) => widgetId,
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
  dimensionMap: typeof DefaultDimensionMap,
): WidgetSpace[] => {
  const {
    bottomRow: bottomRowMap,
    leftColumn: leftColumnMap,
    rightColumn: rightColumnMap,
    topRow: topRowMap,
  } = dimensionMap;

  return widgets.map((widget) => {
    const hasAutoHeight = isAutoHeightEnabledForWidget(widget);
    const fixedHeight = hasAutoHeight
      ? widget.bottomRow - widget.topRow
      : undefined;
    const occupiedSpace: WidgetSpace = {
      id: widget.widgetId,
      parentId: containerWidgetId,
      left: widget[leftColumnMap],
      top: widget[topRowMap],
      bottom: widget[bottomRowMap],
      right: widget[rightColumnMap],
      type: widget.type,
      isDropTarget: checkIsDropTarget(widget.type),
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
  dimensionMap = DefaultDimensionMap,
): { [containerWidgetId: string]: WidgetSpace[] } => {
  const occupiedSpaces: {
    [containerWidgetId: string]: WidgetSpace[];
  } = {};

  if (!fetchNow) return {};

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
      occupiedSpaces[containerWidgetId] = getWidgetSpacesForContainer(
        containerWidgetId,
        childWidgets.map((widgetId) => widgets[widgetId]),
        dimensionMap,
      );
    });
  }

  // Return undefined if there are no occupiedSpaces.
  return Object.keys(occupiedSpaces).length > 0 ? occupiedSpaces : {};
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
  getWidgetsForBreakpoint,
  (
    widgets: CanvasWidgetsReduxState,
  ): {
    occupiedSpaces: {
      [parentCanvasWidgetId: string]: Record<
        string,
        OccupiedSpace & { originalTop: number; originalBottom: number }
      >;
    };
    canvasLevelMap: Record<string, number>;
  } => {
    const occupiedSpaces: {
      [parentCanvasWidgetId: string]: Record<
        string,
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
        occupiedSpaces[canvasWidgetId] = {};

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
              occupiedSpaces[canvasWidgetId][widget.widgetId] = {
                id: widget.widgetId,
                parentId: canvasWidgetId,
                left: widget.leftColumn,
                top: widget.topRow,
                bottom: widget.bottomRow,
                right: widget.rightColumn,
                originalTop: widget.originalTopRow,
                originalBottom: widget.originalBottomRow,
              };
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
  getDimensionMap,
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
  dimensionMap: typeof DefaultDimensionMap,
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
    dimensionMap,
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
  return createSelector(
    getWidgets,
    getDimensionMap,
    (
      widgets: CanvasWidgetsReduxState,
      dimensionMap: typeof DefaultDimensionMap,
    ) => {
      return generateWidgetSpacesForContainer(
        widgets,
        true,
        containerId,
        dimensionMap,
      );
    },
  );
}

// same as getOccupiedSpaces but gets only the container specific occupied Spaces
export function getContainerWidgetSpacesSelectorWhileMoving(
  containerId: string | undefined,
) {
  return createSelector(
    getWidgets,
    getIsDraggingOrResizing,
    getDimensionMap,
    (
      widgets: CanvasWidgetsReduxState,
      isDraggingOrResizing: boolean,
      dimensionMap,
    ) => {
      return generateWidgetSpacesForContainer(
        widgets,
        isDraggingOrResizing,
        containerId,
        dimensionMap,
      );
    },
  );
}

export const getJSCollectionDataById = createSelector(
  [
    getJSCollections,
    (state: DefaultRootState, collectionId: string) => collectionId,
  ],
  (jsActions, collectionId) => {
    const action = jsActions.find(
      (action) => action.config.id === collectionId,
    );

    if (action) {
      return action;
    } else {
      return undefined;
    }
  },
);

export const getJSCollectionDataByBaseId = createSelector(
  [
    getJSCollections,
    (state: DefaultRootState, baseCollectionId: string) => baseCollectionId,
  ],
  (jsActions, baseCollectionId) => {
    const action = jsActions.find(
      (action) => action.config.baseId === baseCollectionId,
    );

    if (action) {
      return action;
    } else {
      return undefined;
    }
  },
);

export const getApplicationLastDeployedAt = (state: DefaultRootState) =>
  state.ui.applications.currentApplication?.lastDeployedAt;

/**
 * returns the `state.ui.editor.isPreviewMode`
 *
 * @param state DefaultRootState
 * @returns boolean
 */
export const previewModeSelector = (state: DefaultRootState) => {
  return state.ui.editor.isPreviewMode;
};

/**
 * This selector is used to identify if the application is in an edit-only state,
 * meaning it is in the canvas render mode but not in preview or protected mode.
 * This is useful for enabling or disabling certain UI elements or functionalities
 * that are only applicable in this specific mode.
 */
export const isEditOnlyModeSelector = createSelector(
  getRenderMode,
  previewModeSelector,
  protectedModeSelector,
  (renderMode, isPreviewMode, isProtectedMode) =>
    renderMode === RenderModes.CANVAS && !(isPreviewMode || isProtectedMode),
);

/**
 * returns the `state.ui.editor.zoomLevel`
 *
 * @param state DefaultRootState
 * @returns number
 */
export const getZoomLevel = (state: DefaultRootState) => {
  return state.ui.editor.zoomLevel;
};

/**
 * returns the `state.ui.editor.savingEntity`
 *
 * @param state DefaultRootState
 * @returns boolean
 */
export const getIsSavingEntity = (state: DefaultRootState) =>
  state.ui.editor.loadingStates.savingEntity;

export const selectJSCollections = (state: DefaultRootState) =>
  state.entities.jsActions;

export const showCanvasTopSectionSelector = createSelector(
  getCanvasWidgets,
  previewModeSelector,
  getCurrentPageId,
  getIsAnonymousDataPopupVisible,
  (canvasWidgets, inPreviewMode, pageId, isAnonymousDataPopupVisible) => {
    const state = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEYS.CANVAS_CARDS_STATE) ?? "{}",
    );

    if (
      !state[pageId] ||
      Object.keys(canvasWidgets).length > 1 ||
      inPreviewMode ||
      isAnonymousDataPopupVisible
    )
      return false;

    return true;
  },
);

export const getGsheetToken = (state: DefaultRootState) =>
  state.entities.datasources.gsheetToken;

export const getGsheetProjectID = (state: DefaultRootState) =>
  state.entities.datasources.gsheetProjectID;
