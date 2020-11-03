import { createSelector } from "reselect";

import { AppState } from "reducers";
import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import {
  WIDGET_STATIC_PROPS,
  WidgetCardProps,
  WidgetProps,
} from "widgets/BaseWidget";
import { WidgetSidebarReduxState } from "reducers/uiReducers/widgetSidebarReducer";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { PageListReduxState } from "reducers/entityReducers/pageListReducer";

import { OccupiedSpace } from "constants/editorConstants";
import { getDataTree } from "selectors/dataTreeSelectors";
import _ from "lodash";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { DataTreeWidget, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getActions, getWidgetsMeta } from "sagas/selectors";

import * as log from "loglevel";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getCanvasWidgets } from "./entitiesSelector";
import { MetaState } from "../reducers/entityReducers/metaReducer";
import { WidgetTypes } from "../constants/WidgetConstants";

const getWidgetConfigs = (state: AppState) => state.entities.widgetConfig;
const getWidgetSideBar = (state: AppState) => state.ui.widgetSidebar;
const getPageListState = (state: AppState) => state.entities.pageList;
export const getDataSources = (state: AppState) =>
  state.entities.datasources.list;

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

  Object.keys(savingApis).forEach(apiId => {
    areApisSaving = savingApis[apiId] || areApisSaving;
  });

  return state.ui.editor.loadingStates.saving || areApisSaving;
};

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

export const getCurrentPageName = createSelector(
  getPageListState,
  (pageList: PageListReduxState) =>
    pageList.pages.find(page => page.pageId === pageList.currentPageId)
      ?.pageName,
);

export const getWidgetCards = createSelector(
  getWidgetSideBar,
  getWidgetConfigs,
  (
    widgetCards: WidgetSidebarReduxState,
    widgetConfigs: WidgetConfigReducerState,
  ) => {
    const cards = widgetCards.cards;
    const groups: string[] = Object.keys(cards);
    groups.forEach((group: string) => {
      cards[group] = cards[group].map((widget: WidgetCardProps) => {
        const { rows, columns } = widgetConfigs.config[widget.type];
        return { ...widget, rows, columns };
      });
    });
    return cards;
  },
);

export const getCanvasWidgetDsl = createSelector(
  getCanvasWidgets,
  getDataTree,
  (
    canvasWidgets: CanvasWidgetsReduxState,
    evaluatedDataTree,
  ): ContainerWidgetProps<WidgetProps> => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CONSTRUCT_CANVAS_DSL,
    );
    const widgets: Record<string, DataTreeWidget> = {};
    Object.keys(canvasWidgets).forEach(widgetKey => {
      const canvasWidget = canvasWidgets[widgetKey];
      const evaluatedWidget = evaluatedDataTree[
        canvasWidget.widgetName
      ] as DataTreeWidget;
      if (evaluatedWidget) {
        widgets[widgetKey] = createCanvasWidget(canvasWidget, evaluatedWidget);
      } else {
        widgets[widgetKey] = createLoadingWidget(canvasWidget);
      }
    });

    const denormalizedWidgets = CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets: widgets,
    });
    PerformanceTracker.stopTracking();
    return denormalizedWidgets;
  },
);

const getOccupiedSpacesForContainer = (
  containerWidgetId: string,
  widgets: FlattenedWidgetProps[],
): OccupiedSpace[] => {
  return widgets.map(widget => {
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
    ).filter(widget => widget.children && widget.children.length > 0);

    // If we have any container widgets
    if (containerWidgets) {
      containerWidgets.forEach((containerWidget: FlattenedWidgetProps) => {
        const containerWidgetId = containerWidget.widgetId;
        // Get child widgets for the container
        const childWidgets = Object.keys(widgets).filter(
          widgetId =>
            containerWidget.children &&
            containerWidget.children.indexOf(widgetId) > -1 &&
            !widgets[widgetId].detachFromLayout,
        );
        // Get the occupied spaces in this container
        // Assign it to the containerWidgetId key in occupiedSpaces
        occupiedSpaces[containerWidgetId] = getOccupiedSpacesForContainer(
          containerWidgetId,
          childWidgets.map(widgetId => widgets[widgetId]),
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
    const action = actions.find(action => action.config.id === id);
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
    isLoading: true,
  };
};
