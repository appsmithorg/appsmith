import { createSelector } from "reselect";

import { AppState } from "reducers";
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
  WIDGET_STATIC_PROPS,
} from "constants/WidgetConstants";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import {
  DataTree,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { find, pick, sortBy } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import { APP_MODE } from "entities/App";
import { getDataTree, getLoadingEntities } from "selectors/dataTreeSelectors";
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { PLACEHOLDER_APP_SLUG, PLACEHOLDER_PAGE_SLUG } from "constants/routes";
import { ApplicationVersion } from "actions/applicationActions";
import { MainCanvasReduxState } from "reducers/uiReducers/mainCanvasReducer";

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
  state.ui.editor?.isSnipingMode;

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

export const getPageById = (pageId: string) =>
  createSelector(getPageList, (pages: Page[]) =>
    pages.find((page) => page.pageId === pageId),
  );

export const getCurrentPageId = (state: AppState) =>
  state.entities.pageList.currentPageId;

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

export const getRenderMode = (state: AppState) =>
  state.entities.app.mode === APP_MODE.EDIT
    ? RenderModes.CANVAS
    : RenderModes.PAGE;

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

const getMainContainer = (
  canvasWidgets: CanvasWidgetsReduxState,
  evaluatedDataTree: DataTree,
  mainCanvasProps: MainCanvasReduxState,
) => {
  const canvasWidget = {
    ...canvasWidgets[MAIN_CONTAINER_WIDGET_ID],
    rightColumn: mainCanvasProps.width,
    minHeight: mainCanvasProps.height,
  };
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
    const occupiedSpace: WidgetSpace = {
      id: widget.widgetId,
      parentId: containerWidgetId,
      left: widget.leftColumn,
      top: widget.topRow,
      bottom: widget.bottomRow,
      right: widget.rightColumn,
      type: widget.type,
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

// same as getOccupiedSpaces but gets only the container specific ocupied Spaces
export function getOccupiedSpacesSelectorForContainer(
  containerId: string | undefined,
) {
  return createSelector(getWidgets, (widgets: CanvasWidgetsReduxState):
    | OccupiedSpace[]
    | undefined => {
    if (containerId === null || containerId === undefined) return undefined;

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
  });
}

// same as getOccupiedSpaces but gets only the container specific occupied Spaces
export function getWidgetSpacesSelectorForContainer(
  containerId: string | undefined,
) {
  return createSelector(getWidgets, (widgets: CanvasWidgetsReduxState):
    | WidgetSpace[]
    | undefined => {
    if (containerId === null || containerId === undefined) return undefined;

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
  });
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

const createCanvasWidget = (
  canvasWidget: FlattenedWidgetProps,
  evaluatedWidget: DataTreeWidget,
) => {
  const widgetStaticProps = pick(
    canvasWidget,
    Object.keys(WIDGET_STATIC_PROPS),
  );
  return {
    ...evaluatedWidget,
    ...widgetStaticProps,
  };
};

const WidgetTypes = WidgetFactory.widgetTypes;
const createLoadingWidget = (
  canvasWidget: FlattenedWidgetProps,
): DataTreeWidget => {
  const widgetStaticProps = pick(
    canvasWidget,
    Object.keys(WIDGET_STATIC_PROPS),
  ) as WidgetProps;
  return {
    ...widgetStaticProps,
    type: WidgetTypes.SKELETON_WIDGET,
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    bindingPaths: {},
    reactivePaths: {},
    triggerPaths: {},
    validationPaths: {},
    logBlackList: {},
    isLoading: true,
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    privateWidgets: {},
    meta: {},
  };
};

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
